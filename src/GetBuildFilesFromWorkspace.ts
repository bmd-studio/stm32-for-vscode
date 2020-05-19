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
import MakeInfo, {BuildFiles} from './types/MakeInfo';

const { platform } = process;

export const REQUIRED_RESOURCES = [
   {
    file: 'makefile',
    warning: 'No Makefile is present, please initialize your project using CubeMX, with the toolchain set to Makefile under the project manager'
  },
  {
    file: 'src',
    warning: 'No Src directory is present, please initialize your project using CubeMX, with the toolchain set to Makefile under the project manager'
  },
  {
    file: 'inc',
    warning: 'No Inc directory is present, please initialize your project using CubeMX, with the toolchain set to Makefile under the project manager'
  },
  {
    file: 'drivers',
    warning: 'No Drivers directory is present, please initialize your project using CubeMX, and under Code Generator make sure that the "Copy all user libraries into the project folder" option is selected.'
  },
];

async function findFilesInDir(dir: string | null): Promise<Uri[]> {
  if (!dir) {return new Promise((resolve) => { resolve([]); });}
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
 *  Returns the Dirname, with the same spelling as the actual directory, however with correct upper or lower case.
 * @param dirName Directory name. e.g. src
 * @param directories Directories on filesystem
 * @returns directory name e.g for dirName src and directory name Src it will return Src
 */
export function getDirCaseFree(dirName: string, directories: string[]): string | null {
  const lowerDirName = _.toLower(dirName);
  // should match ends to the required files
  const index = _.findIndex(directories, (o: string) => (path.basename(_.toLower(o)) === lowerDirName));
  if (index === -1) {return null;}
  return directories[index];
}

/**
 * @description Checks if the Makefile, Src, Inc and Drivers directories/files are present.
 * @param {string[] | ArrayLike<string>} directoryFiles
 */
export function checkForRequiredFiles(directoryFiles: string[]) {
  // required files/directories are: makefile, Src, Inc and Drivers
  let check = true;
  REQUIRED_RESOURCES.forEach((entry: {file: string, warning: string}) => {
    if(getDirCaseFree(entry.file, directoryFiles) === null) {
      window.showWarningMessage(entry.warning);
      const res = getDirCaseFree(entry.file, directoryFiles);
      check = false;
    }
  });
  return check;
}


/**
 * @description Sorts files according to their extension.
 * @param BuildFilesList fileObj
 * @param {any[]} list
 */
export function sortFiles(list: string[]): BuildFiles {
  const output = new BuildFiles();
  _.map(list, (entry) => {
    const extension = _.toLower(entry.split('.').pop());
    if (extension === 'cpp' || extension === 'cxx') {
      output.cxxSources.push(entry);
    } else if (extension === 'c') {
      output.cSources.push(entry);
    } else if (extension === 'h' || extension === 'hpp') {
      output.cIncludes.push(entry);
    } else if (extension === 's') {
      output.asmSources.push(entry);
    }
  });
  console.log({cIncludesBefore: output.cIncludes});

  output.cIncludes = getIncludes(output.cIncludes);
  // sort arrays and remove possible duplicates.
  _.forEach(output, (entry, key) => {
    if (_.isArray(entry)) {
      _.set(entry, key, _.uniq(entry));
      entry.sort();
    }
  });

  console.log({cIncludesAfter: output.cIncludes});
  return output;
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
  console.log({incList});
  return incList;
}

export function convertToRelative(files: string[], loc: string) {
  const relativeFiles = _.map(files, (file: string) => path.relative(loc, file));
  return relativeFiles;
}




// TODO: refactor this. This can be cleaner and more concise. AKA to much code for functionality
/**
 * @description Locates the files in the Src, Inc and Lib folder.
 * @param {string} location - the location of the project, in which it should search for files
 */
export default async function getFileList(location: string): Promise<BuildFiles> {
  const FileDirectories = ['Src', 'Lib', 'Inc'];
  if (!workspace.workspaceFolders) {throw Error('No workspace folder found');}
  const workspaceUri = workspace.workspaceFolders[0].uri;
  return new Promise(async (resolve) => {
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
    if(!checkForRequiredFiles(dir)) {
      throw new Error('Does not have the required files, maybe the project is not properly initialized using CubeMX');
    }


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
    const fileList = sortFiles(relativeFiles);
    resolve(fileList);
  });
}
