import _ from 'lodash';
import fs from 'fs';
import fsRecursive from 'recursive-readdir';
import vscode from 'vscode';
import path from 'path';
import process from 'process';

const { platform } = process;


/* When a standard project is initialised  this is the file structure:
 |-${projectName}.ioc
 |-Drivers
 |-Inc
 |-Middlewares (optional)
 |-Makefile
 |-Src
 |-startup_${target}xx
 |-${TARGETCHIP}x_FLASH.ld
 */


/**
 * @description gets dir ignoring upper or lower case
 */
export function getDirCaseFree(dirName, directories) {
  const lowerDirName = _.toLower(dirName);
  const index = _.findIndex(directories, o => (_.toLower(o) === lowerDirName));
  if (index === -1) return null;
  return directories[index];
}

/**
 * @description Checks if the Makefile, Src, Inc and Drivers directories/files are present.
 * @param {string[] | ArrayLike<string>} directoryFiles
 */
export function checkForRequiredFiles(directoryFiles) {
  // required files/directories are: makefile, Src, Inc and Drivers
  let check = true;
  if (_.indexOf(directoryFiles, 'Makefile') === -1) {
    // should show warning
    vscode.window.showWarningMessage('No Makefile is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');
    check = false;
  }
  if (!getDirCaseFree('Src', directoryFiles)) {
    vscode.window.showWarningMessage('No Src directory is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');
    check = false;
  }
  if (!getDirCaseFree('Inc', directoryFiles)) {
    vscode.window.showWarningMessage('No Inc directory is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');
    check = false;
  }
  if (!getDirCaseFree('Drivers', directoryFiles)) {
    vscode.window.showWarningMessage('No Drivers directory is present, please initialize your project using CubeMX, and under Code Generator make sure that the "Copy all user libraries into the project folder" option is selected.');
    check = false;
  }
  return check;
}

/**
 * @description Recursively searches through a whole directory.
 * @param {string} location - Directory to search e.g. ~/src
 */
async function searchForFiles(location) {
  return new Promise((resolve, reject) => {
    fsRecursive(location, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(files);
    });
  });
}

/**
 * @description Tries to search for file in a location.
 * If it does not find the location it returns an empty array
 * @param {string} location
 */
export async function trySearchforFiles(location) { // TODO: create test for this function
  return new Promise(async (resolve) => {
    try {
      const output = await searchForFiles(location);
      resolve(output);
    } catch (err) {
      resolve([]);
    }
  });
}


/**
 * @description Sorts files according to their extension.
 * @param {{
 * includeDirectories?: string[];
 * cFiles: string[];
 * cxxFiles: string[];
 * headerFiles: string[];
 * asmFiles: string[];
 * testFiles?: {
  * cFiles: any[];
  * cxxFiles: any[];
  * headerFiles: any[];
  * asmFiles: any[];
 *  };
 * }} fileObj
 * @param {any[]} list
 */
export function sortFiles(fileObj, list) {
  /**
   * @param {{ split: (arg0: string) => { pop: () => string; }; }} entry
   */
  // Guard assign the key when none exist.
  if (!fileObj.cxxFiles) _.set(fileObj, 'cxxFiles', []);
  if (!fileObj.cFiles) _.set(fileObj, 'cFiles', []);
  if (!fileObj.headerFiles) _.set(fileObj, 'headerFiles', []);
  if (!fileObj.asmFiles) _.set(fileObj, 'asmFiles', []);

  _.map(list, (entry) => {
    const extension = _.toLower(entry.split('.').pop());
    if (extension === 'cpp' || extension === 'cxx') {
      fileObj.cxxFiles.push(entry);
    } else if (extension === 'c') {
      fileObj.cFiles.push(entry);
    } else if (extension === 'h' || extension === 'hpp') {
      fileObj.headerFiles.push(entry);
    } else if (extension === 's') {
      fileObj.asmFiles.push(entry);
    }
  });
  _.forEach(fileObj, (entry) => {
    if (_.isArray(entry)) {
      entry.sort();
    }
  });
  return fileObj;
}

/**
 * @description creates a list of directories which include headers
 * @param {string[]} headerList - list of headerfiles
 */
export function getIncludes(headerList) {
  let incList = [];
  _.map(headerList, (entry) => {
    const fileName = entry.split('/').pop();
    let incFolder = entry.replace(fileName, '');
    if (incFolder.charAt(incFolder.length - 1) === '/') {
      incFolder = incFolder.substring(0, incFolder.length - 1);
    }
    incList.push(incFolder);
  });
  incList = _.uniq(incList);

  // should prepend the -I
  incList = _.map(incList, entry => `-I${entry}`);

  return incList;
}
function convertToRelative(files, loc) {
  const relativeFiles = _.map(files, file => path.relative(loc, file));
  return relativeFiles;
}

/**
 * @description Locates the files in the Src, Inc and Lib folder.
 * @param {string} location - the location of the project, in which it should search for files
 */
export default async function getFileList(location) {
  return new Promise(async (resolve, reject) => {
    let loc = './';
    if (location && _.isString(location)) {
      loc = location;
    }
    const fileList = {
      includeDirectories: [],
      cFiles: [],
      cxxFiles: [],
      headerFiles: [],
      asmFiles: [],
      testFiles: {
        cFiles: [],
        cxxFiles: [],
        headerFiles: [],
        asmFiles: [],
        includeDirectories: [],
      },
    };

    // first check if it has the required directories
    const dir = fs.readdirSync(loc);
    // should check for the required files/Directories and display a warning when they arent there.
    if (!checkForRequiredFiles(dir)) {
      reject(new Error('The required files and directories were not present'));
    }
    // recursively find files in the project.
    let initialFileList = [];
    try { // TODO: maybe refactor as it feels double since you also already used the checkForRequiredFiles() function
      const srcFiles = await searchForFiles(`${loc}/${getDirCaseFree('Src', dir)}`);
      const incFiles = await searchForFiles(`${loc}/${getDirCaseFree('Inc', dir)}`);
      const libFiles = await trySearchforFiles(`${loc}/${getDirCaseFree('Lib', dir)}`); // TODO: is it necessary to create another try as it is already in a try?
      initialFileList = initialFileList.concat(srcFiles);
      initialFileList = initialFileList.concat(incFiles);
      initialFileList = initialFileList.concat(libFiles);
    } catch (err) {
      vscode.window.showWarningMessage('Something went wrong with reading the files', err);
      reject(err);
    }

    let testFiles = null;
    const testIndex = _.findIndex(dir, o => (o === 'test' || o === 'Test'));
    if (testIndex >= 0) {
      try {
        testFiles = await searchForFiles(`${loc}/${dir[testIndex]}`);
        sortFiles(fileList.testFiles, testFiles);
        const includes = getIncludes(fileList.testFiles.headerFiles);
        fileList.testFiles.includeDirectories = _.cloneDeep(includes);
      } catch (err) {
        // do nothing for now.
      }
    }

    // convert to relative paths.
    initialFileList = convertToRelative(initialFileList, loc);

    // special addition for windows paths to be added correctly.
    if (platform === 'win32') {
      _.forEach(initialFileList, (entry) => {
        entry.replace('\\', '/');
      });
    }
    // should sort files and add them to fileList.
    sortFiles(fileList, initialFileList);
    fileList.cIncludes = _.cloneDeep(getIncludes(fileList.headerFiles));
    resolve(fileList);
  });
}
