/**
* MIT License
*
* Copyright (c) 2020 Bureau Moeilijke Dingen
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/
import * as _ from 'lodash';
// import fsRecursive from 'recursive-readdir';
import { window, workspace, Uri, FileType } from 'vscode';
import * as path from 'path';
import * as process from 'process';
import MakeInfo from './types/MakeInfo';

const { platform } = process;

interface BuildFiles {

}

export interface BuildFilesList {
  includeDirectories?: string[],
  cFiles: string[],
  cxxFiles: string[],
  headerFiles: string[],
  asmFiles: string[],
  cIncludes: string[],
  testFiles?: {
    cxxFiles: string[],
    cfiles: string[],
    headerFiles: string[],
    asmFiles: string[],
    cFiles: string[],
    includeDirectories: string[],
  }
};

async function findFilesInDir(dir: string): Promise<Uri[]> {
  return new Promise((resolve) => {
    workspace.findFiles(`${dir}/**/*.*`).then((files) => {
      resolve(files);
    });
  });
}


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
export function getDirCaseFree(dirName: string, directories: string[]) {
  const lowerDirName = _.toLower(dirName);
  const index = _.findIndex(directories, (o: string) => (_.toLower(o) === lowerDirName));
  if (index === -1) return null;
  return directories[index];
}

/**
 * @description Checks if the Makefile, Src, Inc and Drivers directories/files are present.
 * @param {string[] | ArrayLike<string>} directoryFiles
 */
export function checkForRequiredFiles(directoryFiles: string[]) {
  // required files/directories are: makefile, Src, Inc and Drivers
  let check = true;
  if (_.indexOf(directoryFiles, 'Makefile') === -1) {
    // should show warning
    window.showWarningMessage('No Makefile is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');
    check = false;
  }
  if (!getDirCaseFree('Src', directoryFiles)) {
    window.showWarningMessage('No Src directory is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');
    check = false;
  }
  if (!getDirCaseFree('Inc', directoryFiles)) {
    window.showWarningMessage('No Inc directory is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');
    check = false;
  }
  if (!getDirCaseFree('Drivers', directoryFiles)) {
    window.showWarningMessage('No Drivers directory is present, please initialize your project using CubeMX, and under Code Generator make sure that the "Copy all user libraries into the project folder" option is selected.');
    check = false;
  }
  return check;
}


/**
 * @description Sorts files according to their extension.
 * @param BuildFilesList fileObj
 * @param {any[]} list
 */
export function sortFiles(fileObj: { cxxFiles: string[], headerFiles: string[], asmFiles: string[], cFiles: string[] }, list: string[]) {
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
  _.forEach(fileObj, (entry: string[]) => {
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
export function getIncludes(headerList: string[]) {
  let incList: string[] = [];
  // FIXME: removes it to the total path. Should only remove xxx.h file part
  _.map(headerList, (entry) => {
    // const fileName = entry.split('/').pop();
    // let incFolder = entry.replace(fileName, '');
    let incFolder = path.dirname(entry);
    if (platform === 'win32') {
      incFolder = incFolder.replace(/\\/g, '/');
    }

    if (incFolder.charAt(incFolder.length - 1) === '/') {
      incFolder = incFolder.substring(0, incFolder.length - 1);
    }
    incList.push(incFolder);
  });
  incList = _.uniq(incList);
  // should prepend the -I
  incList = _.map(incList, entry => `-I${entry}`);
  console.log('inc list');
  console.log(incList);
  return incList;
}

function convertToRelative(files: string[], loc: string) {
  const relativeFiles = _.map(files, (file: string) => path.relative(loc, file));
  return relativeFiles;
}




// TODO: refactor this. This can be cleaner and more concise. AKA to much code for functionality
/**
 * @description Locates the files in the Src, Inc and Lib folder.
 * @param {string} location - the location of the project, in which it should search for files
 */
export default async function getFileList(location: string): Promise<BuildFilesList> {
  const FileDirectories = ['Src', 'Lib', 'Inc'];
  const workspaceUri = workspace.workspaceFolders[0].uri;
  return new Promise(async (resolve, reject) => {
    let loc = './';
    if (location) {
      loc = location;
    }

    const dirFiletypes = await workspace.fs.readDirectory(Uri.file(loc));
    const dir = dirFiletypes.map((entry) => entry[0]); // strips the filetype. For now this is not relevant

    // search src, lib and inc directories for files
    const fileUriProm = FileDirectories.map((dirname: string) => (
      findFilesInDir(getDirCaseFree(dirname, dir)))
    );
    const fileUris = await Promise.all(fileUriProm);
    // converts uris to filesystem paths
    const filePaths = _.flatten(fileUris).map((fileUri) => {
      return fileUri.fsPath;
    });

    const relativeFiles = convertToRelative(filePaths, loc);

    // special addition for windows paths to be added correctly.
    if (platform === 'win32') {
      _.forEach(relativeFiles, (entry, ind) => {
        relativeFiles[ind] = entry.replace(/\\/g, '/');
      });
    }
    // should sort files and add them to fileList.
    const fileList = {} as BuildFilesList;
    sortFiles(fileList, relativeFiles);
    fileList.cIncludes = _.cloneDeep(getIncludes(fileList.headerFiles));
    resolve(fileList);
  });
}
