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

import { Uri, workspace } from 'vscode';

import MakeInfo from '../types/MakeInfo';
import { getTargetMCUFromFullName } from '../OpenOcdTargetFiles';
import { basename, join } from 'path';

/**
 * @description
 * @param {string} location - location of the makefile e.g. /filepath/Makefile
 */
export async function getMakefileInWorkspace(location: string): Promise<string> {
  let makefileLocation = location;
  if (basename(makefileLocation) !== 'Makefile') {
    makefileLocation = join(makefileLocation, 'Makefile');
  }
  const makefileFile = await workspace.fs.readFile(Uri.file(makefileLocation));
  const makefile = Buffer.from(makefileFile).toString('utf-8');
  return makefile;
}

/**
 * Removes the \ and enter from the makefile to convert it to a large single line.
 * @param makefile the makefile
 */
function convertLineBreaksToSingleLine(makefile: string): string {
  const matchingPattern = /( +\\[\n\r]{1,2})/gm;
  return makefile.replace(matchingPattern, ' ');
}
/**
 * Extracts the variables from te makefile.
 * @param makefile the makefile with all the breaks (\\\n) taken out.
 * @returns an object with all the variables name as the key and a string of values as the values.
 */
function extractSingleLineVariablesFromMakefile(makefile: string): { [key: string]: string[] } {
  const variableMatchingPattern = /.* \+?= .*/g;
  const variables = makefile.match(variableMatchingPattern);

  const variableAndStringMatcher = /(.*) \+?= (.*)/;

  const variablesSplit = variables?.map((variableLine: string) => {
    const variableAndString = variableAndStringMatcher.exec(variableLine);
    return {
      name: variableAndString?.[1],
      values: variableAndString?.[2]
        .split(' ')
        .filter((entryString) => entryString !== '')
        .map((entryString) => entryString.trim())
    };
  });


  const variableObject: { [key: string]: string[] } = {};
  variablesSplit?.forEach(({ name, values }: { name: string | undefined, values: string[] | undefined }) => {
    if (name !== undefined && values !== undefined) {
      if (!variableObject?.[name]) {
        variableObject[name] = [];
      }
      variableObject[name] = variableObject[name].concat(values);
    }
  });
  return variableObject;
}


/**
 * @description - Extracts the build specification from the makefile e.g nosys.specs  
 * @param makefile  - A string representation of the Makefile
 * @returns 
 */
export function extractBuildSpecification(makefile: string): string[] {
  const specsRegex = /\s-specs=\w+\.specs/g;
  const output = [];
  let result = specsRegex.exec(makefile);
  while (result) {
    output.push(result[0].trim());
    result = specsRegex.exec(makefile);
  }
  return output;
}
type CubeMXMakefile = Omit<MakeInfo, 'tools' | 'language' | 'customMakefileRules'>;


const makeInfoPrefixes: [keyof CubeMXMakefile, string][] = [
  ['cDefs', '-D'],
  ['asDefs', '-D'],
  ['cIncludes', '-I'],
  ['libdir', '-L'],
  ['libs', '-l'],
  ['optimization', '-'],
  ['fpu', '-mfpu='],
  ['cpu', '-mcpu='],
];
/**
 * Removes prefixes from an array.
 * @param information the array on which prefixes need to be removed
 * @param prefix the prefix to be removed e.g. -I
 */
export function removePrefixes(information: string[], prefix: string): string[] {
  return information.map((entry) => {
    const trimmedEntry = entry.trim();
    return trimmedEntry.indexOf(prefix) === 0 ? trimmedEntry.replace(prefix, '') : trimmedEntry;
  });
}
/**
 * Removes prefixes from lists of items, e.g. definitions, libraries
 * Do note however it does not remove the prefixes like -mcpu
 * @param CubeMXMakefileInfo MakefileInfo with prefixes that will be removed in the process.
 */
