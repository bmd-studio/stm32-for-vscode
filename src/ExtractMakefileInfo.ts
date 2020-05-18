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
/*
 * MakefileInfo.js
 * Set of functions for to extract information out of a makefile
 * Information to get:
 *   TARGET
 *   CPU
 *   FPU
 *   FLOAT-ABI
 *   C_SOURCES
 *   ASM_SOURCES
 *   C_DEFS
 *   AS_INCLUDES
 *   C_INCLUDES
 *   LDSCRIPT
 * Created by Jort Band- Bureau Moeilijke Dingen
 */
/* eslint no-param-reassign: ["error", {
  "props": true, "ignorePropertyModificationsFor": ["infoDef"] }] */
// const fs = require('fs'); // TODO: Rewrite this to use native Vscode implementation
import MakeInfo from './types/MakeInfo';
import * as _ from 'lodash';
import { window, workspace, Uri } from 'vscode';


// FIXME: global variable. Perhaps not the best idea.
export const makefileInfo = {} as MakeInfo;


/**
 * @description
 * @param {string} location - location of the makefile e.g. /filepath/Makefile
 */
export async function getMakefile(location: string): Promise<string> {
  console.log('getting makefile at location', location);
  return new Promise((resolve, reject) => {
    try {
      workspace.fs.readFile(Uri.file(location)).then((makefileFile) => {
        const makefile = makefileFile.toString();
        resolve(makefile);
      });
    } catch (err) {
      reject(err);
    }
  });
}
/**
 * @description Extracts single line info from a makefile
 * @param {string} name - The name of the Makefile parameter to extract e.g. FLOAT-ABI
 * @param {string} makefile - A string representation of the Makefile
 */
export function extractSingleLineInfo(name: string, makefile: string): string {
  const newPatt = new RegExp(`${name}\\s=\\s(.*)`, 'gmi');
  const newRes = newPatt.exec(makefile);
  const result = _.last(newRes);
  return result ? result : '';
}
/**
 * @description Extracts multiline info from a makefile
 * @param {string} name - The name of the Makefile parameter to extract e.g. C_SOURCES
 * @param {string} makefile - A string representation of the Makefile
 */
export function extractMultiLineInfo(name: string, makefile: string): string[] {
  const splitData = makefile.split(/\r\n|\r|\n/);
  const startPattern = new RegExp(`${name}\\s=\\s`, 'gmi');
  // const endPattern = new RegExp('^-?[a-z].*\\$', 'gim');
  const endPattern = /^-?[a-z].*\b$/gim;
  const emptyPattern = /^(\s*)$/gim;
  let end = 0;
  let start = 0;
  const cleanStrings = [] as string[];

  _.map(splitData, (line, ind) => {
    if (start && !end) {
      if (emptyPattern.test(line)) {
        end = ind;
        return;
      }
      cleanStrings.push(line.replace(/(\s\\$)|(\s.$)/gim, ''));
      if (endPattern.test(line)) {
        end = ind;
      }
    }
    if (startPattern.test(line)) {
      start = ind;
    }
  });

  return cleanStrings;
}

/**
 * @description Function for getting the target from the hal_msp.c file
 * e.g getting the target stm32l4x from: Src/stm32l4xx_hal_msp.c
 * @param {string[]} cFiles
 */
export function getTargetSTM(cFiles: string[]) {
  const regPattern = /(.*\/)?(.*)x_hal_msp.c/i;
  let output = '';
  cFiles.forEach((fileName) => {
    if (regPattern.test(fileName)) {
      const regOut = regPattern.exec(fileName);
      const last = _.last(regOut) || '';
      output = last;
    }
  });
  return output;
}

/**
 * @description loops through an object file and tries to find the relevant documents
 * in the provided makefile
 * @param {string} makefile - A string representation of the Makefile
 */
export function extractMakefileInfo(makefile: string): MakeInfo {
  const output = new MakeInfo();
  _.forEach(output, (_entry, key) => {
    // converts the make file key from camelCase to makefile casing. e.g. from cSources to c_sources
    let makeFileKey = _.replace(_.kebabCase(key), '-', '_');

    // Guard float-abi is the only key that does not hold the naming convention.
    if (makeFileKey === 'float_abi') {
      makeFileKey = 'float-abi';
    }
    const info = extractSingleLineInfo(makeFileKey, makefile);
    if (!info || info.length === 0) {return;}
    if (info.indexOf('\\') !== -1) {
      _.set(output, key, extractMultiLineInfo(makeFileKey, makefile));
    } else {
      _.set(output, key, info);
    }
  });

  // get the targetSTM separately as we need the cSources
  output.targetMCU = getTargetSTM(output.cSources);
  return output;
}

/**
 * @description async function for retrieving information from a makefile in JSON format.
 * @param {string} location - location of the makefile
 */
export default async function getMakefileInfo(location: string): Promise<MakeInfo> {
  return new Promise(async (resolve, reject) => {
    let loc = './Makefile';
    if (location) {
      loc = location;
    }

    // FIXME: weird guard this should be specified before hand.
    // Guard for checking if the makefile name is actually appended to the location
    if (loc.lastIndexOf('Makefile') === -1) {
      if (loc.charAt(loc.length - 1) !== '/') {
        loc = loc.concat('/');
      }
      loc = loc.concat('Makefile');
    }


    // try getting the makefile
    let makefile = '' as string;
    try {
      makefile = await getMakefile(loc);
      console.log('The makefile is', makefile);
    } catch (err) {
      window.showErrorMessage('Something went wrong with getting the information from the makefile. Please make sure there is a makefile and that the project is initialized through STM32CubeMX.', err);
      reject(err);
      return;
    }
    // when the makefile is found, extract the information according to the makefileInfo fields
    resolve(extractMakefileInfo(makefile));
  });
}

// module.exports = {
//   getMakefileInfo,
//   makefileInfo,
// };
