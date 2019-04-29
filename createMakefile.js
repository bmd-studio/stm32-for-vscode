
/* eslint-disable max-lines-per-function */
/* eslint-disable max-statements */
/* eslint-disable one-var */
const _ = require('lodash');
const fs = require('fs');
const makefileTemplate = require('./makefileTemplate');
const vscode = require('vscode');
const {extractFileTypes} = require('./info');

function createMakefile(fileList, makefileInfo) {
  console.log('file list', fileList);
  const dif = mergeInfo(fileList, makefileInfo);

}

function mergeInfo(fileList, makefileInfo) {
  // console.log('files list', fileList, 'make info', makefileInfo);
  // should do pre processing
  let filteredList = convertToRelativePath(fileList);
  // console.log('start list', fileList, 'with relative path', filteredList);
  filteredList = removeDriverFiles(filteredList);

  filteredList = preProcessMainFiles(filteredList);
  const filteredMakeInfo = extractMakeFileSpecificFiles(makefileInfo);

  filteredList.cIncludes = reduceToIncludeFilePaths(filteredList.cIncludes);
  filteredList.cppIncludes = reduceToIncludeFilePaths(filteredList.cppIncludes);
  filteredList.asmIncludes = reduceToIncludeFilePaths(filteredList.asmIncludes);

  filteredMakeInfo.cSources = filteredList.cSources.concat(filteredMakeInfo.cSources);
  filteredMakeInfo.cppSources = filteredList.cppSources.concat(filteredMakeInfo.cppSources);
  filteredMakeInfo.asmSources = filteredList.asmSources.concat(filteredMakeInfo.asmSources);
  filteredMakeInfo.cIncludes = convertToStandardIncludeString(filteredList.cIncludes).concat(filteredMakeInfo.cIncludes);
  filteredMakeInfo.cppIncludes = convertToStandardIncludeString(filteredList.cppIncludes).concat(filteredMakeInfo.cppIncludes);
  filteredMakeInfo.asmIncludes = convertToStandardIncludeString(filteredList.asmIncludes).concat(filteredMakeInfo.asmIncludes);
  // filteredMakeInfo.cSources = filteredList.cSources.concat(filteredMakeInfo.cSources);
  
  // console.log('filtered list', filteredList, 'filtered make file info', filteredMakeInfo, 'includes', reduceToIncludeFilePaths(filteredList.cIncludes));
  return filteredMakeInfo;
}

function convertToRelativePath(fileList) {
  const clonedList = _.cloneDeep(fileList);
  const currentLocation = vscode.workspace.rootPath + '/';
  _.forEach(clonedList, (list, entryName) => {
    if(!_.isArray(list)) {
      // assume single entry
      clonedList[entryName] = list.replace(currentLocation, '');
      return;
    }
    const newArr = [];
    _.map(list, (entry) => {
      newArr.push(entry.replace(currentLocation, ''));
    });
    // console.log('new array', newArr, 'list', list);
    // _.set(clonedList, entryName, newArr);
    clonedList[entryName] = newArr;
  });
  return clonedList;
}

function reduceToIncludeFilePaths(includes) {
  const endPattern = /\/\w*.h$/gim;
  const mapArr = [];
  _.map(includes, (file) => {
    const newStr = file.replace(endPattern, '');
    mapArr.push(newStr);
  });
  const unique = _.uniq(mapArr);
  return unique;
}

function extractMakeFileSpecificFiles(makefileInfo) {
  // should extract the driver files, HAL files and includes
  const filteredList = _.cloneDeep(makefileInfo);
  // console.log('pre source', ma kefileInfo);
  filteredList.cSources = extractDriverFilesFromArray(filteredList.cSources);
  filteredList.cppSources = extractDriverFilesFromArray(filteredList.cppSources);
  filteredList.asmSources = extractDriverFilesFromArray(filteredList.asmSources);
  filteredList.cIncludes = extractDriverFilesFromArray(filteredList.cIncludes);
  filteredList.cppIncludes = extractDriverFilesFromArray(filteredList.cppIncludes);
  filteredList.asmIncludes = extractDriverFilesFromArray(filteredList.asmIncludes);
  // console.log('post', filteredList);
  return filteredList;
}


function convertToStandardIncludeString(list) {
  const newStrings = [];
  _.map(list, (item) => {
    newStrings.push('-I' + item);
  });
  return newStrings;
}

function extractDriverFilesFromArray(list) {
  const driverPattern = /drivers\/(STM32||CMSIS).*/im;
  const testDrivePattern = RegExp('drivers/\(STM32|CMSIS)', 'im');
  const newArray = [];
  if(!_.isArray(list)) return list;
  _.map(list, (entry) => {
    if(driverPattern.test(entry)) {
      newArray.push(entry);
    }
  });
  
  return newArray;
}

function removeDriverFiles(fileList) {
  const filteredList = {};

  _.forEach(fileList, (entry, entryName) => {
    const filtered = _.differenceWith(entry, ['Drivers/'], (a, b) => {
      return a.indexOf(b) >= 0;
    });

    _.set(filteredList, entryName, filtered);
  });
  return filteredList;
}

function preProcessMainFiles(fileList) {
  // should check if there is a main.cpp and a main.c
  let hasMainC = false;
  let mainCLocation = 0;
  let hasMainCpp = false;
  let mainCppLocation = 0;
  const outputArray = _.cloneDeep(fileList);

  _.map(fileList.cSources, (file, ind) => {
    if(file.indexOf('main.c') >= 0) {
      hasMainC = true;
      mainCLocation = parseInt(ind);
    }
  });
  _.map(fileList.cppSources, (file, ind) => {
    if(file.indexOf('main.cpp') >= 0) {
      hasMainCpp = true;
      mainCppLocation = parseInt(ind);
    }
  });
  console.log('has main c', hasMainC, 'has main cpp', hasMainCpp);
  if (hasMainC && hasMainCpp) {
    // for now only remove the main.c from the file list
    // TODO: Mirror the non user code for both, so regenerated files will behave the same for main.cpp and main.c
    // outputArray.cSources = _.pull(outputArray.cSources, [mainCLocation]);
    outputArray.cSources = _.remove(outputArray.cSources, (n) => {
      return n.indexOf('main.c') < 0;
    });
  }
  return outputArray;
}

module.exports = {
  createMakefile,
};