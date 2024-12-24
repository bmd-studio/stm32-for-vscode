import * as vscode from 'vscode';

import MakeInfo from '../types/MakeInfo';

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
  const newInfo = {...makeInfo};
  if (checkForFileNameInArray('main.cpp', newInfo.cxxSources) >= 0) {
    const indMain = checkForFileNameInArray('main.c', newInfo.cSources);
    if (indMain >= 0) {
      // remove the main.c file.
      newInfo.cSources.splice(indMain, 1);
    }
    return newInfo;
  }
  if (newInfo.cxxSources && newInfo.cxxSources.length > 0) {
    vscode.window.showWarningMessage(
      'You have several cxx/cpp/cc files, however no main.cpp file. Will ignore these files for now'
    );
  }
  // else it is a C only file, so remove all the C++ files and definitions.
  newInfo.cxxSources = [];
  newInfo.cxxDefs = [];
  return newInfo;
}