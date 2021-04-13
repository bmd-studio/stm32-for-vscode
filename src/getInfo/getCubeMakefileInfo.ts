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

import * as _ from 'lodash';
import * as path from 'path';

import { Uri, window, workspace } from 'vscode';

import MakeInfo from '../types/MakeInfo';

/**
 * @description
 * @param {string} location - location of the makefile e.g. /filepath/Makefile
 */
export async function getMakefile(location: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const makefileFile = await workspace.fs.readFile(Uri.file(location));
      const makefile = Buffer.from(makefileFile).toString('utf-8');
      resolve(makefile);
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
 * @description - Extract the libraries from the makefile e.g the nosys library
 * @param makefile - A string representation of the Makefile
 */
export function extractLibs(makefile: string): string[] {
  const libsString = extractSingleLineInfo('LIBS', makefile);
  const libRegex = /-l\S*/g;
  const result = libsString.match(libRegex) || [];
  const stringArrayResult = result.map((entry: string) => entry);
  return stringArrayResult;
}

/**
 * Removes prefixes from an array.
 * @param information the array on which prefixes need to be removed
 * @param prefix the prefix to be removed e.g. -I
 */
export function removePrefixes(information: string[], prefix: string): string[] {
  const output = information.map((entry) => {
    return entry.replace(new RegExp("^\\s*" + prefix), '');
  });
  return output;
}

/**
 * @description Function for getting the target from the hal_msp.c file
 * e.g getting the target stm32l4x from: Src/stm32l4xx_hal_msp.c
 * @param {string[]} cFiles
 */
export function getTargetSTM(cFiles: string[]): string {
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

    if (!info || info.length === 0) { return; }

    if (info.indexOf('\\') !== -1) {
      _.set(output, key, extractMultiLineInfo(makeFileKey, makefile));
    } else {
      _.set(output, key, info);
      if (key === 'libs') {
        _.set(output, key, extractLibs(makefile));
      }
    }
  });



  // get the targetSTM separately as we need the cSources
  output.targetMCU = getTargetSTM(output.cSources);

  // remove prefixes.
  output.libs = removePrefixes(output.libs, '-l');
  output.libdir = removePrefixes(_.isArray(output.libdir) ? output.libdir : [output.libdir], '-L');
  output.cDefs = removePrefixes(output.cDefs, '-D');
  output.cxxDefs = removePrefixes(output.cxxDefs, '-D');
  output.asDefs = removePrefixes(output.asDefs, '-D');
  output.cIncludes = removePrefixes(output.cIncludes, '-I');

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

    // Guard for checking if the makefile name is actually appended to the location
    if (path.posix.basename(location) !== 'Makefile') {
      loc = path.posix.join(loc, 'Makefile');
    }

    // try getting the makefile
    let makefile = '' as string;
    try {
      makefile = await getMakefile(loc);
    } catch (err) {
      // eslint-disable-next-line max-len
      window.showErrorMessage('Something went wrong with getting the information from the makefile. Please make sure there is a makefile and that the project is initialized through STM32CubeMX.', err);
      reject(err);
      return;
    }
    // when the makefile is found, extract the information according to the makefileInfo fields
    resolve(extractMakefileInfo(makefile));
  });
}


// FIXME: all prefixes should be deleted in this stage.