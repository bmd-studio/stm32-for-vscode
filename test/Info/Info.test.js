import assert from 'assert';
import { before, test, suite } from 'mocha';
import _ from 'lodash';
import {
  combineInfo, checkAndConvertCpp, combineArraysIntoObject,
  checkForFileNameInArray,
} from '../../src/Info';
import { makefileInfoTest } from '../MakefileInfo/MakefileInfo.test';

const testList = {
  cFiles: ['1.c', '2.c', '3.c'],
  cxxFiles: ['4.cpp', '5.cpp', '6.cpp', '7.cpp'],
  asmFiles: ['8.s', '9.s', '10.s', '11.s'],
  cIncludes: ['12.h', '13.h', '14.h', '15.h', '16.h'],
};
const testMakeFile = {
  cSources: ['1.c', '2.c', '17.c', '18.c'],
  cxxSources: ['4.cpp'],
  asmSources: ['8.s'],
  cIncludes: ['12.h', '13.h', '19.h'],
  cxxIncludes: [],
  asIncludes: [],
  target: makefileInfoTest.target,
  cpu: makefileInfoTest.cpu,
  fpu: makefileInfoTest.fpu,
  floatAbi: makefileInfoTest.floatAbi,
  mcu: makefileInfoTest.mcu,
  ldscript: makefileInfoTest.ldscript,
  cDefs: makefileInfoTest.cDefs,
  cxxDefs: makefileInfoTest.cxxDefs,
  asDefs: makefileInfoTest.asDefs,
};
const totalMakeFileInfo = {
  cSources: _.uniq(testMakeFile.cSources.concat(testList.cFiles)).sort(),
  cxxSources: _.uniq(testMakeFile.cxxSources.concat(testList.cxxFiles)).sort(),
  asmSources: _.uniq(testMakeFile.asmSources.concat(testList.asmFiles)).sort(),
  cIncludes: _.uniq(testMakeFile.cIncludes.concat(testList.cIncludes)).sort(),
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
  asDefs: testMakeFile.asDefs,
};


suite('Info test', () => {
  // before(() => {
  //   vscode.window.showInformationMessage('Start all tests.');
  // });
  before(() => {
  });
  test('checkForFileNameInArray', () => {
    const mainArr = ['src/main.cpp', 'src/something.h', 'src/somethingelse.cpp'];
    assert.equal(checkForFileNameInArray('main.cpp', mainArr), 0);
    const noMain = ['src/blah.cpp', 'adfad/jklfgjhf.cpp', 'fkjhfsdkjhsdf.fdhf/fguhsfg.gfs'];
    assert.equal(checkForFileNameInArray('main.cpp', noMain), -1);
  });
  test('checkForFileNameInArray case sensitivity', () => {
    const capsMain = ['src/something.h', 'src/Main.cpp', 'src/somethingelse.cpp'];
    assert.equal(checkForFileNameInArray('main.cpp', capsMain, true), -1);
    assert.equal(checkForFileNameInArray('Main.cpp', capsMain, true), 1);
    assert.equal(checkForFileNameInArray('main.cpp', capsMain), 1);
    assert.equal(checkForFileNameInArray('Main.cpp', capsMain, false), 1);
  });

  test('checkForFileNameInArray .c is not .cpp', () => {
    const capsMain = ['src/something.h', 'src/Main.cpp', 'src/somethingelse.cpp'];
    // check if it only gets the whole filename.
    assert.equal(checkForFileNameInArray('main.c', capsMain), -1);
    assert.equal(checkForFileNameInArray('Main.c', capsMain), -1);
  });
  test('checkForFileNameInArray match whole filename, not only a part', () => {
    const otherMain = ['othermain.cpp', 'someotherfile.cpp'];
    assert.equal(checkForFileNameInArray('main.cpp', otherMain), -1);
    const otherMainPrefix = ['/srcs/sd/othermain.cpp', 'prefix/something.h'];
    assert.equal(checkForFileNameInArray('main.cpp', otherMainPrefix), -1);
  });

  test('combineArraysIntoObject', () => {
    const array1 = ['somestring', 'someotherstring'];
    const array2 = ['otherstring', 'other other string'];
    // test if it combines as expected
    assert.deepEqual(combineArraysIntoObject(
      array1,
      array2,
      'theKey',
      {},
    ), { theKey: array2.concat(array1).sort() });
    // test if it handles duplication in the arrays correctly
    assert.deepEqual(combineArraysIntoObject(array1, array1, 'entry', {}), { entry: array1.sort() });
    // test if it handles none array input correctly
    assert.deepEqual(combineArraysIntoObject(array1, null, 'entry', {}), { entry: array1.sort() });
    assert.deepEqual(combineArraysIntoObject(null, array1, 'entry', {}), { entry: array1.sort() });
    assert.deepEqual(combineArraysIntoObject(null, null, 'entry', {}), { entry: [] });
    assert.deepEqual(combineArraysIntoObject(array1, {}, 'entry', {}), { entry: array1.sort() });
    assert.deepEqual(combineArraysIntoObject({}, null, 'entry', {}), { entry: [] });
    assert.deepEqual(combineArraysIntoObject({}, array2, 'entry', {}), { entry: array2.sort() });
  });
  test('combineInfo', () => {
    assert.deepEqual(combineInfo(testMakeFile, testList), totalMakeFileInfo);
  });
  test('checkAndConvertCpp', () => {
    // check if it does nothing when only a main.c file is present
    const justC = _.cloneDeep(totalMakeFileInfo);
    justC.cxxSources = [];
    justC.cSources.push('main.c');
    assert.deepEqual(checkAndConvertCpp(justC), justC);

    // check if it removes the cpp entries if there is only a main.c
    const extraCPP = _.cloneDeep(totalMakeFileInfo);
    extraCPP.cSources.push('main.c');
    assert.deepEqual(checkAndConvertCpp(extraCPP), justC);

    // check if it converts to cpp when both main.c and main.cpp are there
    const cpp = _.cloneDeep(totalMakeFileInfo);
    cpp.cxxSources.push('main.cpp');

    const cppWithMainC = _.cloneDeep(totalMakeFileInfo);
    cppWithMainC.cxxSources.push('main.cpp');
    cppWithMainC.cSources.push('main.c');
    assert.deepEqual(checkAndConvertCpp(cppWithMainC), cpp);
  });
  // TODO: create a get makefile test.
});
