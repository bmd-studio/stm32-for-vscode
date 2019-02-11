// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// import { fstat } from 'fs';
// import { start } from 'repl';
const fs = require('fs');
const path = require('path');
const _ =  require('lodash');

//TODO: make sure main.c is transformed and deleted into main.cpp

let targetName = '';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
		console.log('Congratulations, your extension "stm32-for-vscode" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World VSCode Say something different! Dicks');
	});

	const initCommand = vscode.commands.registerCommand('extension.initSTM', () => {
		// Should add cpp_properties json
		// Should add build and debug in launch.json
		openLaunchFile();
		// vscode.workspace.findFiles('launch.json').then((uris) => {
		// 	console.log('found files', uris);
		// });

	});

	const buildCommand = vscode.commands.registerCommand('extension.buildSTM', () => {
		// buildNew();
		buildCPP(null);
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(buildCommand);
	context.subscriptions.push(initCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {}

export function openLaunchFile() {
	const url = `${vscode.workspace.rootPath}/.vscode/tasks.json`;
	console.log('reading file with adres:', url);
	vscode.workspace.openTextDocument(url).then((launchFile) => {
		console.log('launch file: ', launchFile);
		const theText = launchFile.getText();
		console.log('text file', theText);
		// const launchJSON = JSON.parse(launchFile.getText());
		// console.log('launch json', launchJSON);
	});
	console.log(vscode.workspace.rootPath);
	console.log('target name', targetName);
}
export function diretoryTreeToObj(dir, done) {
	var results = [];
    fs.readdir(dir, function(err, list) {
        if (err)
            return done(err);

        var pending = list.length;

        if (!pending)
            return done(null, {name: path.basename(dir), type: 'folder', children: results});

        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    diretoryTreeToObj(file, function(err, res) {
                        results.push({
                            name: path.basename(file),
                            type: 'folder',
							children: res,
							path: path.relative(vscode.workspace.rootPath, file)
                        });
                        if (!--pending)
                            done(null, results);
                    });
                }
                else {
                    results.push({
                        type: 'file',
						name: path.basename(file),
						path: path.relative(vscode.workspace.rootPath, file)
                    });
                    if (!--pending)
                        done(null, results);
                }
            });
        });
    });
};


export function getBuildFiles(fileTree) {
	let buildFiles = {
		cSources: [],
		cppSources: [],
		asmSources: [],
		subDirectories: [],
		linkerFile: {},
		driverFiles: [],
	};

	if (fileTree.length > 0 ) {
		fileTree.forEach((entry) => {
			const isDriverFile = entry.path.indexOf('CMSIS') >= 0;
			if(entry.type === 'file') {
				const extension = entry.name.split('.').pop();
				// if(extension != 's' && extension != 'c' && extension != 'cpp' && != 'ld') return;
				// console.log('extension is: ', extension);
				switch(extension) {
					case 's':
						buildFiles.asmSources.push(entry);
						break;
					case 'c':
						buildFiles.cSources.push(entry);
						break;
					case 'cpp':
						buildFiles.cppSources.push(entry);
						break;
					case 'ld':
						// console.log('linker file', entry);
						buildFiles.linkerFile = entry;
						break;
				}
			} else if(entry.type === 'folder' && !isDriverFile) {
				if(hasBuildFiles(entry)) {
					buildFiles.subDirectories.push(entry);
				}
				//do some recursion here
				const result = getBuildFiles(entry.children);

				// //now append these 
				// console.log('concatted res', buildFiles.cSources.concat(result.cSources)); 
				buildFiles.cSources = buildFiles.cSources.concat(result.cSources);
				buildFiles.cppSources = buildFiles.cppSources.concat(result.cppSources);
				buildFiles.asmSources = buildFiles.asmSources.concat(result.asmSources);
				buildFiles.subDirectories = buildFiles.subDirectories.concat(result.subDirectories);
				buildFiles.driverFiles = buildFiles.driverFiles.concat(result.driverFiles);
				if(!_.isEmpty(result.linkerFile)) {
					buildFiles.linkerFile = result.linkerFile;
				}
			}
			// console.log('files are', buildFiles);
		});
	}

	return buildFiles;
}

