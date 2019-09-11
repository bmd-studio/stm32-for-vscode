const _ = require('lodash');
const fs = require('fs');
const fsRecursive = require('recursive-readdir');
const vscode = require('vscode');

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

/**
 * @description Checks if the Makefile, Src, Inc and Drivers directories/files are present.
 * @param {string[] | ArrayLike<string>} directoryFiles
 */
function checkForRequiredFiles(directoryFiles) {
  // required files/directories are: makefile, Src, Inc and Drivers
  let check = true;
  if (_.indexOf(directoryFiles, 'Makefile') === -1) {
    // should show warning
    vscode.window.showWarningMessage('No Makefile is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');
    check = false;
  }
  if (_.indexOf(directoryFiles, 'Src') === -1) {
    vscode.window.showWarningMessage('No Src directory is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');
    check = false;
  }
  if (_.indexOf(directoryFiles, 'Inc') === -1) {
    vscode.window.showWarningMessage('No Inc directory is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');
    check = false;
  }
  if (_.indexOf(directoryFiles, 'Drivers') === -1) {
    vscode.window.showWarningMessage('No Drivers directory is present, please initialize your project using CubeMX, and under Code Generator make sure that the "Copy all user libraries into the project folder" option is selected.');
    check = false;
  }
  return check;
}
/**
 * @description Tries to search for file in a location. If it does not find the location it returns an empty array
 * @param {string} location
 */
async function trySearchforFiles(location) {
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
 * @description Sorts files according to their extension.
 * @param {{ includeDirectories?: string[]; cFiles: string[]; cxxFiles: string[]; headerFiles: string[]; asmFiles: string[]; testFiles?: { cFiles: any[]; cxxFiles: any[]; headerFiles: any[]; asmFiles: any[]; }; }} fileObj
 * @param {any[]} list
 */
function sortFiles(fileObj, list) {
  /**
   * @param {{ split: (arg0: string) => { pop: () => string; }; }} entry
   */
  _.map(list, (entry) => {
    const extension = _.toLower(entry.split('.').pop());
    if (extension === 'cpp' || extension === 'cxx') {
      fileObj.cxxFiles.push(entry);
    } else if (extension === 'c') {
      fileObj.cFiles.push(entry);
    } else if (extension === 'h' || extension === 'hpp') {
      fileObj.headerFiles.push(entry);
    } else if (extension === 's') {
      fileObj.asmFiles.push(extension);
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
function getIncludes(headerList) {
  let incList = [];
  _.map(headerList, (entry) => {
    const fileName = entry.split('/').pop();
    const incFolder = entry.replace(fileName, '');
    incList.push(incFolder);
  });
  incList = _.uniq(incList);
  return incList;
}

/**
 * @description Locates the files in the Src, Inc and Lib folder.
 * @param {string} location - the location of the project, in which it should search for files
 */
async function getFileList(location) {
  return new Promise(async (resolve, reject) => {
    let loc = './';
    if (location && _.isString(location)) {
      loc = location;
    }
    // clear the fileList (multiple calls to this function will populate it again)
    _.forEach(fileList, (entry, key) => {
      if (_.isArray(entry)) {
        fileList[key] = [];
      }
    });
    _.forEach(fileList.testFiles, (entry, key) => {
      if (_.isArray(entry)) {
        fileList.testFiles[key] = [];
      }
    });

    // first check if it has the required directories
    const dir = fs.readdirSync(loc);
    // should check for the required files/Directories and display a warning when they arent there.
    if (!checkForRequiredFiles(dir)) {
      reject(new Error('The required files and directories were not present'));
    }
    // recursively find files in the project.
    const initialFileList = [];
    try {
      const srcFiles = await searchForFiles(`${loc}/Src`);
      const incFiles = await searchForFiles(`${loc}/Inc`);
      const libFiles = await trySearchforFiles(`${loc}/Lib`);
      libFiles.concat(await trySearchforFiles(`${loc}/lib`));

      _.map(srcFiles, (entry) => {
        initialFileList.push(entry);
      });
      _.map(incFiles, (entry) => {
        initialFileList.push(entry);
      });
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
        fileList.testFiles.includeDirectories = _.cloneDeep(getIncludes(fileList.testFiles.headerFiles));
      } catch (err) {
        // do nothing for now.
      }
    }
    // should sort files and add them to fileList.
    sortFiles(fileList, initialFileList);
    fileList.includeDirectories = _.cloneDeep(getIncludes(fileList.headerFiles));

    return fileList;
  });
}


module.exports = {
  getFileList,
  fileList,
  getIncludes,
  sortFiles,
  searchForFiles,
  trySearchforFiles,
  checkForRequiredFiles,
};