function removePrefixesFromMakefile(cubeMXMakefileInfo: CubeMXMakefile): void {
  makeInfoPrefixes.forEach(([makefileInfoKey, prefix]) => {
    if (Array.isArray(cubeMXMakefileInfo[makefileInfoKey])) {
      const prefixesRemoved = removePrefixes(cubeMXMakefileInfo[makefileInfoKey] as string[], prefix);
      cubeMXMakefileInfo[makefileInfoKey] = [...prefixesRemoved] as string & string[];
    } else {
      const prefixesRemoved = removePrefixes([cubeMXMakefileInfo[makefileInfoKey]] as string[], prefix);
      cubeMXMakefileInfo[makefileInfoKey] =
        (prefixesRemoved[0] ? prefixesRemoved[0] : '') as string[] & string;
    }
  });
}

const makeInfoKeysToMakefileKeys: [keyof CubeMXMakefile, string][] = [
  ['cDefs', 'C_DEFS'],
  ['asDefs', 'AS_DEFS'],
  ['cIncludes', 'C_INCLUDES'],
  ['cSources', 'C_SOURCES'],
  ['asmSources', 'ASM_SOURCES'],
  ['asmSources', 'ASMM_SOURCES'],
  ['libdir', 'LIBDIR'],
  ['libs', 'LIBS'],
  ['target', 'TARGET'],
  ['cpu', 'CPU'],
  ['fpu', 'FPU'],
  ['floatAbi', 'FLOAT-ABI'],
  ['ldscript', 'LDSCRIPT'],
  ['optimization', 'OPT'],
  ['mcu', 'MCU']
];

/**
 * @description Function for getting the target from the hal_msp.c file
 * e.g getting the target stm32l4x from: Src/stm32l4xx_hal_msp.c
 * @param {string[]} cFiles
 */
export function getOpenocdTargetSTM(linkerScript: string): string {
  let output = '';
  const regPattern = /(STM32\w+)_\w+.ld/i;
  if (regPattern.test(linkerScript)) {
    const regOut = regPattern.exec(linkerScript);
    const last = regOut ? regOut[regOut.length - 1] : '';
    output = last;
    const replaceTrailingXPattern = /x+$/i;
    output = output.replace(replaceTrailingXPattern, '');
    return getTargetMCUFromFullName(output) || '';
  }

  return output;
}
/**
 * 
 * @param makefile: the makefile in string format
 * @note 
 * @returns 
 */
export default function extractMakefileInfo(makefile: string): MakeInfo {

  // get the makefile throws to the upper scope when failed.
  const makefileInfo: MakeInfo = new MakeInfo();

  const singleLinedMakefile = convertLineBreaksToSingleLine(makefile);
  const extractedVariables = extractSingleLineVariablesFromMakefile(singleLinedMakefile);

  makeInfoKeysToMakefileKeys.forEach(([infoKey, makefileKey]) => {
    if (extractedVariables[makefileKey]) {
      if (Array.isArray(makefileInfo[infoKey])) {
        if (Array.isArray(extractedVariables[makefileKey])) {
          (makefileInfo[infoKey] as string[]) = [...makefileInfo[infoKey], ...extractedVariables[makefileKey]];
        } else {
          (makefileInfo[infoKey] as string[]).push(extractedVariables[makefileKey] as unknown as string);
        }
      } else {
        makefileInfo[infoKey] = (extractedVariables[makefileKey]
          .join(' ') as unknown as string)
          .trim() as string & string[];
      }
    }
  });
  makefileInfo.ldFlags = makefileInfo.ldFlags.concat(extractBuildSpecification(makefile));
  makefileInfo.targetMCU = getOpenocdTargetSTM(makefileInfo.ldscript);
  removePrefixesFromMakefile(makefileInfo);

  // copy the cDefinitions to CPP definitions.
  makefileInfo.cxxDefs = [...makefileInfo.cDefs];

  return makefileInfo;
}