export function hasBuildFiles(fileTree) {
	let has = false;
	_.map(fileTree.children, (entry) => {
		if(entry.type === 'file') {
			const extension = entry.name.split('.').pop();
			if(extension === 's' || extension === 'c' || extension === 'cpp') {
				has = true;
			}
		}
	});
	return has;
}




export function createIncludes(sources) {
	//returns a string of includes
	// console.log('new sources', sources);
	let includesString = '-include sources.mk\n-include subdir.mk\n-include objects.mk\n';
	_.map(sources.subDirectories, (dir) => {
		if(dir.name === '.vscode' || _.toLower(dir.name) === 'release' || _.toLower(dir.name) === 'debug') return;
		includesString += `-include ${dir.path}/subdir.mk\n`
	});
	// console.log('create includes returns: ', includesString);
	return includesString;
}


export function buildCPP(callback) {
	console.log('starting build');
	vscode.workspace.findFiles('Makefile').then((uris) => {
		if(uris.length < 1) {
			vscode.window.showWarningMessage('no makefile found. Please init the STM project using CubeMX');
			return;
		}
		diretoryTreeToObj(vscode.workspace.rootPath, (err, list) => { 
			const files = getBuildFiles(list);
			returnMakeFileInfo(uris[0], (makeInfo) => {
				console.log('makeInfo', makeInfo);
				createMakeFile(list, makeInfo, (inf) => {
					console.log('hello!!!');
					let terminal = vscode.window.activeTerminal;
					if(!terminal) {
						terminal = vscode.window.createTerminal();
					}
					terminal.sendText('make');
				});
			});
			// console.log('files are...', files);
			
		});
	});
}

export function getTarget() {
	//TODO: Return the actual target
	return null;
}
export function getCortexType() {
	//TODO: return the actual type
	return 'cortex-m4';
}
export function getProjectName() {
	//TODO: Check if there is a better way to do this, which does not involve using the
	return vscode.workspace.rootPath.split('/').pop();
}
export function convertToSourceString(files) {
	if(!files || files.length <= 0) return '';
	let filesString = '';
	_.map(files, (file) => {
		filesString += `${file.path} \\\r\n`;
	});
	return filesString;
}

