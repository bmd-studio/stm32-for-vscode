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
 * Set of functions for creating a makefile based on
 * STM32 makefile info and the Src, Inc and Lib folders
 * Created by Jort Band - Bureau Moeilijke Dingen
*/

import * as Micromatch from 'micromatch';
import * as OpenOCDConfigFile from '../configuration/openOCDConfig';
import * as STM32ProjectConfiguration from '../configuration/stm32Config';
import { uniq, forEach, set } from 'lodash';
import * as vscode from 'vscode';

import MakeInfo, { ExtensionConfiguration } from '../types/MakeInfo';
import {
  getHeaderFiles,
  getIncludeDirectoriesFromFileList,
  getNonGlobIncludeDirectories,
  getSourceFiles,
  sortFiles
} from './getFiles';
import getMakefileInfo, { getMakefileInWorkspace } from './getCubeMakefileInfo';

import { OpenOCDConfiguration } from '../types/OpenOCDConfig';
import { getToolChainFromGlobalState } from '../buildTools';
import getDefinitionsFromFiles from './getDotDefinitions';

/**
 * @description returns the location of a specific file in an array
 * @param {string} name name of file to search in path.
 * @param {string[]} array
 * @param {boolean} [caseMatters]
 */
export function checkForFileNameInArray(name: string, array: string[], caseMatters?: boolean): number {
  const reg = new RegExp(`(^|\\b)${name}$`, `${caseMatters ? '' : 'i'}`);
  for (let i = 0; i < array.length; i += 1) {
    if (array[i].search(reg) >= 0) {
      return i;
    }
  }
  return -1;
}

/**
 * @description Check if the program is a c++ or c program and automatically converts.
 * @param {object} totalInfo combined info of the makefile and file list
 */
export async function checkAndConvertCpp(
  totalInfo: MakeInfo,
  projectConfiguration: ExtensionConfiguration
): Promise<MakeInfo> {
  const newInfo = { ...totalInfo };

  if (projectConfiguration.language === 'C++') {
    if (checkForFileNameInArray('main.cpp', newInfo.cxxSources) !== -1) {
      // conversion should take place
      const indMain = checkForFileNameInArray('main.c', newInfo.cSources);
      if (indMain >= 0) {
        // remove the main.c file.
        newInfo.cSources.splice(indMain, 1);
      }
    }

  } else {
    if (checkForFileNameInArray('main.cpp', newInfo.cxxSources) !== -1) {
      const result = await vscode.window.showWarningMessage(
        `We can see that you are trying to compile a C project with a main.cpp file. 
        Do you want to convert this project to a C++ project?`,
        'yes', 'no');
      if (result === 'yes') {
        projectConfiguration.language = 'C++';
        await STM32ProjectConfiguration.writeConfigFile(projectConfiguration);
        return checkAndConvertCpp(totalInfo, projectConfiguration);
      }
    }
  }
  return newInfo;
}

/**
 * @description function for getting all the info combined. After this
 * the info is accessible at the default exported info.
 * Combines the makefile info and files in workspace info, also checks
 * if a project is a C or C++ project and converts accordingly.
 * @param {string} location location of the workspace
 */
