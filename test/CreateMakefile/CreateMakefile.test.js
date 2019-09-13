import assert from 'assert';
import { before, test, suite } from 'mocha';
import _ from 'lodash';
import {
  createStringList,
} from '../../src/CreateMakefile';
import { totalList } from '../ListFiles/ListFiles.test';
import { makefileInfoTest } from '../MakefileInfo/MakefileInfo.test';

const testList = {
  cFiles: ['1.c', '2.c', '3.c'],
  cxxFiles: ['4.cpp', '5.cpp', '6.cpp', '7.cpp'],
  asmFiles: ['8.s', '9.s', '10.s', '11.s'],
  cIncludes: ['12.h', '13.h', '14.h', '15.h', '16.h'],
};


suite('CreateMakefile test', () => {
  // before(() => {
  //   vscode.window.showInformationMessage('Start all tests.');
  // });
  before(() => {
  });
  test('createStringList', () => {
    assert.equal(createStringList(testList.cFiles), '1.c \\\n2.c \\\n3.c\n');
  });
  // TODO: create a get makefile test.
});
