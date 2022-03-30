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

import { CubeMXMakefileInfo } from '../types/MakeInfo';

/**
 * Removes the \ and enter from the makefile to convert it to a large single line.
 * @param makefile the makefile
 */
function convertLineBreaksToSingleLine(makefile: string): string {
  const matchingPattern = /( +\\[\n\r])/gm;
  return makefile.replaceAll(matchingPattern, ' ');
}
/**
 * Extracts the variables from te makefile.
 * @param makefile the makefile with all the breaks (\\\n) taken out.
 * @returns an object with all the variables name as the key and a string of values as the values.
 */
function extractSingleLineVariablesFromMakefile(makefile: string): { [key: string]: string[] } {
  const variableMatchingPattern = /.* \+?= [\w 	/\\\.\-\=$\(\),]*/gm;
  const variables = makefile.match(variableMatchingPattern);

  const variableAndStringMatcher = /(.*) \+?= ([\w 	/\\\.\-\=$\(\),]*)/;

  const variablesSplit = variables?.map((variableLine: string) => {
    const variableAndString = variableAndStringMatcher.exec(variableLine);
    return {
      name: variableAndString?.[1],
      values: variableAndString?.[2].split(' ').filter((entryString) => entryString !== '')
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
    output.push(result[0]);
    result = specsRegex.exec(makefile);
  }
  return output;
}

const makeInfoPrefixes: [keyof CubeMXMakefileInfo, string][] = [
  ['cDefinitions', '-D'],
  ['assemblyDefinitions', '-D'],
  ['cIncludeDirectories', '-I'],
  ['libraryDirectories', '-L'],
  ['libraries', '-l'],
  ['optimization', '-'],
];
/**
 * Removes prefixes from an array.
 * @param information the array on which prefixes need to be removed
 * @param prefix the prefix to be removed e.g. -I
 */
export function removePrefixes(information: string[], prefix: string): string[] {
  return information.map((entry) => {
    return entry.replace(new RegExp("^\\s*" + prefix), '');
  });
}
/**
 * Removes prefixes from lists of items, e.g. definitions, libraries
 * Do note however it does not remove the prefixes like -mcpu
 * @param CubeMXMakefileInfo MakefileInfo with prefixes that will be removed in the process.
 */
function removePrefixesFromMakefile(cubeMXMakefileInfo: CubeMXMakefileInfo): void {
  makeInfoPrefixes.forEach(([makefileInfoKey, prefix]) => {
    if (Array.isArray(cubeMXMakefileInfo[makefileInfoKey])) {
      removePrefixes(cubeMXMakefileInfo[makefileInfoKey] as string[], prefix);
    } else {
      removePrefixes([cubeMXMakefileInfo[makefileInfoKey]] as string[], prefix);
      cubeMXMakefileInfo[makefileInfoKey] =
        (cubeMXMakefileInfo[makefileInfoKey][0] ? cubeMXMakefileInfo[makefileInfoKey][0] : '') as string[] & string;
    }

  });
}

const makeInfoKeysToMakefileKeys: [keyof CubeMXMakefileInfo, string][] = [
  ['cDefinitions', 'C_DEFS'],
  ['assemblyDefinitions', 'AS_DEFS'],
  ['cIncludeDirectories', 'C_INCLUDES'],
  ['cSources', 'C_SOURCES'],
  ['assemblySources', 'ASM_SOURCES'],
  ['libraryDirectories', 'LIBDIR'],
  ['libraries', 'LIBS'],
  ['projectName', 'TARGET'],
  ['cpu', 'CPU'],
  ['fpu', 'FPU'],
  ['floatAbi', 'FLOAT-ABI'],
  ['linkerScript', 'LDSCRIPT'],
  ['optimization', 'OPT'],
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
  }

  return output;
}
/**
 * 
 * @param makefile 
 * @returns 
 */
export default function extractMakefileInfo(makefile: string): CubeMXMakefileInfo {
  const makefileInfo: CubeMXMakefileInfo = new CubeMXMakefileInfo();
  const singleLinedMakefile = convertLineBreaksToSingleLine(makefile);
  const extractedVariables = extractSingleLineVariablesFromMakefile(singleLinedMakefile);
  makeInfoKeysToMakefileKeys.forEach(([infoKey, makefileKey]) => {
    if (extractedVariables[makefileKey]) {
      if (Array.isArray(makefileInfo[infoKey])) {
        makefileInfo[infoKey] = extractedVariables[makefileKey] as string & string[];
      } else {
        makefileInfo[infoKey] = extractedVariables[makefileKey].join('') as string & string[];
      }
    }
  });
  makefileInfo.linkerFlags = makefileInfo.linkerFlags.concat(extractBuildSpecification(makefile));
  makefileInfo.openocdTarget = getOpenocdTargetSTM(makefileInfo.linkerScript);
  removePrefixesFromMakefile(makefileInfo);

  return makefileInfo;
}