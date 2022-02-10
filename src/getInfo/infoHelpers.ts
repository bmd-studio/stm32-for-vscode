import * as _ from 'lodash';
import * as vscode from 'vscode';

import MakeInfo from '../types/MakeInfo';

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
 * @param {object} makeInfo combined info of the makefile and file list
 */
export function checkAndConvertCpp(makeInfo: MakeInfo): MakeInfo {
  const newInfo = _.cloneDeep(makeInfo);
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
      'You have several cxx/cpp/cc files, however no main.cpp file. Will ignore these files for now'
    );
  }
  // else it is a C only file, so remove all the C++ files and definitions.
  newInfo.cxxSources = [];
  newInfo.cxxDefinitions = [];
  return newInfo;
}