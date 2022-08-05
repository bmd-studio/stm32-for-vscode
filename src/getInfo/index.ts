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
import * as _ from 'lodash';
import * as vscode from 'vscode';

import MakeInfo, { ExtensionConfiguration, SourceFiles } from '../types/MakeInfo';
import {
  getHeaderFiles,
  getIncludeDirectoriesFromFileList,
  getNonGlobIncludeDirectories,
  getSourceFiles,
  sortFiles
} from './getFiles';

import {MODULES_FOLDER} from '../testing/modulesFolder'
import { OpenOCDConfiguration } from '../types/OpenOCDConfig';
import { getBuildToolsFromSettings } from '../buildTools';
import getDefinitionsFromFiles from './getDotDefinitions';
import getMakefileInfo from './getCubeMakefileInfo';

import path = require('path');

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
  const newInfo = _.cloneDeep(totalInfo);

  if (projectConfiguration.language === 'C++') {
    if (checkForFileNameInArray('main.cpp', newInfo.cxxSources) !== -1) {
      // conversion should take place
      const indMain = checkForFileNameInArray('main.c', newInfo.cSources);
      if (indMain >= 0) {
        // remove the main.c file.
        newInfo.cSources.splice(indMain, 1);
      }
    }
    // else {

    //   vscode.window.showWarningMessage('No main.cpp file found, will try to compile this as a C project');
    //   newInfo.cxxSources = [];
    //   newInfo.cxxDefs = [];
    // }
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


type MakeInfoSourcesAndHeaders = Pick<MakeInfo,"cIncludes"| "cSources" | "cxxSources" | "asmSources">;

async function getAllSourcesAndHeaders(
  makeInfo: MakeInfo,
  projectConfiguration: ExtensionConfiguration 
  ): Promise<MakeInfoSourcesAndHeaders> {
  const combinedSourceFiles = _.concat(
    projectConfiguration.sourceFiles,
    makeInfo.cxxSources,
    makeInfo.cSources,
    makeInfo.asmSources
  );
  const combinedHeaderFiles = _.concat(projectConfiguration.includeDirectories, makeInfo.cIncludes);

  const sourceFilePromise = getSourceFiles(combinedSourceFiles);
  const headerFilePromise = getHeaderFiles(combinedHeaderFiles);
  const [
    indiscriminateSourceFileList,
    indiscriminateHeaderFileList
  ] = await Promise.all([sourceFilePromise, headerFilePromise]);


  let filteredSourceFiles = Micromatch.not(indiscriminateSourceFileList, projectConfiguration.excludes);
  let filteredHeaderFiles = Micromatch.not(indiscriminateHeaderFileList, projectConfiguration.excludes);

  const sortedSourceFiles = sortFiles(filteredSourceFiles);
  const includeDirectories = getIncludeDirectoriesFromFileList(filteredHeaderFiles);
  const regularIncludeDirectories = getNonGlobIncludeDirectories(combinedHeaderFiles);

  const filteredIncludeDirectories = Micromatch.not(regularIncludeDirectories, projectConfiguration.excludes);
  const makeInfoSourcesAndHeaders: MakeInfoSourcesAndHeaders = {
    cIncludes: _.concat(includeDirectories, filteredIncludeDirectories),
    cSources: _.uniq(sortedSourceFiles.cSources),
    cxxSources: _.uniq(sortedSourceFiles.cxxSources),
    asmSources: _.uniq(sortedSourceFiles.asmSources),
  };
  return makeInfoSourcesAndHeaders;
}

function extractModuleFileOrFolder(fileList: string[]): string[] {
  const filterFunction = (file:string ): boolean => {
    const normalizedPath = path.normalize(file);
    const hasModulesFolderRoot = normalizedPath.indexOf(`${MODULES_FOLDER}`) === 0;
    return hasModulesFolderRoot;
  };
  return fileList.filter(filterFunction);
}

function extractModuleSourcesAndHeaders(sourcesAndHeaders: MakeInfoSourcesAndHeaders): MakeInfoSourcesAndHeaders {
  return {
    cIncludes: extractModuleFileOrFolder(sourcesAndHeaders.cIncludes),
    cSources: extractModuleFileOrFolder(sourcesAndHeaders.cSources),
    cxxSources: extractModuleFileOrFolder(sourcesAndHeaders.cxxSources),
    asmSources: extractModuleFileOrFolder(sourcesAndHeaders.asmSources),
  };
}

interface TestFilesAndBuildFiles {
  test: MakeInfoSourcesAndHeaders,
  build: MakeInfoSourcesAndHeaders,
}

interface TestFileAndBuildFileLists {
  test: string[];
  build: string[];
}
function extractTestFiles(fileList: string[]): TestFileAndBuildFileLists {
  const filterFunction = (file: string): boolean => {
    return file.includes('.test.');
  };

  const result:TestFileAndBuildFileLists = {
    test: [],
    build: []
  };
  fileList.forEach((entry) => {
    if(filterFunction(entry)) {
      result.test.push(entry);
    } else {
      result.build.push(entry);
    }
  });
  return result;
}

function filterTestFilesAndHeaders(sourcesAndHeaders: MakeInfoSourcesAndHeaders): TestFilesAndBuildFiles {
  type KeysArray = Array<keyof MakeInfoSourcesAndHeaders>;
  const keys: KeysArray = Object.keys(sourcesAndHeaders) as KeysArray;  
  const result:TestFilesAndBuildFiles = {} as TestFilesAndBuildFiles;
  
  keys.forEach((key) => {
    const extractedFiles = extractTestFiles(sourcesAndHeaders[key]);
    result.test[key] = extractedFiles.test;
    result.build[key] = extractedFiles.build;
  });

  return result;
}

/**
 * @description function for getting all the info combined. After this
 * the info is accessible at the default exported info.
 * Combines the makefile info and files in workspace info, also checks
 * if a project is a C or C++ project and converts accordingly.
 * @param {string} location location of the workspace
 */
export async function getInfo(location: string): Promise<MakeInfo> {
  if (!vscode.workspace.workspaceFolders) { throw Error('No workspace folder was selected'); }
  let cubeMakefileInfo = new MakeInfo();
  try {
    cubeMakefileInfo = await getMakefileInfo(location);
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

  // const combinedSourceFiles = _.concat(
  //   projectConfiguration.sourceFiles,
  //   cubeMakefileInfo.cxxSources,
  //   cubeMakefileInfo.cSources,
  //   cubeMakefileInfo.asmSources
  // );
  // const combinedHeaderFiles = _.concat(projectConfiguration.includeDirectories, cubeMakefileInfo.cIncludes);

  // const sourceFilePromise = getSourceFiles(combinedSourceFiles);
  // const headerFilePromise = getHeaderFiles(combinedHeaderFiles);
  // const [
  //   indiscriminateSourceFileList,
  //   indiscriminateHeaderFileList
  // ] = await Promise.all([sourceFilePromise, headerFilePromise]);


  // // TODO: put this logic somewhere else the function is getting to big this way
  // let filteredSourceFiles = Micromatch.not(indiscriminateSourceFileList, projectConfiguration.excludes);
  // let filteredHeaderFiles = Micromatch.not(indiscriminateHeaderFileList, projectConfiguration.excludes);

  // TESTING
  // STM32MakeInfo.testInfo.sourceFiles = Micromatch(filteredSourceFiles, "**/*.test.(c|cc|cpp|cxx)");
  // STM32MakeInfo.testInfo.headerFiles = Micromatch(filteredHeaderFiles, "**/*.test.(h|hpp|hxx)");

  // const libraryFolderSourceFiles = Micromatch(filteredSourceFiles, `${MODULES_FOLDER}/(**|**/**).(c|cc|cpp|cxx)`);
  // const libraryFolderHeaderFiles = Micromatch(filteredSourceFiles, `${MODULES_FOLDER}/(**|**/**).(h|hpp|hxx)`);
  
  // STM32MakeInfo.testInfo.sourceFiles = _.uniq(STM32MakeInfo.testInfo.sourceFiles.concat(libraryFolderSourceFiles));
  // STM32MakeInfo.testInfo.headerFiles = _.uniq(STM32MakeInfo.testInfo.headerFiles.concat(libraryFolderHeaderFiles));
  // STM32MakeInfo.testInfo.headerFiles = _.uniq(getIncludeDirectoriesFromFileList(STM32MakeInfo.testInfo.headerFiles));

  // filteredSourceFiles = Micromatch.not(indiscriminateSourceFileList, "**/*.test.(c|cc|cpp|cxx)");
  // filteredHeaderFiles = Micromatch.not(indiscriminateHeaderFileList, "**/*.test.(h|hpp|hxx)");

  // const sortedSourceFiles = sortFiles(filteredSourceFiles);
  // const includeDirectories = getIncludeDirectoriesFromFileList(filteredHeaderFiles);
  // const regularIncludeDirectories = getNonGlobIncludeDirectories(combinedHeaderFiles);
  // const filteredIncludeDirectories = Micromatch.not(regularIncludeDirectories, projectConfiguration.excludes);
  // TODO: extract all the test specific file.
  // TODO: extract all the module files.
  const sourcesAndHeaders = await getAllSourcesAndHeaders(cubeMakefileInfo, projectConfiguration);
  const filteredTestAndHeaderFiles = filterTestFilesAndHeaders(sourcesAndHeaders);
  const moduleSources = extractModuleSourcesAndHeaders(filteredTestAndHeaderFiles.build);
  

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

  // sources
  STM32MakeInfo.cIncludes = filteredTestAndHeaderFiles.build.cIncludes;
  STM32MakeInfo.cxxSources = filteredTestAndHeaderFiles.build.cxxSources;
  STM32MakeInfo.cSources = filteredTestAndHeaderFiles.build.cSources;
  STM32MakeInfo.asmSources = filteredTestAndHeaderFiles.build.asmSources;

  // testing
  STM32MakeInfo.testInfo.headerFiles = moduleSources.cIncludes.concat(filteredTestAndHeaderFiles.test.cIncludes);
  type SourceFileKeys = Array<keyof SourceFiles>;
  const sourceFileKeys: SourceFileKeys = Object.keys(sourcesAndHeaders) as SourceFileKeys;
  sourceFileKeys.forEach((key) => {
    STM32MakeInfo.testInfo[key] = moduleSources[key].concat(filteredTestAndHeaderFiles.test[key]);
  });
  

  // libraries
  STM32MakeInfo.libs = _.uniq(_.concat(projectConfiguration.libraries, cubeMakefileInfo.libs));
  STM32MakeInfo.libdir = _.uniq(_.concat(projectConfiguration.libraryDirectories, cubeMakefileInfo.libdir));

  // definitions
  STM32MakeInfo.asDefs = _.uniq(_.concat(
    cubeMakefileInfo.asDefs,
    projectConfiguration.asDefinitions,
    asDefinitionsFromFile
  ));
  STM32MakeInfo.cDefs = _.uniq(_.concat(
    cubeMakefileInfo.cDefs,
    projectConfiguration.cDefinitions,
    cDefinitionsFromFile
  ));
  STM32MakeInfo.cxxDefs = _.uniq(_.concat(
    cubeMakefileInfo.cxxDefs,
    projectConfiguration.cxxDefinitions,
    cxxDefinitionsFromFile
  ));
  
  // flags 
  STM32MakeInfo.assemblyFlags = _.uniq(_.concat(cubeMakefileInfo.assemblyFlags, projectConfiguration.assemblyFlags));
  STM32MakeInfo.ldFlags = _.uniq(_.concat(cubeMakefileInfo.ldFlags, projectConfiguration.linkerFlags));
  STM32MakeInfo.cFlags = _.uniq(_.concat(cubeMakefileInfo.cFlags, projectConfiguration.cFlags));
  STM32MakeInfo.cxxFlags = _.uniq(_.concat(cubeMakefileInfo.cxxFlags, projectConfiguration.cxxFlags));

  // embedded target information
  STM32MakeInfo.cpu = projectConfiguration.cpu;
  STM32MakeInfo.floatAbi = projectConfiguration.floatAbi;
  STM32MakeInfo.fpu = projectConfiguration.fpu;
  STM32MakeInfo.mcu = cubeMakefileInfo.mcu;
  STM32MakeInfo.targetMCU = projectConfiguration.targetMCU;
  
  STM32MakeInfo.language = projectConfiguration.language;
  STM32MakeInfo.optimization = projectConfiguration.optimization;
  STM32MakeInfo.ldscript = projectConfiguration.ldscript;
  
  const buildTools = getBuildToolsFromSettings();
  STM32MakeInfo.tools = {
    ...STM32MakeInfo.tools,
    ...buildTools,
  };
  // set empty string, as sometimes float-abi or FPU are not included in the STM Makefile
  _.forEach(STM32MakeInfo, (entry, key) => {
    if (entry === null || entry === undefined) {
      _.set(STM32MakeInfo, key, '');
    }
  });
  STM32MakeInfo.customMakefileRules = projectConfiguration.customMakefileRules;

  // check for CPP project
  const finalInfo = await checkAndConvertCpp(STM32MakeInfo, projectConfiguration);
  return finalInfo;
}
