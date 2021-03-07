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

import * as OpenOCDConfigFile from './configuration/openOCDConfig';
import * as STM32ProjectConfiguration from './configuration/stm32Config';
import * as _ from 'lodash';
import * as vscode from 'vscode';

import MakeInfo, { BuildFiles, ExtensionConfiguration, ToolChain } from './types/MakeInfo';
import getFileList, { getHeaderFiles, getSourceFiles, scanForFiles } from './GetBuildFilesFromWorkspace';
import { getIgnores, stripIgnoredFiles } from './HandleIgnoredFiles';

import { OpenOCDConfiguration } from './types/OpenOCDConfig';
import { getBuildToolsFromSettings } from './buildTools';
import getMakefileInfo from './ExtractMakefileInfo';

/**
 *
 * @param {string[] | object} arr1
 * @param {string[] | object} arr2
 * @param {string} key
 * @param {object} obj
 */
export function combineArraysIntoObject(arr1: string[], arr2: string[], key: string, obj: {}): {} {
  // GUARD: against empty or null arrays.
  if (!arr2 || !_.isArray(arr2)) {
    if (arr1 && _.isArray(arr1)) {
      _.set(obj, key, arr1.sort());
      return obj;
    }
    _.set(obj, key, []);
    return obj;
  }
  if (!arr1 || !_.isArray(arr1)) {
    _.set(obj, key, arr2);
    return obj;
  }
  let totalArray = arr1.concat(arr2);
  totalArray = _.uniq(totalArray).sort();
  _.set(obj, key, totalArray);
  return obj;
}

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
export function checkAndConvertCpp(totalInfo: MakeInfo): MakeInfo {
  const newInfo = _.cloneDeep(totalInfo);
  if (checkForFileNameInArray('main.cpp', newInfo.cxxSources) >= 0) {
    const indMain = checkForFileNameInArray('main.c', newInfo.cSources);
    if (indMain >= 0) {
      // remove the main.c file.
      newInfo.cSources.splice(indMain, 1);
    }
    return newInfo;
  }
  if (!_.isEmpty(newInfo.cxxSources)) {
    vscode.window.showWarningMessage(
      'You have several cxx/cpp files, however no main.cpp file. Will ignore these files for now'
    );
  }
  // else it is a C only file, so remove all the C++ files and definitions.
  newInfo.cxxSources = [];
  newInfo.cxxDefs = [];
  return newInfo;
}

/**
 * @description Combines the information from the Makefile and the FileList
 * @param {object} makefileInfo
 * @param {object} fileList
 */
export function combineInfo(makefileInfo: MakeInfo, fileList: BuildFiles, requirementInfo: ToolChain): MakeInfo {
  const bundledInfo = {} as MakeInfo;


  // TODO: check if cxxIncludes are actually a thing. For now this could be left out as far as I can tell.
  // TODO: check if asIncludes are actually a thing. For now this could be left out as far as I can tell.
  // Bundling info which both the makeFile and the File list have
  combineArraysIntoObject(makefileInfo.cSources, fileList.cSources, 'cSources', bundledInfo);
  combineArraysIntoObject(makefileInfo.cxxSources, fileList.cxxSources, 'cxxSources', bundledInfo);
  combineArraysIntoObject(makefileInfo.asmSources, fileList.asmSources, 'asmSources', bundledInfo);
  combineArraysIntoObject(makefileInfo.libs, fileList.libs, 'libs', bundledInfo);
  combineArraysIntoObject(makefileInfo.libdir, fileList.libdir, 'libdir', bundledInfo);
  combineArraysIntoObject(makefileInfo.cIncludes, fileList.cIncludes, 'cIncludes', bundledInfo);
  // combineArraysIntoObject(makefileInfo.cxxIncludes, [], 'cxxIncludes', bundledInfo);
  // combineArraysIntoObject(makefileInfo.asIncludes, [], 'asIncludes', bundledInfo);

  // now assign make list values
  _.set(bundledInfo, 'target', _.replace(makefileInfo.target, /\s/g, '_'));
  _.set(bundledInfo, 'cpu', makefileInfo.cpu);
  _.set(bundledInfo, 'fpu', makefileInfo.fpu);
  _.set(bundledInfo, 'floatAbi', makefileInfo.floatAbi);
  _.set(bundledInfo, 'mcu', makefileInfo.mcu);
  _.set(bundledInfo, 'ldscript', makefileInfo.ldscript);
  _.set(bundledInfo, 'cDefs', makefileInfo.cDefs);
  _.set(bundledInfo, 'cxxDefs', makefileInfo.cxxDefs);
  _.set(bundledInfo, 'asDefs', makefileInfo.asDefs);
  _.set(bundledInfo, 'targetMCU', makefileInfo.targetMCU);
  if (requirementInfo) {
    _.set(bundledInfo, 'tools', requirementInfo); // extra check to not break tests, if this is not provided.
  }
  if (!_.isEmpty(bundledInfo.cxxSources)) { bundledInfo.language = 'C++'; }

  return bundledInfo;
}



