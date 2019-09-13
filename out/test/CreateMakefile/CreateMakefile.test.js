"use strict";

var _assert = _interopRequireDefault(require("assert"));

var _mocha = require("mocha");

var _lodash = _interopRequireDefault(require("lodash"));

var _CreateMakefile = require("../../src/CreateMakefile");

var _ListFiles = require("../ListFiles/ListFiles.test");

var _MakefileInfo = require("../MakefileInfo/MakefileInfo.test");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var testList = {
  cFiles: ['1.c', '2.c', '3.c'],
  cxxFiles: ['4.cpp', '5.cpp', '6.cpp', '7.cpp'],
  asmFiles: ['8.s', '9.s', '10.s', '11.s'],
  cIncludes: ['12.h', '13.h', '14.h', '15.h', '16.h']
};
(0, _mocha.suite)('CreateMakefile test', function () {
  // before(() => {
  //   vscode.window.showInformationMessage('Start all tests.');
  // });
  (0, _mocha.before)(function () {});
  (0, _mocha.test)('createStringList', function () {
    _assert["default"].equal((0, _CreateMakefile.createStringList)(testList.cFiles), '1.c \\\n2.c \\\n3.c\n');
  }); // TODO: create a get makefile test.
});