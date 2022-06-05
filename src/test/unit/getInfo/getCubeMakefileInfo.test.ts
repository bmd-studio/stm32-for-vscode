import * as Sinon from 'sinon';
import * as assert from 'assert';

import * as vscode from 'vscode';
import { afterEach, suite, test, beforeEach } from 'mocha';
import {
  getOpenocdTargetSTM,
  removePrefixes,
  extractMakefileInfo,
} from '../../../getInfo/getCubeMakefileInfo';
import testMakefile, { testMakefileInfo } from '../../fixtures/testSTMCubeMakefile';
import { expect } from 'chai';
import { makeFSOverWritable } from '../../helpers/fsOverwriteFunctions';

suite('Get Cube makefile info', () => {
  beforeEach(() => {
    makeFSOverWritable(vscode);
  });
  afterEach(() => {
    Sinon.restore();
  });
  test('getTargetSTM', () => {
    assert.deepStrictEqual(getOpenocdTargetSTM(testMakefileInfo.linkerScript), 'STM32H743ZIT');
  });
  test('remove prefixes', () => {
    const prefixedList = [
      "-lentry1",
      "-lentry_two-l",
      "-l entry three",
    ];
    const unPrefixedList = [
      "entry1",
      "entry_two-l",
      " entry three",
    ];
    const result = removePrefixes(prefixedList, '-l');
    expect(result).to.deep.equal(unPrefixedList);
  });
  test('MultilineMakefileInfo', () => {

  });
  test('extractAllInfo', () => {
    const output = extractMakefileInfo(testMakefile);
    assert.deepStrictEqual(output.openocdTarget, testMakefileInfo.openocdTarget);
    assert.deepStrictEqual(output.projectName, testMakefileInfo.projectName);
    assert.deepStrictEqual(output.linkerScript, testMakefileInfo.linkerScript);
    assert.deepStrictEqual(output.floatAbi, testMakefileInfo.floatAbi);
    assert.deepStrictEqual(output.fpu, testMakefileInfo.fpu);
    assert.deepStrictEqual(output.cpu, testMakefileInfo.cpu);
    assert.deepStrictEqual(output.assemblySources, testMakefileInfo.assemblySources);
    // assert.deepStrictEqual(output.cxxSources, testMakefileInfo.cxxSources);
    assert.deepStrictEqual(output.cSources, testMakefileInfo.cSources);
    assert.deepStrictEqual(removePrefixes(output.cIncludeDirectories, '-I'), testMakefileInfo.cIncludeDirectories);
    assert.deepStrictEqual(removePrefixes(output.assemblyDefinitions, '-D'), testMakefileInfo.assemblyDefinitions);
    // assert.deepStrictEqual(removePrefixes(output.cxxDefinitions, '-D'), testMakefileInfo.cxxDefinitions);
    assert.deepStrictEqual(removePrefixes(output.cDefinitions, '-D'), testMakefileInfo.cDefinitions);
    assert.deepStrictEqual(removePrefixes(output.libraries, '-l'), testMakefileInfo.libraries);
    assert.deepStrictEqual(removePrefixes(output.libraryDirectories, '-L'), testMakefileInfo.libraryDirectories);
  });
  // FIXME: create a way to handle files more uniformly. e.g. auto import different types of projects if it can.
  // test('getMakefile while the makefile is present', async () => {
  //   const returnedMakefile = 'short makefile';
  //   const fakeReadFile = Sinon.fake.returns(
  //     Promise.resolve(new TextEncoder().encode(returnedMakefile))
  //   );
  //   Sinon.replace(vscode.workspace.fs, 'readFile', fakeReadFile);
  //   try {
  //     const makefile = await linkerFlags('./Makefile');
  //     expect(fakeReadFile.calledOnceWith(vscode.Uri.file('./Makefile'))).to.be.true;
  //     expect(makefile).to.equal(returnedMakefile);
  //   } catch (err) {
  //     assert(err);
  //   }

  // });
  // test('getMakefile when not present', async () => {
  //   const makefileUri = vscode.Uri.file('./Makefile');
  //   const fakeReadFile = Sinon.fake.returns(
  //     Promise.reject(vscode.FileSystemError.FileNotFound(makefileUri))
  //   );
  //   Sinon.replace(vscode.workspace.fs, 'readFile', fakeReadFile);
  //   expect(getMakefile('./Makefile')).to.be.rejectedWith(vscode.FileSystemError.FileNotFound(makefileUri));
  //   expect(fakeReadFile.calledOnceWith(vscode.Uri.file('./Makefile'))).to.be.true;
  // });
  // test('getMakefileInfo', async () => {
  //   const makefilePath = 'someRelevant/path';
  //   const fakeReadFile = Sinon.fake.returns(
  //     Promise.resolve(new TextEncoder().encode(testMakefile))
  //   );
  //   Sinon.replace(vscode.workspace.fs, 'readFile', fakeReadFile);
  //   const makefileInfo = await getMakefileInfo(makefilePath);
  //   expect(fakeReadFile.calledOnceWith(vscode.Uri.file('someRelevant/path/Makefile'))).to.be.true;
  //   const outputInfo = testMakefileInfo;
  //   outputInfo.tools = new ToolChain();
  //   expect(makefileInfo).to.deep.equal(testMakefileInfo);
  //   Sinon.restore();
  // });

});
