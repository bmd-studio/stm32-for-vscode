"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.combineArraysIntoObject = combineArraysIntoObject;
exports["default"] = combineInfo;
exports.checkAndConvertCpp = checkAndConvertCpp;

var _lodash = _interopRequireDefault(require("lodash"));

var _vscode = _interopRequireDefault(require("vscode"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _MakefileInfo = _interopRequireDefault(require("./MakefileInfo"));

var _ListFiles = _interopRequireDefault(require("./ListFiles"));

var _Definitions = require("./Definitions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*
 * Set of functions for creating a makefile based on STM32 makefile info and the Src, Inc and Lib folders
 * Created by Jort Band - Bureau Moeilijke Dingen
*/

/**
 *
 * @param {string[]} arr1
 * @param {string[]} arr2
 * @param {string} key
 * @param {object} obj
 */
function combineArraysIntoObject(arr1, arr2, key, obj) {
  // GUARD: against empty or null arrays.
  if (!arr2 || !_lodash["default"].isArray(arr2)) {
    if (arr1 && _lodash["default"].isArray(arr1)) {
      _lodash["default"].set(obj, key, arr1.sort());

      return obj;
    }

    _lodash["default"].set(obj, key, []);

    return obj;
  }

  if (!arr1 || !_lodash["default"].isArray(arr1)) {
    _lodash["default"].set(obj, key, arr2);

    return obj;
  }

  var totalArray = arr1.concat(arr2);
  totalArray = _lodash["default"].uniq(totalArray).sort();

  _lodash["default"].set(obj, key, totalArray);

  return obj;
}
/**
 * @description Combines the information from the Makefile and the FileList
 * @param {object} makefileInfo
 * @param {object} fileList
 */


function combineInfo(makefileInfo, fileList) {
  var bundledInfo = {}; // Bundling info which both the makeFile and the Filelist have

  combineArraysIntoObject(makefileInfo.cSources, fileList.cFiles, 'cSources', bundledInfo);
  combineArraysIntoObject(makefileInfo.cxxSources, fileList.cxxFiles, 'cxxSources', bundledInfo);
  combineArraysIntoObject(makefileInfo.asmSources, fileList.asmFiles, 'asmSources', bundledInfo);
  combineArraysIntoObject(makefileInfo.cIncludes, fileList.cIncludes, 'cIncludes', bundledInfo);
  combineArraysIntoObject(makefileInfo.cxxIncludes, null, 'cxxIncludes', bundledInfo);
  combineArraysIntoObject(makefileInfo.asIncludes, null, 'asIncludes', bundledInfo); // now assign makelist values

  _lodash["default"].set(bundledInfo, 'target', makefileInfo.target);

  _lodash["default"].set(bundledInfo, 'cpu', makefileInfo.cpu);

  _lodash["default"].set(bundledInfo, 'fpu', makefileInfo.fpu);

  _lodash["default"].set(bundledInfo, 'floatAbi', makefileInfo.floatAbi);

  _lodash["default"].set(bundledInfo, 'mcu', makefileInfo.mcu);

  _lodash["default"].set(bundledInfo, 'ldscript', makefileInfo.ldscript);

  _lodash["default"].set(bundledInfo, 'cDefs', makefileInfo.cDefs);

  _lodash["default"].set(bundledInfo, 'cxxDefs', makefileInfo.cxxDefs);

  _lodash["default"].set(bundledInfo, 'asDefs', makefileInfo.asDefs);

  return bundledInfo;
}
/**
 * @description Check if the programm is a c++ or c program and automatically converts.
 * @param {object} info combined info of the makefile and filelist
 */


function checkAndConvertCpp(info) {
  var newInfo = _lodash["default"].cloneDeep(info);

  if (!(_lodash["default"].indexOf(info.cxxSources, 'main.cpp') === -1) || !(_lodash["default"].indexOf(info.cxxSources, 'Main.cpp') === -1)) {
    // then it has a main.cpp file
    // check for a main.c file
    var indMain = _lodash["default"].indexOf(info.cSources, 'main.c');

    if (indMain === -1) {
      indMain = _lodash["default"].indexOf(info.cSources, 'Main.c');
    }

    if (indMain >= 0) {
      // remove the main. file.
      newInfo.cSources.splice(indMain, 1);
    }
  } else if (!_lodash["default"].isEmpty(info.cxxSources)) {
    _vscode["default"].window.showWarningMessage('You have several cxx/cpp files, however no main.cpp file. Will ignore these files for now'); // should clear the current files


    newInfo.cxxSources = [];
  }

  return newInfo;
}