// FIXME: do I really want to use a global info variable for this?
/**
 * @description function for getting all the info combined. After this
 * the info is accessible at the default exported info.
 * Combines the makefile info and files in workspace info, also checks
 * if a project is a C or C++ project and converts accordingly.
 * @param {string} location location of the workspace
 */
export async function getInfo(location: string): Promise<MakeInfo> {
  // TODO: This needs to be refactored
  // FIXME: aftor refactoring this is the first that is out of sync. Should update this functions.
  const makefileInfo = await getMakefileInfo(location);

  const standardConfig: ExtensionConfiguration = new ExtensionConfiguration();
  standardConfig.importRelevantInfoFromMakefile(makefileInfo);
  const projectConfiguration = await STM32ProjectConfiguration.readOrCreateConfigFile(standardConfig);

  const openOcdConfig = await OpenOCDConfigFile.readOrCreateConfigFile(new OpenOCDConfiguration(makefileInfo.targetMCU));

  const combinedSourceFiles = _.concat(projectConfiguration.sourceFiles, makefileInfo.cxxSources, makefileInfo.cSources, makefileInfo.asmSources);
  const combinedHeaderFiles = _.concat(projectConfiguration.includeDirectories, makefileInfo.cIncludes);

  // TODO: put this into a function

  const sourceFileExtensions = ['cpp', 'c', 'a', 's', 'cxx'];
  const headerExtensions = ['h', 'hpp', 'hxx'];
  const sourceFilePromise = getSourceFiles(combinedSourceFiles);
  const headerFilePromise = getHeaderFiles(combinedHeaderFiles);
  const [indiscriminateSourceFileList, indiscriminateHeaderFileList] = await Promise.all([sourceFilePromise, headerFilePromise]);
  // TODO: LAST ENTRY: Do the ignored files over here.



  const listFilesInfoPromise = getFileList(location);
  const buildTools = getBuildToolsFromSettings();

  const allInfo = await Promise.all([listFilesInfoPromise]);
  // TODO: also add a get config in here

  const [fileInfo] = allInfo;

  // FIXME: handle file ignores



  console.log('all info', allInfo, projectConfiguration, openOcdConfig);

  let combinedInfo = combineInfo(makefileInfo, fileInfo, buildTools);
  combinedInfo = checkAndConvertCpp(combinedInfo);
  console.log('combined info', combineInfo);
  if (!vscode.workspace.workspaceFolders) { throw Error('No workspace folder was selected'); }
  // FIXME: remove the getIgnores.
  getIgnores(vscode.workspace.workspaceFolders[0].uri).then((ignores: string[]) => {
    combinedInfo.cSources = stripIgnoredFiles(combinedInfo.cSources, ignores);
    combinedInfo.cxxSources = stripIgnoredFiles(combinedInfo.cxxSources, ignores);
    combinedInfo.asmSources = stripIgnoredFiles(combinedInfo.asmSources, ignores);
  });
  return combinedInfo;
}
