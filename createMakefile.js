
/* eslint-disable max-lines-per-function */
/* eslint-disable max-statements */
/* eslint-disable one-var */
const _ = require('lodash');
const fs = require('fs');
const makefileTemplate = require('./makefileTemplate');
const { extractFileTypes } = require('./info');

/* Function for creating and updating the make file.
 * Will check if makefiles are different and if so update.
 * Does account for main.c and main.cpp files. If a main.cpp file is present
 * it will use this as the entry point of the application and it will exclude the main.c file
 *
*/
function createMakefile(fileList, makefileInfo, workspacePath) {
  // console.log('file list', fileList);
  const totalInfo = mergeInfo(fileList, makefileInfo, workspacePath);
  const newMakeFile = makefileTemplate(totalInfo);
  // console.log("new make file", newMakeFile);
  _.set(totalInfo, 'newMakeFile', newMakeFile);
  // also update the make file
  if (makefileInfo.makefile !== newMakeFile) {
    // console.log('make files are different. Will update');
    return new Promise((resolve, reject) => {
      fs.writeFile(makefileInfo.path, newMakeFile, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(totalInfo);
      });
    });
  }
  return new Promise((resolve, reject) => {
    resolve(totalInfo);
  });
}

function mergeInfo(fileList, makefileInfo, workspacePath) {
  // console.log('files list', fileList, 'make info', makefileInfo);
  // should do pre processing
  let filteredList = convertToRelativePath(fileList, workspacePath);
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
  // console.log("processed make info", filteredMakeInfo);
  // console.log('filtered list', filteredList, 'filtered make file info', filteredMakeInfo, 'includes', reduceToIncludeFilePaths(filteredList.cIncludes));
  return filteredMakeInfo;
}

function convertToRelativePath(fileList, workspacePath) {
  const clonedList = _.cloneDeep(fileList);
  const currentLocation = `${workspacePath}/`;
  _.forEach(clonedList, (list, entryName) => {
    if (!_.isArray(list)) {
      // assume single entry
      clonedList[entryName] = list.replace(currentLocation, '');
      return;
    }
    const newArr = [];
    _.map(list, (entry) => {
      newArr.push(entry.replace(currentLocation, ''));
    });
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
  return filteredList;
}


function convertToStandardIncludeString(list) {
  const newStrings = [];
  _.map(list, (item) => {
    newStrings.push(`-I${item}`);
  });
  return newStrings;
}

function extractDriverFilesFromArray(list) {
  const driverPattern = /drivers\/(STM32||CMSIS).*/im;
  const testDrivePattern = RegExp('drivers/\(STM32|CMSIS)', 'im');
  const newArray = [];
  if (!_.isArray(list)) return list;
  _.map(list, (entry) => {
    if (driverPattern.test(entry)) {
      newArray.push(entry);
    }
  });

  return newArray;
}

function removeDriverFiles(fileList) {
  const filteredList = {};

  _.forEach(fileList, (entry, entryName) => {
    const filtered = _.differenceWith(entry, ['Drivers/'], (a, b) => a.indexOf(b) >= 0);

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
    if (file.indexOf('main.c') >= 0) {
      hasMainC = true;
      mainCLocation = parseInt(ind);
    }
  });
  _.map(fileList.cppSources, (file, ind) => {
    if (file.indexOf('main.cpp') >= 0) {
      hasMainCpp = true;
      mainCppLocation = parseInt(ind);
    }
  });
  // console.log('has main c', hasMainC, 'has main cpp', hasMainCpp);
  if (hasMainC && hasMainCpp) {
    // for now only remove the main.c from the file list
    // TODO: Mirror the non user code for both, so regenerated files will behave the same for main.cpp and main.c
    // outputArray.cSources = _.pull(outputArray.cSources, [mainCLocation]);
    outputArray.cSources = _.remove(outputArray.cSources, n => n.indexOf('main.c') < 0);
  }
  return outputArray;
}

module.exports = {
  createMakefile,
};
