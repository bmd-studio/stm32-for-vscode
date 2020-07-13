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

import * as path from 'path';

import { Uri, window, workspace } from 'vscode';

import MakeInfo from './types/MakeInfo';
import createMakefile from './CreateMakefile';
import { makefileName } from './Definitions';

/**
 * Used to retrieve the makefile, however do not that the requirement of 
 * having the makefile is checked earlier in the whole process
 * @param makefilePath path to the makefile, usually it is ./Makefile
 */
export async function getCurrentMakefile(makefilePath: string): Promise<Error | string> {
  return new Promise((resolve, reject) => {
    workspace.fs.readFile(Uri.file(makefilePath)).then((currentMakefile) => {
      if (currentMakefile.length === 0) {
        reject(new Error('The makefile was not found'));
        return;
      }
      resolve(currentMakefile.toString());
    });
  });
}

/**
 * Writes the makefile to the specified location
 * @param makefilePath the path to the makefile
 * @param makefile the makefile to write in string format
 */
export async function writeMakefile(makefilePath: string, makefile: string): Promise<void> {
  return new Promise((resolve) => {
    workspace.fs.writeFile(Uri.file(makefilePath), Buffer.from(makefile, 'utf8')).then(() => { resolve(); });
  });
}


/**
 * @description creates a new makefile based on the current info and checks if it
 * should update the old makefile.
 * @param {string} workspaceLocation location of the current workspace
 * @param {{makefile: {}, config: {}}} info object containing the information
 * necessary for compilation
 */
export default async function updateMakefile(workspaceLocation: string, info: MakeInfo): Promise<Error | string> {
  return new Promise(async (resolve, reject) => {
    const makefilePath = path.resolve(workspaceLocation, makefileName);
    let oldMakefile;
    try {
      oldMakefile = await getCurrentMakefile(makefilePath);
    } catch (err) {
      oldMakefile = null;
    }
    // console.log('creating new makefile with info', info);
    const newMakefile = createMakefile(info);
    if (newMakefile !== oldMakefile) {
      // console.log('difference in makefile updating');
      try {
        await writeMakefile(makefilePath, newMakefile);
      } catch (err) {
        window.showErrorMessage(`Something went wrong with creating the new makefile. Error: ${err}`);
        reject(err);
        return;
      }
    } else {
      // console.log('makefile is same same');
    }
    resolve(newMakefile);
  });
}