export function createMakeFile(fileList, makeInfo, callback ) {
	// console.log('filelist', fileList);
	const files = getBuildFiles(fileList);
	const cSources = convertToSourceString(files.cSources);
	const cppSources = convertToSourceString(files.cppSources);
	const asmSources = convertToSourceString(files.asmSources);

	const includes = createIncludes(files);
	// console.log('includes', includes);
	const linkerTarget = _.first(_.get(files, 'linkerFile.name', '').split('_'));
	if(_.isEmpty(linkerTarget)) {
		vscode.window.showErrorMessage('Linker script is not included please regenerate the project using CubeMX');
		return;
	}
	const target = getTarget() || linkerTarget;
	const cortexType = getCortexType();
	const projectName = getProjectName();

	console.log('make info', makeInfo);
	const makeFile = 
`##########################################################################################################################
# File automatically-generated by tool: [projectgenerator] version: [3.0.0] date: [Fri Jan 25 18:00:27 CET 2019]
##########################################################################################################################

# ------------------------------------------------
# Generic Makefile (based on gcc)
#
# ChangeLog :
#	2017-02-10 - Several enhancements + project update mode
#   2015-07-22 - first version
# ------------------------------------------------

######################################
# target
######################################
${makeInfo.target}


######################################
# building variables
######################################
# debug build?
DEBUG = 1
# optimization
OPT = -Og


#######################################
# paths
#######################################
# Build path
BUILD_DIR = build

######################################
# source
######################################
# C sources
C_SOURCES =  ${'\\'}
${cSources}

CPP_SOURCES = ${'\\'}
${cppSources}

# ASM sources
ASM_SOURCES =  ${'\\'}
${asmSources}


#######################################
# binaries
#######################################
PREFIX = arm-none-eabi-
# The gcc compiler bin path can be either defined in make command via GCC_PATH variable (> make GCC_PATH=xxx)
# either it can be added to the PATH environment variable.
ifdef GCC_PATH
CPP = $(GCC_PATH)/$(PREFIX)g++
CC = $(GCC_PATH)/$(PREFIX)gcc
AS = $(GCC_PATH)/$(PREFIX)gcc -x assembler-with-cpp
CP = $(GCC_PATH)/$(PREFIX)objcopy
SZ = $(GCC_PATH)/$(PREFIX)size
else
CPP = $(PREFIX)g++
CC = $(PREFIX)gcc
AS = $(PREFIX)gcc -x assembler-with-cpp
CP = $(PREFIX)objcopy
SZ = $(PREFIX)size
endif
HEX = $(CP) -O ihex
BIN = $(CP) -O binary -S
	
#######################################
# CFLAGS
#######################################
# cpu
${makeInfo.cpu}

# fpu
${makeInfo.fpu}

# float-abi
${makeInfo.floatAbi}

# mcu
${makeInfo.mcu}

# macros for gcc
# AS defines
AS_DEFS = 

# C defines
${makeInfo.cDefinitions}


# AS includes
AS_INCLUDES = 

# C includes
${makeInfo.cIncludes}


# compile gcc flags
ASFLAGS = $(MCU) $(AS_DEFS) $(AS_INCLUDES) $(OPT) -Wall -fdata-sections -ffunction-sections

CFLAGS = $(MCU) $(C_DEFS) $(C_INCLUDES) $(OPT) -Wall -fdata-sections -ffunction-sections

ifeq ($(DEBUG), 1)
CFLAGS += -g -gdwarf-2
endif


# Generate dependency information
CFLAGS += -MMD -MP -MF"$(@:%.o=%.d)"


#######################################
# LDFLAGS
#######################################
# link script
${makeInfo.linkerScript}

# libraries
LIBS = -lc -lm -lnosys 
LIBDIR = 
LDFLAGS = $(MCU) -specs=nano.specs -T$(LDSCRIPT) $(LIBDIR) $(LIBS) -Wl,-Map=$(BUILD_DIR)/$(TARGET).map,--cref -Wl,--gc-sections

# default action: build all
all: $(BUILD_DIR)/$(TARGET).elf $(BUILD_DIR)/$(TARGET).hex $(BUILD_DIR)/$(TARGET).bin


#######################################
# build the application
#######################################
# list of objects
OBJECTS = $(addprefix $(BUILD_DIR)/,$(notdir $(C_SOURCES:.c=.o)))
vpath %.c $(sort $(dir $(C_SOURCES)))
# list of cpp program objects
OBJECTS += $(addprefix $(BUILD_DIR)/,$(notdir $(CPP_SOURCES:.cpp=.o)))
vpath %.cpp $(sort $(dir $(CPP_SOURCES)))
# list of ASM program objects
OBJECTS += $(addprefix $(BUILD_DIR)/,$(notdir $(ASM_SOURCES:.s=.o)))
vpath %.s $(sort $(dir $(ASM_SOURCES)))

$(BUILD_DIR)/%.o: %.c Makefile | $(BUILD_DIR) 
	$(CC) -c $(CFLAGS) -Wa,-a,-ad,-alms=$(BUILD_DIR)/$(notdir $(<:.c=.lst)) $< -o $@
$(BUILD_DIR)/%.o: %.cpp Makefile | $(BUILD_DIR) 
	$(CC) -c $(CFLAGS) -Wa,-a,-ad,-alms=$(BUILD_DIR)/$(notdir $(<:.cpp=.lst)) $< -o $@

$(BUILD_DIR)/%.o: %.s Makefile | $(BUILD_DIR)
	$(AS) -c $(CFLAGS) $< -o $@

$(BUILD_DIR)/$(TARGET).elf: $(OBJECTS) Makefile
	$(CC) $(OBJECTS) $(LDFLAGS) -o $@
	$(SZ) $@

$(BUILD_DIR)/%.hex: $(BUILD_DIR)/%.elf | $(BUILD_DIR)
	$(HEX) $< $@
	
$(BUILD_DIR)/%.bin: $(BUILD_DIR)/%.elf | $(BUILD_DIR)
	$(BIN) $< $@	
	
$(BUILD_DIR):
	mkdir $@		

#######################################
# clean up
#######################################
clean:
	-rm -fR $(BUILD_DIR)
	
#######################################
# dependencies
#######################################
-include $(wildcard $(BUILD_DIR)/*.d)

# *** EOF ***`;
	// console.log('new make file is', makeFile);
	const makeFileDirPath = `${vscode.workspace.rootPath}/Makefile`;
	console.log('dir path is ', makeFileDirPath);
	fs.writeFile(makeFileDirPath, makeFile, function (error) {
		if (error) {
			console.log('error', error);
			return;
		}
		// console.log('Saved!');
		callback();
	});
}