export async function getInfo(context: vscode.ExtensionContext, location: string): Promise<MakeInfo> {
  if (!vscode.workspace.workspaceFolders) { throw Error('No workspace folder was selected'); }
  let cubeMakefileInfo = new MakeInfo();
  try {
    const cubeMakefile = await getMakefileInWorkspace(location);
    cubeMakefileInfo = await getMakefileInfo(cubeMakefile);
  } catch (e) {
    // do not need to catch anything
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const STM32MakeInfo = new MakeInfo();

  const standardConfig: ExtensionConfiguration = new ExtensionConfiguration();
  standardConfig.importRelevantInfoFromMakefile(cubeMakefileInfo);
  const projectConfiguration = await STM32ProjectConfiguration.readOrCreateConfigFile(standardConfig);

  await OpenOCDConfigFile.readOrCreateConfigFile(
    new OpenOCDConfiguration(cubeMakefileInfo.targetMCU)
  );

  const combinedSourceFiles = [
    ...projectConfiguration.sourceFiles,
    ...cubeMakefileInfo.cxxSources,
    ...cubeMakefileInfo.cSources,
    ...cubeMakefileInfo.asmSources
  ];
  const combinedHeaderFiles = [
    ...projectConfiguration.includeDirectories,
    ...cubeMakefileInfo.cIncludes,
  ];

  const sourceFilePromise = getSourceFiles(combinedSourceFiles);
  const headerFilePromise = getHeaderFiles(combinedHeaderFiles);
  const [
    indiscriminateSourceFileList,
    indiscriminateHeaderFileList
  ] = await Promise.all([sourceFilePromise, headerFilePromise]);


  const filteredSourceFiles = Micromatch.not(indiscriminateSourceFileList, projectConfiguration.excludes);
  const filteredHeaderFiles = Micromatch.not(indiscriminateHeaderFileList, projectConfiguration.excludes);

  const sortedSourceFiles = sortFiles(filteredSourceFiles);
  const includeDirectories = getIncludeDirectoriesFromFileList(filteredHeaderFiles);
  const regularIncludeDirectories = getNonGlobIncludeDirectories(combinedHeaderFiles);
  const filteredIncludeDirectories = Micromatch.not(regularIncludeDirectories, projectConfiguration.excludes);

  let cDefinitionsFromFile: string[] = [];
  let cxxDefinitionsFromFile: string[] = [];
  let asDefinitionsFromFile: string[] = [];
  try {
    cDefinitionsFromFile = await getDefinitionsFromFiles(location, projectConfiguration.cDefinitionsFile);
    cxxDefinitionsFromFile = await getDefinitionsFromFiles(location, projectConfiguration.cxxDefinitionsFile);
    asDefinitionsFromFile = await getDefinitionsFromFiles(location, projectConfiguration.asDefinitionsFile);
  } catch (err) {

  }

  // replace spaces with underscores, to prevent spaces in path issues.
  STM32MakeInfo.target = projectConfiguration.target.split(' ').join('_');
  STM32MakeInfo.cIncludes = uniq([...includeDirectories, ...filteredIncludeDirectories]);
  STM32MakeInfo.cxxSources = sortedSourceFiles.cxxSources;
  STM32MakeInfo.cSources = sortedSourceFiles.cSources;
  STM32MakeInfo.asmSources = sortedSourceFiles.asmSources;
  STM32MakeInfo.libs = uniq([...projectConfiguration.libraries, ...cubeMakefileInfo.libs]);
  STM32MakeInfo.libdir = uniq([...projectConfiguration.libraryDirectories, ...cubeMakefileInfo.libdir]);
  STM32MakeInfo.asDefs = uniq([
    ...cubeMakefileInfo.asDefs,
    ...projectConfiguration.asDefinitions,
    ...asDefinitionsFromFile
  ]);
  STM32MakeInfo.assemblyFlags = uniq([...cubeMakefileInfo.assemblyFlags, ...projectConfiguration.assemblyFlags]);
  STM32MakeInfo.ldFlags = uniq([...cubeMakefileInfo.ldFlags, ...projectConfiguration.linkerFlags]);
  STM32MakeInfo.cDefs = uniq([
    ...cubeMakefileInfo.cDefs,
    ...projectConfiguration.cDefinitions,
    ...cDefinitionsFromFile
  ]);
  STM32MakeInfo.cFlags = uniq([...cubeMakefileInfo.cFlags, ...projectConfiguration.cFlags]);
  STM32MakeInfo.cpu = projectConfiguration.cpu;
  STM32MakeInfo.cxxDefs = uniq([
    ...cubeMakefileInfo.cxxDefs,
    ...projectConfiguration.cxxDefinitions,
    ...cxxDefinitionsFromFile
  ]);
  STM32MakeInfo.cxxFlags = uniq([...cubeMakefileInfo.cxxFlags, ...projectConfiguration.cxxFlags]);
  STM32MakeInfo.floatAbi = projectConfiguration.floatAbi;
  STM32MakeInfo.fpu = projectConfiguration.fpu;
  STM32MakeInfo.language = projectConfiguration.language;
  STM32MakeInfo.optimization = projectConfiguration.optimization;
  STM32MakeInfo.ldscript = projectConfiguration.ldscript;
  STM32MakeInfo.mcu = cubeMakefileInfo.mcu;
  STM32MakeInfo.targetMCU = projectConfiguration.targetMCU;
  STM32MakeInfo.makeFlags = projectConfiguration.makeFlags;
  const buildTools = getToolChainFromGlobalState(context);
  STM32MakeInfo.tools = {
    ...STM32MakeInfo.tools,
    ...buildTools,
  };
  // set empty string, as sometimes float-abi or FPU are not included in the STM Makefile
  forEach(STM32MakeInfo, (entry, key) => {
    if (entry === null || entry === undefined) {
      set(STM32MakeInfo, key, '');
    }
  });
  STM32MakeInfo.customMakefileRules = projectConfiguration.customMakefileRules;

  // check for CPP project
  const finalInfo = await checkAndConvertCpp(STM32MakeInfo, projectConfiguration);
  return finalInfo;
}
