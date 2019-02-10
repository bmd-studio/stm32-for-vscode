// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// import { fstat } from 'fs';
// import { start } from 'repl';
const fs = require('fs');
const path = require('path');
const _ =  require('lodash');

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

const standardLaunchObjects = {

};

export function openInitFiles() {

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
	// console.log(fileTree);
	// if(!_.has(fileTree, 'children')) return false;
	_.map(fileTree.children, (entry) => {
		// console.log('children', entry);
		if(entry.type === 'file') {
			const extension = entry.name.split('.').pop();
			if(extension === 's' || extension === 'c' || extension === 'cpp') {
				// console.log('has');
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


export function extractCFiles(fileTree) {
	let cFiles = [];

	if(fileTree.length > 0 ) {
		fileTree.forEach((entry) => {
			const isDriverCFile = (entry.path.indexOf('Drivers') > -1 && entry.path.indexOf('HAL') > 0) || entry.path.indexOf('CMSIS') >= 0;
			if(entry.type === 'file') {
				if(entry.name.length - entry.name.lastIndexOf('.c') <= 2 ) {
					cFiles.push(entry);
				}
			} else if(entry.type === 'folder' && !isDriverCFile) {
				cFiles = cFiles.concat(extractCFiles(entry.children));
			}
		});

	}
	return cFiles;
}

export function extractExistingCFilesInMake(text) {
	const cleanString = text.split(' \\');
	console.log('cleanString', cleanString);


}

export function buildCPP(callback) {
	diretoryTreeToObj(vscode.workspace.rootPath, (err, list) => { 
		const files = getBuildFiles(list);
		
		console.log('files are...', files);
		// console.log(files);
		createIncludes(files);
		createMakeFile(list);
		createSourcesFile(list);
		createObjectsList(list);
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

export function createMakeFile(fileList) {
	console.log('filelist', fileList);
	const files = getBuildFiles(fileList);
	const includes = createIncludes(files);
	console.log('includes', includes);
	const linkerTarget = _.first(_.get(files, 'linkerFile.name', '').split('_'));
	if(_.isEmpty(linkerTarget)) {
		vscode.window.showErrorMessage('Linker script is not included please regenerate the project using CubeMX');
		return;
	}
	const target = getTarget() || linkerTarget;
	const cortexType = getCortexType();
	const projectName = getProjectName();
	const makeFile= `
################################################################################
# Automatically-generated file, by STM32 VSCODE Extension. Do not edit!
################################################################################
-include ../makefile.init

RM := rm -rf

# All of the sources participating in the build are defined here
${includes}

ifneq ($(MAKECMDGOALS),clean)
ifneq ($(strip $(CC_DEPS)),)
-include $(CC_DEPS)
endif
ifneq ($(strip $(C++_DEPS)),)
-include $(C++_DEPS)
endif
ifneq ($(strip $(C_UPPER_DEPS)),)
-include $(C_UPPER_DEPS)
endif
ifneq ($(strip $(CXX_DEPS)),)
-include $(CXX_DEPS)
endif
ifneq ($(strip $(S_UPPER_DEPS)),)
-include $(S_UPPER_DEPS)
endif
ifneq ($(strip $(C_DEPS)),)
-include $(C_DEPS)
endif
ifneq ($(strip $(CPP_DEPS)),)
-include $(CPP_DEPS)
endif
endif

-include ../makefile.defs

# Add inputs and outputs from these tool invocations to the build variables 

# All Target
all: ${projectName}.elf

# Tool invocations
${projectName}.elf: $(OBJS) $(USER_OBJS)
	@echo 'Building target: $@'
	@echo 'Invoking: MCU G++ Linker'
	arm-none-eabi-g++ -mcpu=${cortexType} -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16 -specs=nosys.specs -specs=nano.specs -T"../${target}_FLASH.ld" -Wl,-Map=output.map -Wl,--gc-sections -fno-exceptions -fno-rtti -o "${projectName}.elf" @"objects.list" $(USER_OBJS) $(LIBS) -lm
	@echo 'Finished building target: $@'
	@echo ' '
	$(MAKE) --no-print-directory post-build

# Other Targets
clean:
	-$(RM) *
	-@echo ' '

post-build:
	-@echo 'Generating hex and Printing size information:'
	arm-none-eabi-objcopy -O ihex "${projectName}.elf" "${projectName}.hex"
	arm-none-eabi-size "${projectName}.elf"
	-@echo ' '

.PHONY: all clean dependents
.SECONDARY: post-build

-include ../makefile.targets`;
	console.log('make file', makeFile);
	const makeFileDirPath = `${vscode.workspace.rootPath}/Debug`;
	const makeFilePath = `${makeFileDirPath}/Makefile`;
	
	console.log('make file path', makeFilePath);
	fs.mkdir(makeFileDirPath, (err) => {
		// if(err) {
		// 	console.log('error', err);
		// 	return;
		// }
		fs.writeFile(makeFilePath, makeFile, function (error) {
			if (err) {
				console.log('error', error);
				return;
			}
			console.log('Saved!');
		});
	});
	
}

export function createSourcesFile(fileList) {
	
	console.log('filelist', fileList);
	const files = getBuildFiles(fileList);
	console.log('files', files);
	const dirs = _.get(files,'subDirectories');
	let dirString = '';
	_.map(dirs, (dir) => {
		dirString += `${dir.path} \\\n`;
	});
	console.log('dirs', dirString);

	const sourcesFile = `################################################################################
	# Automatically-generated file. Do not edit!
	################################################################################
	
	C_UPPER_SRCS := 
	CXX_SRCS := 
	C++_SRCS := 
	OBJ_SRCS := 
	S_SRCS := 
	CC_SRCS := 
	ASM_SRCS := 
	C_SRCS := 
	CPP_SRCS := 
	S_UPPER_SRCS := 
	O_SRCS := 
	CC_DEPS := 
	C++_DEPS := 
	EXECUTABLES := 
	OBJS := 
	C_UPPER_DEPS := 
	CXX_DEPS := 
	S_UPPER_DEPS := 
	C_DEPS := 
	CPP_DEPS := 
	
	# Every subdirectory with source files must be described here
	SUBDIRS := \
	${dirString}
	`
	const makeFileDirPath = `${vscode.workspace.rootPath}/Debug`;
	const sourcesPath = `${makeFileDirPath}/sources.mk`;
	
	fs.mkdir(makeFileDirPath, (err) => {
		// if(err) {
		// 	console.log('error', err);
		// 	return;
		// }
		fs.writeFile(sourcesPath, sourcesFile, function (error) {
			if (err) {
				console.log('error', error);
				return;
			}
			console.log('Saved!');
		});
	});
}

export function createObjectsList(fileList) {
	const files = getBuildFiles(fileList);
	let oList = '';
	//convert to .0 files
	_.forEach(files, (list) => {
		if(!_.isArray(list)) return;
		_.map(list, (item) => {
			const extension = item.name.split('.').pop();
			if(extension === 'cpp' || extension === 'c' || extension === 'a') {				
				const newName = item.path.substr(0, item.path.lastIndexOf(".")) + ".o";
				oList += `\"${newName}\"\n`;
			}
		});
	});

	console.log('o list', oList);
	const makeFileDirPath = `${vscode.workspace.rootPath}/Debug`;
	const objecstListPath = `${makeFileDirPath}/objects.list`;
	
	fs.mkdir(makeFileDirPath, (err) => {
		fs.writeFile(objecstListPath, oList, function (error) {
			if (err) {
				console.log('error', error);
				return;
			}
			console.log('Saved objects list!');
		});
	});
}

/* Function for updating the makefile. It recursively searches for new c files to append in the makefile
 * This makes sure that users do not have to input the in the makefile themselves
*/
export function createNewMakeFile(callback) {

	buildCPP(null);
	return;
	vscode.workspace.findFiles('Makefile').then((uris) => {
		if(uris.length < 1) {
			vscode.window.showWarningMessage('no makefile found. Please init the STM project using CubeMX');
			return;
		}

		//get all the files in the different directories
		diretoryTreeToObj(vscode.workspace.rootPath, (err, list) => {

			const cFiles = extractCFiles(list);	//extracts all c files except the driver files
			const makeFileUri = uris[0];
			console.log('makeFileUri', makeFileUri);
			vscode.workspace.openTextDocument(makeFileUri.path).then((result) => {
				const makeFileText = result.getText();
				const cSourcesText = 'C_SOURCES =  \\\r\n';
				const startPos = makeFileText.indexOf(cSourcesText) + cSourcesText.length;
				const endPos = makeFileText.indexOf('\r\n# ASM sources');
				const theSourcesString = makeFileText.substr(startPos, (endPos - startPos));
				const paths = theSourcesString.split(' \\\r\n');
				const newFiles = [];
				let targetText = makeFileText.substr(makeFileText.indexOf('TARGET ='), 200);
				// console.log('targetText', targetText);
				targetText = targetText.split('\r\n');
				// console.log('target text', targetText);
				targetText = _.first(targetText);
				targetText = _.trim(targetText.replace('TARGET = ', ''));
				// console.log('only target', targetText);
				targetName = targetText;

				//TODO: Check if changes have occured


				//add the driver paths back
				paths.map((originalPath) => {
					if(originalPath.includes('Drivers/')) {
						newFiles.push(originalPath);
					}
				});
				// add the rest of the paths
				cFiles.map((newPaths) => {
					newFiles.push(newPaths.path);
				});

				let newCFilesString = '';
				//create the string with all the c headers
				newFiles.map((entry) => {
					newCFilesString = newCFilesString.concat(entry, ' \\\r\n');
				});
				const difArray = _.difference(newFiles, paths);
				if(_.isEmpty(difArray)) {
					// nothing  needs to be done
					// console.log('make file hasn\'t changed', newFiles, paths);
					callback();
					return;
				}

				// edit the original document and save it
				const cFileRange = new vscode.Range(result.positionAt(startPos) ,result.positionAt(endPos));
				const edit = new vscode.WorkspaceEdit();
				edit.replace(makeFileUri, cFileRange, newCFilesString);
				vscode.workspace.applyEdit(edit).then((unfulfilled) => {
					if(!unfulfilled) {
						vscode.window.showWarningMessage('something went wrong with saving the new makefile');
						return;
					}
					result.save().then((notSaved) => {
						if(!notSaved) {
							vscode.window.showWarningMessage('something went wrong with saving the new makefile');
							return;
						}
						if(callback) {
							callback();
						}
					})
				});
			});
		});	
	});
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