export function returnMakeFileInfo(makeFileUri, callback) {
	let info = {};

	// console.log('makeFileUri', makeFileUri);
	vscode.workspace.openTextDocument(makeFileUri.path).then((result) => {
		const makeFileText = result.getText();
		let targetText = _.first(makeFileText.substr(makeFileText.indexOf('TARGET ='), 50).split('\n')).concat('\n');
		let cpuText = _.first(makeFileText.substr(makeFileText.indexOf('CPU ='), 50).split('\n')).concat('\n');
		let FPUText = _.first(makeFileText.substr(makeFileText.indexOf('FPU ='), 200).split('\n')).concat('\n');
		let floatAbiText = _.first(makeFileText.substr(makeFileText.indexOf('FLOAT-ABI ='), 200).split('\n')).concat('\n');
		let MCUText = _.first(makeFileText.substr(makeFileText.indexOf('MCU ='), 200).split('\n')).concat('\n');
		// let cDefs = _.first(makeFileText.substr(makeFileText.indexOf('C_DEFS ='), 200).split('\n')).concat('\n');
		// let cIncludes = _.first(makeFileText.substr(makeFileText.indexOf('C_INCLUDES ='), 200).split('\n')).concat('\n');
		let linkerScript = _.first(makeFileText.substr(makeFileText.indexOf('LDSCRIPT ='), 200).split('\n')).concat('\n');

		
		const cDefsArr = makeFileText.substr(makeFileText.indexOf('C_DEFS ='), 200).split('\n');
		let cDefs = '';
		let end = false;
		console.log('cdefs arr', cDefsArr);
		_.map(cDefsArr, (entry, ind) => {
			if(end) return;
			if(entry.indexOf(' \\') < 0) {
				cDefs += entry;
				end = true;
				return;
			}
			cDefs += `${entry}\n`;
		});
		console.log('c defs', cDefs);
		end = false;
		let cIncludes = '';
		const cIncludesArr = makeFileText.substr(makeFileText.indexOf('C_INCLUDES =')).split('\n');
		console.log('c includes arr', cIncludesArr);
		_.map(cIncludesArr, (entry) => {
			if(end) return;
			if(entry.indexOf(' \\') < 0) {
				cIncludes += entry;
				end = true;
				return;
			}
			cIncludes += `${entry}\n`;
		});
		console.log('cIncludes', cIncludes);
		
		info = {
			target: targetText,
			cpu: cpuText,
			fpu: FPUText,
			floatAbi: floatAbiText,
			mcu: MCUText,
			cDefinitions: cDefs,
			cIncludes: cIncludes,
			linkerScript: linkerScript,
		}
		callback(info);
		return;
	});
}

/* Function for updating the makefile. It recursively searches for new c files to append in the makefile
 * This makes sure that users do not have to input the in the makefile themselves
*/
export function createNewMakeFile(callback) {

	buildCPP(null);
	return;
}

export function buildNew() {
	// createNewMakeFile(() => {
	// 	// should build
	// 	// vscode.window.activeTerminal.
	// 	// vscode.commands.registerCommand()
	// 	let terminal = vscode.window.activeTerminal;
	// 	if(!terminal) {
	// 		terminal = vscode.window.createTerminal();
	// 	}
	// 	terminal.sendText('make');
	// });
	createNewMakeFile(null);
}


// const createTasks() {
// 	//first should get tasks.json
// 	// then should implement the standard tasks, with the correct project name
// }

// const createLaunch() {
// 	// first should get launch.json
// 	// then should implement the standard launch sequence using cortex debug
// }

// const createCPPProperties() {
// 	// first should get c_cpp_properties.json
// 	// then should implement custom definitions
// }

const standardTasks = [
	{
		"label": "Load Firmware",
		"type": "shell",
		"command": "st-flash write ./build/vsarm_firmware.bin 0x08000000",
		"options": {
			"cwd": "${workspaceRoot}"
		},
		"group": {
			"kind": "build",
			"isDefault": true
		},
		"problemMatcher": []
	}
];