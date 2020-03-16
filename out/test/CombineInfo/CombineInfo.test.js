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
"use strict";

var _assert = _interopRequireDefault(require("assert"));

var _mocha = require("mocha");

var _lodash = _interopRequireDefault(require("lodash"));

var _Info = require("../../src/Info");

var _MakefileInfo = require("../MakefileInfo/MakefileInfo.test");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var testList = {
  cFiles: ['1.c', '2.c', '3.c'],
  cxxFiles: ['4.cpp', '5.cpp', '6.cpp', '7.cpp'],
  asmFiles: ['8.s', '9.s', '10.s', '11.s'],
  cIncludes: ['12.h', '13.h', '14.h', '15.h', '16.h']
};
var testMakeFile = {
  cSources: ['1.c', '2.c', '17.c', '18.c'],
  cxxSources: ['4.cpp'],
  asmSources: ['8.s'],
  cIncludes: ['12.h', '13.h', '19.h'],
  cxxIncludes: [],
  asIncludes: [],
  target: _MakefileInfo.makefileInfoTest.target,
  cpu: _MakefileInfo.makefileInfoTest.cpu,
  fpu: _MakefileInfo.makefileInfoTest.fpu,
  floatAbi: _MakefileInfo.makefileInfoTest.floatAbi,
  mcu: _MakefileInfo.makefileInfoTest.mcu,
  ldscript: _MakefileInfo.makefileInfoTest.ldscript,
  cDefs: _MakefileInfo.makefileInfoTest.cDefs,
  cxxDefs: _MakefileInfo.makefileInfoTest.cxxDefs,
  asDefs: _MakefileInfo.makefileInfoTest.asDefs
};
var totalMakeFileInfo = {
  cSources: _lodash["default"].uniq(testMakeFile.cSources.concat(testList.cFiles)).sort(),
  cxxSources: _lodash["default"].uniq(testMakeFile.cxxSources.concat(testList.cxxFiles)).sort(),
  asmSources: _lodash["default"].uniq(testMakeFile.asmSources.concat(testList.asmFiles)).sort(),
  cIncludes: _lodash["default"].uniq(testMakeFile.cIncludes.concat(testList.cIncludes)).sort(),
  cxxIncludes: [],
  asIncludes: [],
  target: testMakeFile.target,
  cpu: testMakeFile.cpu,
  fpu: testMakeFile.fpu,
  floatAbi: testMakeFile.floatAbi,
  mcu: testMakeFile.mcu,
  ldscript: testMakeFile.ldscript,
  cDefs: testMakeFile.cDefs,
  cxxDefs: testMakeFile.cxxDefs,
  asDefs: testMakeFile.asDefs
};
(0, _mocha.suite)('CombineInfo test', function () {
  // before(() => {
  //   vscode.window.showInformationMessage('Start all tests.');
  // });
  (0, _mocha.before)(function () {});
  (0, _mocha.test)('combineArraysIntoObject', function () {
    var array1 = ['somestring', 'someotherstring'];
    var array2 = ['otherstring', 'other other string']; // test if it combines as expected

    _assert["default"].deepEqual((0, _Info.combineArraysIntoObject)(array1, array2, 'theKey', {}), {
      theKey: array2.concat(array1).sort()
    }); // test if it handles duplication in the arrays correctly


    _assert["default"].deepEqual((0, _Info.combineArraysIntoObject)(array1, array1, 'entry', {}), {
      entry: array1.sort()
    }); // test if it handles none array input correctly


    _assert["default"].deepEqual((0, _Info.combineArraysIntoObject)(array1, null, 'entry', {}), {
      entry: array1.sort()
    });

    _assert["default"].deepEqual((0, _Info.combineArraysIntoObject)(null, array1, 'entry', {}), {
      entry: array1.sort()
    });

    _assert["default"].deepEqual((0, _Info.combineArraysIntoObject)(null, null, 'entry', {}), {
      entry: []
    });

    _assert["default"].deepEqual((0, _Info.combineArraysIntoObject)(array1, {}, 'entry', {}), {
      entry: array1.sort()
    });

    _assert["default"].deepEqual((0, _Info.combineArraysIntoObject)({}, null, 'entry', {}), {
      entry: []
    });

    _assert["default"].deepEqual((0, _Info.combineArraysIntoObject)({}, array2, 'entry', {}), {
      entry: array2.sort()
    });
  });
  (0, _mocha.test)('combineInfo', function () {
    _assert["default"].deepEqual((0, _Info.combineInfo)(testMakeFile, testList), totalMakeFileInfo);
  });
  (0, _mocha.test)('checkAndConvertCpp', function () {
    // check if it does nothing when only a main.c file is present
    var justC = _lodash["default"].cloneDeep(totalMakeFileInfo);

    justC.cxxSources = [];
    justC.cSources.push('main.c');

    _assert["default"].deepEqual((0, _Info.checkAndConvertCpp)(justC), justC); // check if it removes the cpp entries if there is only a main.c


    var extraCPP = _lodash["default"].cloneDeep(totalMakeFileInfo);

    extraCPP.cSources.push('main.c');

    _assert["default"].deepEqual((0, _Info.checkAndConvertCpp)(extraCPP), justC); // check if it converts to cpp when both main.c and main.cpp are there


    var cpp = _lodash["default"].cloneDeep(totalMakeFileInfo);

    cpp.cxxSources.push('main.cpp');

    var cppWithMainC = _lodash["default"].cloneDeep(totalMakeFileInfo);

    cppWithMainC.cxxSources.push('main.cpp');
    cppWithMainC.cSources.push('main.c');

    _assert["default"].deepEqual((0, _Info.checkAndConvertCpp)(cppWithMainC), cpp);
  }); // TODO: create a get makefile test.
});