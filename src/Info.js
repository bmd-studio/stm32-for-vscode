/*
 * Set of functions for creating a makefile based on STM32 makefile info and the Src, Inc and Lib folders
 * Created by Jort Band - Bureau Moeilijke Dingen
*/
import _ from 'lodash';
import vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import getMakefileInfo from './MakefileInfo';
import getFileList from './ListFiles';

const info = {
  makefile: {},
  config: {},
};
export default info;

/**
 *
 * @param {string[]} arr1
 * @param {string[]} arr2
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
 * @description Check if the programm is a c++ or c program and automatically converts.
 * @param {object} info combined info of the makefile and filelist
 */
export function checkAndConvertCpp(totalInfo) {
  const newInfo = _.cloneDeep(totalInfo);
  if (!(_.indexOf(newInfo.cxxSources, 'main.cpp') === -1) || !(_.indexOf(newInfo.cxxSources, 'Main.cpp') === -1)) {
    // then it has a main.cpp file
    // check for a main.c file
    let indMain = _.indexOf(newInfo.cSources, 'main.c');
    if (indMain === -1) { indMain = _.indexOf(newInfo.cSources, 'Main.c'); }
    if (indMain >= 0) {
      // remove the main. file.
      newInfo.cSources.splice(indMain, 1);
    }
  } else if (!_.isEmpty(info.cxxSources)) {
    vscode.window.showWarningMessage('You have several cxx/cpp files, however no main.cpp file. Will ignore these files for now');
    // should clear the current files
    newInfo.cxxSources = [];
  }
  return newInfo;
}

/**
 * @description Combines the information from the Makefile and the FileList
 * @param {object} makefileInfo
 * @param {object} fileList
 */
export function combineInfo(makefileInfo, fileList) {
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
    // TODO: also add a get config in here
    Promise.all([makefileInfoPromise, listFilesInfoPromise]).then((values) => {
      const [makefileInfo, fileInfo] = values;
      let newMakefile = combineInfo(makefileInfo, fileInfo);
      newMakefile = checkAndConvertCpp(newMakefile);
      info.makefile = newMakefile;
      resolve(info);
    }).catch((err) => {
      vscode.window.showErrorMessage('Something went wrong with scanning directories and reading files', err);
      reject(err);
    });
  });
}
