// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const fs = require('fs');
const path = require('path');
const _ =  require('lodash');
const shell = require('shelljs');
const JSON5 = require('json5');

//TODO: make sure main.c is transformed into main.cpp including generated changes (add ghost file).
export function activate(context: vscode.ExtensionContext) {

	const buildCommand = vscode.commands.registerCommand('extension.buildSTM', () => {
		initAndBuild();
	});

	context.subscriptions.push(buildCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {}

export function initAndBuild() {
	//first check if it has commands
	if(!shell.which('openocd')) {
		vscode.window.showWarningMessage('This extension requires: "openocd" to be available in PATH, see: http://openocd.org/getting-openocd/ for more info');
	}
	if(!shell.which('make')) {
		vscode.window.showWarningMessage('This extension requires: "make" to be available in PATH, please install make for your specific environment');
	}
	if(!shell.which('st-flash')) {
		vscode.window.showWarningMessage('This extension requires: "st-flash" to be available in PATH, please install make for your specific environment');
	}
	if(!shell.which('arm-none-eabi-gcc')) {
		vscode.window.showWarningMessage('This extension requires: "arm-none-eabi-gcc" to be available in PATH, please install make for your specific environment');
	}
	if(!shell.which('arm-none-eabi-g++')) {
		vscode.window.showWarningMessage('This extension requires: "arm-none-eabi-gcc" to be available in PATH, please install make for your specific environment');
	}
	if(!shell.which('arm-none-eabi-objcopy')) {
		vscode.window.showWarningMessage('This extension requires: "arm-none-eabi-gcc" to be available in PATH, please install make for your specific environment');
	}
	if(!shell.which('arm-none-eabi-size')) {
		vscode.window.showWarningMessage('This extension requires: "arm-none-eabi-gcc" to be available in PATH, please install make for your specific environment');
	}



	//first get build info
	getBuildInfo().then((info) => {
		 console.log('the info is', info);
		 updateMakefile(info).then(() => {
			// activate make in a user visible terminal
			let terminal = vscode.window.activeTerminal;
			if(!terminal) {
				terminal = vscode.window.createTerminal();
			}
			terminal.sendText('make');
		 });

		 fs.mkdir(`${vscode.workspace.rootPath}/.vscode`, (err:any) => {
			if (err) {
				console.log('error makind dir', err);
			}
			// check if the debug is present in the launchfile if not add it
			updateLaunchFile(info);

			// check if the standard tasks are present in the tasks file if not add them
			updateTasksFile(info);
		 });
		 
	});
}

export function updateLaunchFile(makeInfo: any) {
	const url = `${vscode.workspace.rootPath}/.vscode/launch.json`;
	const debugConfig : any = {
		showDevDebugOutput: true,
		cwd: "\${workspaceRoot}",
		executable: "./build/Firmware.elf",
		name: "Debug STM32",
		request: "launch",
		type: "cortex-debug",
		servertype: "openocd",
		preLaunchTask: "Build STM",
		device: "stlink",
		configFiles: [
				"interface/stlink-v2-1.cfg",
				`target/${makeInfo.targetName}.cfg`,
		]
	};
	console.log('updating launch file');
	console.log('vscode tasks', vscode.tasks.fetchTasks);
	fs.readFile(url, 'utf8', (error: any, currentLaunchFile: string) => {
		let cLaunchFile = {configurations: []};
		console.log('current launch file', cLaunchFile);
		let needsUpdate = false;
		if(error) {
			console.log('error', error);
			if(error.code === 'ENOENT') {
				//no file exists
				cLaunchFile.configurations = _.concat(cLaunchFile.configurations, debugConfig);
				// cLaunchFile.configurations.push(debugConfig);
				needsUpdate = true;
			} else {throw error;}
		}else {
			if(_.isEmpty(currentLaunchFile)) {
				cLaunchFile = {
					configurations: []
				};
			} else {
				cLaunchFile = JSON5.parse(currentLaunchFile);
			}
		}
		// otherwise should check if it has the debug gdb config
		const configurations = _.get(cLaunchFile, ['configurations'], []);
		let hasConfiguration = false;
		_.map(configurations, (config: any) => {
			if(config.name === debugConfig.name) {
				hasConfiguration = true;
			}
		});
		if( !hasConfiguration) {
			needsUpdate = true;
			cLaunchFile.configurations = _.concat(cLaunchFile.configurations, debugConfig);
		}
		console.log('needs update', needsUpdate, 'current launch file',  cLaunchFile, );
		if(needsUpdate) {
			fs.writeFile(url, JSON.stringify(cLaunchFile, null, '\t'), (error: any) => {
				if(error) {
					console.log('error');
					throw error;
				}
			});
		}
	});
}


export function updateTasksFile(makeInfo: any) {
	const url = `${vscode.workspace.rootPath}/.vscode/tasks.json`;
	const buildTask = {
				label: "Build STM",
				type: "shell",
				command: "make",
				options: {
						cwd: "${workspaceRoot}"
				}, 
				group: {
						kind: "build",
						isDefault: true
				},
				problemMatcher: []
		};

	const uploadTask = {
				label: "Load STM Firmware",
				type: "shell",
				command: "st-flash write ./build/Firmware.bin 0x08000000",
				options: {
						cwd: "${workspaceRoot}"
				},
				group: {
						kind: "build",
						isDefault: true
				},
				problemMatcher: []
		};


	fs.readFile(url, 'utf8', (error: any, taskInFile: string) => {
		if(error) {
			if(error.code === 'ENOENT') {
				// no file found so should be created
				const taskFile = {
					tasks: [buildTask, uploadTask]
				};
				fs.writeFile(url, JSON.stringify(taskFile, null, '\t'), (error: any) => {
					if(error) {
						console.log('oops we got an error', error);
					}
				});
			} else {
				console.log('something went wrong with getting the file');
			}
		} else {
			// console.log('task file exist checking', JSON5.parse(taskInFile));
			let hasBuild = false;
			let hasUpload = false;
			let taskFile = {
				tasks: []
			};
			if(!_.isEmpty(taskInFile)) {
				try {
					taskFile = JSON5.parse(taskInFile);
				} catch {

				}
			}

			const tasks = _.get(taskFile, ['tasks'], []);
			_.map(tasks, (task: any) => {
				if(task.label === buildTask.label && task.command === buildTask.command) {
					hasBuild = true;
				}
				if(task.label === uploadTask.label && task.command === uploadTask.command) {
					hasUpload = true;
				}
			});
			if (!hasBuild || !hasUpload) {
				// then add it and write it
				if (!hasBuild) {
					taskFile.tasks = _.concat(taskFile.tasks, buildTask);
				}
				if (!hasUpload) {
					taskFile.tasks = _.concat(taskFile.tasks, uploadTask);
				}
				fs.writeFile(url, JSON.stringify(taskFile, null, '\t'), (error: any) => {
					if(error) {
						console.log('oops we got an error while modifying the tasks', error);
					}
				});
			}
		}
	});
}

export function getBuildInfo() {
	const buildfilesPromise = new Promise((resolve, reject) => {
		vscode.workspace.findFiles('Makefile').then((uris) => {
			if(uris.length < 1) {
				vscode.window.showWarningMessage('no makefile found. Please init the STM project using CubeMX');
				reject('no makefile');
			}
			const rootPath:string = vscode.workspace.rootPath || '';
			diretoryTreeToObj(rootPath, (err: any, list: any) => {
				returnMakeFileInfo(uris[0], (makeInfo: any) => {
				const buildFiles = getBuildFiles(list); 
					const completeFiles = _.assign(buildFiles, makeInfo);
					completeFiles.list=
					resolve(completeFiles);
				});
			});
		});
	});
	return buildfilesPromise;
}

export function updateMakefile(makeInfo: any) {
	console.log('file', makeInfo);
	// const files = getBuildFiles(makeInfo);
	const files = makeInfo;
	console.log('buildfiles');
	console.log(files);
	const cSources = convertToSourceString(makeInfo.cSources);
	const cppSources = convertToSourceString(makeInfo.cppSources);
	const asmSources = convertToSourceString(makeInfo.asmSources);


	// const includes = createIncludes(files);
	const linkerTarget = _.first(_.get(makeInfo, 'linkerFile.name', '').split('_'));
	if(_.isEmpty(linkerTarget)) {
		vscode.window.showErrorMessage('Linker script is not included please regenerate the project using CubeMX');
		const errProm = new Promise((resolve, reject) => {
			reject('error');
		});
		return errProm;
	}
	// const target = getTarget() || linkerTarget;
	// const cortexType = getCortexType();
	// const projectName = getProjectName();

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
TARGET = Firmware


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

// if(makeFile === )
	const makeFileDirPath = `${vscode.workspace.rootPath}/Makefile`;

	const promise = new Promise((resolve, reject) => {
		//first read makefile
		fs.readFile(makeFileDirPath, 'utf8', (error: any, oldMakeFile: any) => {
			if(error) {
				console.log('error', error);
				return;
			}
			// console.log('old make file');
			// console.log(oldMakeFile);

			// check if the current makefile is the same as the old one if not write new one
			if(makeFile === oldMakeFile) {
				console.log('no changes to make file, compiling');
				resolve();
				return;
			}
			console.log('changes to make file', makeFile.localeCompare(oldMakeFile));
			console.log('index compare', makeFile.indexOf(oldMakeFile));
			console.log('first change is', checkDifference(makeFile, oldMakeFile));
			fs.writeFile(makeFileDirPath, makeFile, function (error: any) {
				if (error) {
					console.log('error', error);
					reject(error);
					return;
				}
				resolve();
			});
		});
	});
	return promise;
}

export function getBuildFiles(fileTree: any) {
	let buildFiles: any = {
		cSources: [],
		cppSources: [],
		asmSources: [],
		subDirectories: [],
		linkerFile: {},
		driverFiles: [],
		targetName: '',
	};

	if (fileTree.length > 0 ) {
		fileTree.forEach((entry: any) => {
			const isDriverFile = entry.path.indexOf('CMSIS') >= 0;
			const isDriverTemplate = entry.path.indexOf('xx_HAL_Driver') >= 0 && entry.path.indexOf('template') >= 0;
			if(entry.type === 'file' && entry.path.indexOf('_hal_msp.c') >= 0) {
				buildFiles.targetName = _.first(_.split(entry.name, 'x_hal_msp.c'));
				console.log('build file target name is: ', buildFiles.targetName);
			}

			if(entry.type === 'file' && !isDriverTemplate) {
				const extension = entry.name.split('.').pop();
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
						buildFiles.linkerFile = entry;
						break;
				}
			} else if(entry.type === 'folder' && !isDriverFile) {
				if(hasBuildFiles(entry)) {
					buildFiles.subDirectories.push(entry);
				}
				//do some recursion here
				const result = getBuildFiles(entry.children);

				// now append these 
				buildFiles.cSources = buildFiles.cSources.concat(result.cSources);
				buildFiles.cppSources = buildFiles.cppSources.concat(result.cppSources);
				buildFiles.asmSources = buildFiles.asmSources.concat(result.asmSources);
				buildFiles.subDirectories = buildFiles.subDirectories.concat(result.subDirectories);
				buildFiles.driverFiles = buildFiles.driverFiles.concat(result.driverFiles);
				if(!_.isEmpty(result.targetName)) {
					buildFiles.targetName = result.targetName;
				}
				if(!_.isEmpty(result.linkerFile)) {
					buildFiles.linkerFile = result.linkerFile;
				}
			}
		});
	}

	return buildFiles;
}

export function hasBuildFiles(fileTree: any) {
	let has = false;
	_.map(fileTree.children, (entry: any) => {
		if(entry.type === 'file') {
			const extension = entry.name.split('.').pop();
			if(extension === 's' || extension === 'c' || extension === 'cpp') {
				has = true;
			}
		}
	});
	return has;
}


export function createIncludes(sources: any) {
	//returns a string of includes
	let includesString = '-include sources.mk\n-include subdir.mk\n-include objects.mk\n';
	_.map(sources.subDirectories, (dir: any) => {
		if(dir.name === '.vscode' || _.toLower(dir.name) === 'release' || _.toLower(dir.name) === 'debug') return;
		includesString += `-include ${dir.path}/subdir.mk\n`;
	});
	return includesString;
}

export function getProjectName() {
	//TODO: Check if there is a better way to do this, which does not involve using the
	const rootPath = vscode.workspace.rootPath || '';
	return rootPath.split('/').pop();
}

export function convertToSourceString(files: any) {
	if(!files || files.length <= 0) return '';
	let filesString = '';
	const sortedFiles = _.sortBy(files, ['name']);
	_.map(sortedFiles, (file: any) => {
		filesString += `${file.path} \\\r\n`;
	});
	return filesString;
}

export function getHalConfigFile(fileList: any) {
	if(_.isEmpty(fileList)) return null;
	let configFilePath = '';
	_.map(fileList, (entry: any) => {
		if (entry.type === 'folder') {
			_.map(entry.children, (files: object) => {
				if (_.endsWith(entry.name, '_hal_conf.h')) {
					configFilePath = entry.path;
				}
			});
		}
	});
	return configFilePath;
}

export function checkDifference(a: string, b: string) {
	if(a === b) {return -1;};
	let i = 0;
	while(a[i] === b[i]) {
		i++;
	}
	const res = {
		index: i,
		chars: {string1: a[i], string2: b[i]},
		lengths: {string1: a.length, string2: b.length},
		snippets: {string1: a.substr(i, 100), string2: b.substr(i, 100)}
	};

	return res;
}

export function returnMakeFileInfo(makeFileUri: any, callback: any) {
	let info = {};

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
		_.map(cDefsArr, (entry: any, ind: any) => {
			if(end) return;
			if(entry.indexOf(' \\') < 0) {
				cDefs += entry;
				end = true;
				return;
			}
			cDefs += `${entry}\n`;
		});
		end = false;
		let cIncludes = '';
		const cIncludesArr = makeFileText.substr(makeFileText.indexOf('C_INCLUDES =')).split('\n');
		_.map(cIncludesArr, (entry: any) => {
			if(end) return;
			if(entry.indexOf(' \\') < 0) {
				cIncludes += entry;
				end = true;
				return;
			}
			cIncludes += `${entry}\n`;
		});
		
		info = {
			target: targetText,
			cpu: cpuText,
			fpu: FPUText,
			floatAbi: floatAbiText,
			mcu: MCUText,
			cDefinitions: cDefs,
			cIncludes: cIncludes,
			linkerScript: linkerScript,
		};
		callback(info);
		return;
	});
}

export function diretoryTreeToObj(dir: string, done: Function) {
	var results:Array<Object> = [];
    fs.readdir(dir, function(err: Object, list: any) {
        if (err)
            return done(err);

        var pending = list.length;

        if (!pending)
            return done(null, {name: path.basename(dir), type: 'folder', children: results});

        list.forEach(function(file: any) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err: Object, stat: any) {
                if (stat && stat.isDirectory()) {
                    diretoryTreeToObj(file, function(err: any, res:any) {
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
}