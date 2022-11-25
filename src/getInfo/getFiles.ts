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

import {set, uniq, flattenDeep, intersection, forEach}  from 'lodash';
import * as pth from 'path';
import * as vscode from 'vscode';

import { BuildFiles } from '../types/MakeInfo';
import { EXTENSION_CONFIG_NAME } from '../Definitions';

import Glob = require('glob');


const path = pth.posix; // did this so everything would be posix.

export const REQUIRED_RESOURCES = [
  {
    file: 'Makefile',
    // eslint-disable-next-line max-len
    warning: 'No Makefile is present, please initialize your project using CubeMX, with the toolchain set to Makefile under the project manager'
  },
  {
    file: EXTENSION_CONFIG_NAME,
    warning: '',
  }
];


/* When a standard project is initialized  this is the file structure:
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
  const lowerDirName = dirName.toLowerCase();
  // should match ends to the required files
  const index = directories.findIndex((o: string) => (path.basename(o.toLowerCase()) === lowerDirName));
  if (index === -1) { return null; }
  return directories[index];
}

/**
 * @description Checks if the Makefile, Src, Inc and Drivers directories/files are present.
 * @param {string[] | ArrayLike<string>} directoryFiles
 */
export function checkForRequiredFiles(directoryFiles: string[]): { file: string, isPresent: boolean }[] {
  // required files/directories are: makefile, Src, Inc and Drivers
  const files = REQUIRED_RESOURCES.map((entry: { file: string; warning: string }) => {
    let hasFile = true;
    if (getDirCaseFree(entry.file, directoryFiles) === null) {
      hasFile = false;
    }
    return {
      file: entry.file,
      isPresent: hasFile,
    };
  });
  return files;
}

/**
 * @description takes found header files and generates a list of include directories
 * @param {string[]} headerList - list of headerfiles
 */
export function getIncludeDirectoriesFromFileList(headerList: string[]): string[] {
  let incList: string[] = [];
  headerList.map((entry) => {
    const incFolder = path.dirname(entry);
    incList.push(incFolder);
  });
  incList = uniq(incList);

  incList = incList.map(entry => `${entry}`);
  incList.sort();
  return incList;
}

/**
 * @description Sorts files according to their extension.
 * @param BuildFilesList fileObj
 * @param {any[]} list
 */
export function sortFiles(list: string[]): BuildFiles {
  const output = new BuildFiles();
  list.map((entry) => {
    const extension = entry.toLowerCase().split('.').pop();
    if (extension === 'cpp' || extension === 'cxx' || extension === 'cc') {
      output.cxxSources.push(entry);
    } else if (extension === 'c') {
      output.cSources.push(entry);
    } else if (extension === 'h' || extension === 'hpp') {
      // output.cIncludes.push(path.dirname(entry));
      // removed this as sourcefiles and include directories are split up
    } else if (extension === 's') {
      output.asmSources.push(entry);
    } else if (extension === 'a') {
      output.libdir.push(path.dirname(entry));
    }
  });
  // sort arrays and remove possible duplicates.
  forEach(output, (entry, key) => {
    if (Array.isArray(entry)) {
      set(entry, key, uniq(entry));
      entry.sort();
    }
  });
  return output;
}

/**
 * Searches for files using glob patterns within the source folder.
 * @param glob the glob to search for
 * @param sourceFolder the source folder to search from
 * @returns 
 */
export async function globSearch(glob: string, sourceFolder: string): Promise<string[]> {
  const globOptions = {
    cwd: sourceFolder,
  };
  return new Promise((resolve, reject) => {
    Glob(glob, globOptions, (err, files: string[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

/**
 * scans filesystem for files
 * @param includedFilesGlob Array of glob strings
 * @returns array of posix file paths
 */
export async function scanForFiles(includedFilesGlob: string[]): Promise<string[]> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (workspaceFolder === undefined) { return []; }

  const filePromises = includedFilesGlob.map((fileGlob) => {
    return globSearch(fileGlob, workspaceFolder.uri.fsPath);
  });
  const nonGlobFiles: string[] = [];
  includedFilesGlob.forEach(async (filePath) => {
    if (!Glob.hasMagic(filePath)) {
      try {
        const uriPath = path.isAbsolute(filePath) ? filePath : path.join(workspaceFolder.uri.fsPath, filePath);
        const checkResult = await vscode.workspace.fs.stat(vscode.Uri.file(uriPath));
        if (checkResult.type === vscode.FileType.File) {
          nonGlobFiles.push(filePath);
        }
      } catch (error) {
      }
    }
  });
  const returnedFiles = await Promise.all(filePromises);
  const combinedFiles = returnedFiles.concat(nonGlobFiles);
  const allFiles = flattenDeep(combinedFiles);
  return allFiles;
}

/**
 * scans the current workspace for source files
 * @param sourceFileGlobs glob string to search for source files
 * @returns array of posix relative sourcefile paths
 */
export async function getSourceFiles(sourceFileGlobs: string[]): Promise<string[]> {
  const sourceFileExtensions = ['cpp', 'c', 'a', 's', 'cxx', 'cc'];
  const files = await scanForFiles(sourceFileGlobs);
  const sourceFiles = files.filter((file) => {
    const extension = file.split('.')[-1];
    if (intersection([extension], sourceFileExtensions).length > 0) {
      return true;
    }
    return false;
  });
  return sourceFiles;
}

/**
 * Gets the regular non glob like filepaths from a file list including glob patterns. 
 * @param headerFilesGlobs list of file paths including glob like filepaths
 * @returns regular filenames
 */
export function getNonGlobIncludeDirectories(headerFilesGlobs: string[]): string[] {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (workspaceFolder === undefined) { return []; }
  const nonGlobDirs = headerFilesGlobs.reduce((accumulator, filePath) => {
    if (!Glob.hasMagic(filePath)) {
      accumulator.push(filePath);
    }
    return accumulator;
  }, [] as string[]);
  return nonGlobDirs;
}

/**
 * scans the current workspace for header files
 * @param headerFilesGlobs glob string to search for header files
 * @returns array of posix relative header file paths
 */
export async function getHeaderFiles(headerFilesGlobs: string[]): Promise<string[]> {
  const headerFileExtensions = ['h', 'hpp', 'hxx'];
  const files = await scanForFiles(headerFilesGlobs);

  const headerFiles = files.filter((file) => {
    const extension = file.split('.')[-1];
    if (intersection([extension], headerFileExtensions).length > 0) {
      return true;
    }
    return false;
  });
  return headerFiles;
}

