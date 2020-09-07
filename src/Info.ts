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

import * as _ from 'lodash';
import * as vscode from 'vscode';

import MakeInfo, { BuildFiles, ToolChain } from './types/MakeInfo';
import { getIgnores, stripIgnoredFiles } from './HandleIgnoredFiles';

import getFileList from './GetBuildFilesFromWorkspace';
import getMakefileInfo from './ExtractMakefileInfo';
import getRequirements from './Requirements';

const info = new MakeInfo();
export default info;
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
  if (!_.isEmpty(info.cxxSources)) {
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
  combineArraysIntoObject(makefileInfo.libDirs, fileList.libDirs, 'libDirs', bundledInfo);
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
  return new Promise((resolve, reject) => {
    const makefileInfoPromise = getMakefileInfo(location);
    const listFilesInfoPromise = getFileList(location);
    const requirementsInfoPromise = getRequirements();

    // TODO: also add a get config in here
    Promise.all([makefileInfoPromise, listFilesInfoPromise, requirementsInfoPromise]).then((values) => {
      const [makefileInfo, fileInfo, requirementInfo] = values;
      let combinedInfo = combineInfo(makefileInfo, fileInfo, requirementInfo);
      combinedInfo = checkAndConvertCpp(combinedInfo);
      _.assignIn(info, combinedInfo);
      if (!vscode.workspace.workspaceFolders) { throw Error('No workspace folder was selected'); }
      getIgnores(vscode.workspace.workspaceFolders[0].uri).then((ignores: string[]) => {
        info.cSources = stripIgnoredFiles(info.cSources, ignores);
        info.cxxSources = stripIgnoredFiles(info.cxxSources, ignores);
        info.asmSources = stripIgnoredFiles(info.asmSources, ignores);
        resolve(info);
      });
    }).catch((err) => {
      vscode.window.showErrorMessage('Something went wrong with scanning directories and reading files', err);
      reject(err);
    });
  });
}
