/*
 * Set of functions for creating a makefile based on
 * STM32 makefile info and the Src, Inc and Lib folders
 * Created by Jort Band - Bureau Moeilijke Dingen
*/
import _ from 'lodash';
import vscode from 'vscode';
import getMakefileInfo from './MakefileInfo';
import getFileList from './ListFiles';
import getRequirements from './Requirements';

const info = {
};
export default info;

export function prependInfo() {

}

/**
 *
 * @param {string[] | object} arr1
 * @param {string[] | object} arr2
 * @param {string} key
 * @param {object} obj
 */
export function combineArraysIntoObject(arr1, arr2, key, obj) {
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
export function checkForFileNameInArray(name, array, caseMatters) {
  const reg = new RegExp(`(^|\\b)${name}$`, `${caseMatters ? '' : 'i'}`);
  for (let i = 0; i < array.length; i += 1) {
    if (array[i].search(reg) >= 0) {
      return i;
    }
  }
  return -1;
}

/**
 * @description Check if the programm is a c++ or c program and automatically converts.
 * @param {object} totalInfo combined info of the makefile and filelist
 */
export function checkAndConvertCpp(totalInfo) {
  const newInfo = _.cloneDeep(totalInfo);
  if (checkForFileNameInArray('main.cpp', newInfo.cxxSources) >= 0) {
    const indMain = checkForFileNameInArray('main.c', newInfo.cSources);
    if (indMain >= 0) {
      // remove the main.c file.
      newInfo.cSources.splice(indMain, 1);
    }
    return newInfo;
  }
  if (!_.isEmpty(info.cxxSoruces)) {
    vscode.window.showWarningMessage('You have several cxx/cpp files, however no main.cpp file. Will ignore these files for now');
  }
  // else it is a C only file, so remove all the C++ files and definitions.
  newInfo.cxxSources = [];
  newInfo.cxxDefs = [];
  newInfo.cxxIncludes = [];
  return newInfo;
}

/**
 * @description Combines the information from the Makefile and the FileList
 * @param {object} makefileInfo
 * @param {object} fileList
 */
export function combineInfo(makefileInfo, fileList, requirementInfo) {
  const bundledInfo = {};

  // Bundling info which both the makeFile and the Filelist have
  combineArraysIntoObject(makefileInfo.cSources, fileList.cFiles, 'cSources', bundledInfo);
  combineArraysIntoObject(makefileInfo.cxxSources, fileList.cxxFiles, 'cxxSources', bundledInfo);
  combineArraysIntoObject(makefileInfo.asmSources, fileList.asmFiles, 'asmSources', bundledInfo);
  combineArraysIntoObject(makefileInfo.cIncludes, fileList.cIncludes, 'cIncludes', bundledInfo);
  combineArraysIntoObject(makefileInfo.cxxIncludes, null, 'cxxIncludes', bundledInfo);
  combineArraysIntoObject(makefileInfo.asIncludes, null, 'asIncludes', bundledInfo);

  // now assign makelist values
  _.set(bundledInfo, 'target', makefileInfo.target);
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

  return bundledInfo;
}

/**
 * @description function for getting all the info combined. After this
 * the info is accesible at the default exported info.
 * Combines the makefile info and files in workspace info, also checks
 * if a project is a C or C++ project and converts accordingly.
 * @param {string} location location of the workspace
 */
export async function getInfo(location) {
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
      resolve(info);
    }).catch((err) => {
      vscode.window.showErrorMessage('Something went wrong with scanning directories and reading files', err);
      reject(err);
    });
  });
}
