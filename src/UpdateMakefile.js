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
import fs from 'fs';
import path from 'path';
import vscode from 'vscode';
import createMakefile from './CreateMakefile';
import { makefileName } from './Definitions';


async function getCurrentMakefile(makefilePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(makefilePath, { encoding: 'utf8' }, (err, currentMakefile) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(currentMakefile);
    });
  });
}

async function writeMakefile(makefilePath, makefile) {
  return new Promise((resolve, reject) => {
    fs.writeFile(makefilePath, makefile, { encoding: 'utf8' }, (err) => {
      if (err) {
        vscode.window.showErrorMessage('Something went wrong with writing to the new makefile', `${err}`);
        reject(err);
        return;
      }
      resolve();
    });
  });
}


/**
 * @description creates a new makefile based on the current info and checks if it
 * should update the old makefile.
 * @param {string} workspaceLocation location of the current workspace
 * @param {{makefile: {}, config: {}}} info object containing the information
 * neccessary for compilation
 */
export default async function updateMakefile(workspaceLocation, info) {
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
        vscode.window.showErrorMessage(`Something went wrong with creating the new makefile. Error: ${err}`);
        reject(err);
        return;
      }
    } else {
      // console.log('makefile is same same');
    }
    resolve(newMakefile);
  });
}
