import * as Sinon from 'sinon';
import * as assert from 'assert';

import * as vscode from 'vscode';
import {
  afterEach, suite, test, beforeEach,
} from 'mocha';
import { TextEncoder } from 'util';
import { expect } from 'chai';
import getMakefileInfo, {
  extractLibs,
  extractMakefileInfo,
  extractMultiLineInfo,
  extractSingleLineInfo,
  getMakefile,
  getTargetSTM,
  removePrefixes,
} from '../../../getInfo/getCubeMakefileInfo';
import testMakefile, { testMakefileInfo } from '../../fixtures/testSTMCubeMakefile';

import { ToolChain } from '../../../types/MakeInfo';
import { makeFSOverWritable } from '../../helpers/fsOverwriteFunctions';

suite('Get Cube makefile info', () => {
  beforeEach(() => {
    makeFSOverWritable(vscode);
  });
  afterEach(() => {
    Sinon.restore();
  });
  test('extractSingleLineInfo', () => {
    // assert.
    expect(extractSingleLineInfo('target', testMakefile)).to.equal(testMakefileInfo.target);
    expect(extractSingleLineInfo('C_SOURCES', testMakefile)).to.equal(' \\');
    expect(extractSingleLineInfo('PREFIX', testMakefile)).to.equal('arm-none-eabi-');
    expect(extractSingleLineInfo('CPU', testMakefile)).to.equal('-mcpu=cortex-m7');
    expect(extractSingleLineInfo('LIBS', testMakefile)).to.equal('-lc -lm -lnosys');
  });
  test('extractMultiLineInfo', () => {
    assert.deepEqual(
      extractMultiLineInfo('C_DEFS', testMakefile),
      ['-DUSE_HAL_DRIVER', '-DSTM32H743xx', '-DUSE_HAL_DRIVER', '-DSTM32H743xx'],
    );
    assert.deepEqual(extractMultiLineInfo('c_sources', testMakefile), testMakefileInfo.cSources);
    assert.deepEqual(extractMultiLineInfo('target', testMakefile), []);
  });
  test('getTargetSTM', () => {
    assert.equal(getTargetSTM(testMakefileInfo.cSources), 'stm32h7x');
  });
  test('getLibs', () => {
    const libLTestString = 'LIBS = -llib -lotherlib -lsomeotherotherLib -lstdc++\n';
    const result = extractLibs(libLTestString);
    const expectedResult = [
      '-llib',
      '-lotherlib',
      '-lsomeotherotherLib',
      '-lstdc++',
    ];
    expect(result).to.deep.equal(expectedResult);
  });
  test('remove prefixes', () => {
    const prefixedList = [
      '-lentry1',
      '-lentry_two-l',
      '-l entry three',
    ];
    const unPrefixedList = [
      'entry1',
      'entry_two-l',
      ' entry three',
    ];
    const result = removePrefixes(prefixedList, '-l');
    expect(result).to.deep.equal(unPrefixedList);
  });
  test('extractAllInfo', () => {
    const output = extractMakefileInfo(testMakefile);
    assert.deepEqual(output.targetMCU, testMakefileInfo.targetMCU);
    assert.deepEqual(output.target, testMakefileInfo.target);
    assert.deepEqual(output.ldscript, testMakefileInfo.ldscript);
    assert.deepEqual(output.mcu, testMakefileInfo.mcu);
    assert.deepEqual(output.floatAbi, testMakefileInfo.floatAbi);
    assert.deepEqual(output.fpu, testMakefileInfo.fpu);
    assert.deepEqual(output.cpu, testMakefileInfo.cpu);
    assert.deepEqual(output.asmSources, testMakefileInfo.asmSources);
    assert.deepEqual(output.cxxSources, testMakefileInfo.cxxSources);
    assert.deepEqual(output.cSources, testMakefileInfo.cSources);
    assert.deepEqual(removePrefixes(output.cIncludes, '-I'), testMakefileInfo.cIncludes);
    assert.deepEqual(removePrefixes(output.asDefs, '-D'), testMakefileInfo.asDefs);
    assert.deepEqual(removePrefixes(output.cxxDefs, '-D'), testMakefileInfo.cxxDefs);
    assert.deepEqual(removePrefixes(output.cDefs, '-D'), testMakefileInfo.cDefs);
    assert.deepEqual(removePrefixes(output.libs, '-l'), testMakefileInfo.libs);
    assert.deepEqual(output.libdir, testMakefileInfo.libdir);
  });
  test('getMakefile while the makefile is present', async () => {
    const returnedMakefile = 'short makefile';
    const fakeReadFile = Sinon.fake.returns(
      Promise.resolve(new TextEncoder().encode(returnedMakefile)),
    );
    Sinon.replace(vscode.workspace.fs, 'readFile', fakeReadFile);
    try {
      const makefile = await getMakefile('./Makefile');
      expect(fakeReadFile.calledOnceWith(vscode.Uri.file('./Makefile'))).to.be.true;
      expect(makefile).to.equal(returnedMakefile);
    } catch (err) {
      assert(err);
    }
  });
  test('getMakefile when not present', async () => {
    const makefileUri = vscode.Uri.file('./Makefile');
    const fakeReadFile = Sinon.fake.returns(
      Promise.reject(vscode.FileSystemError.FileNotFound(makefileUri)),
    );
    Sinon.replace(vscode.workspace.fs, 'readFile', fakeReadFile);
    expect(getMakefile('./Makefile')).to.be.rejectedWith(vscode.FileSystemError.FileNotFound(makefileUri));
    expect(fakeReadFile.calledOnceWith(vscode.Uri.file('./Makefile'))).to.be.true;
  });
  test('getMakefileInfo', async () => {
    const makefilePath = 'someRelevant/path';
    const fakeReadFile = Sinon.fake.returns(
      Promise.resolve(new TextEncoder().encode(testMakefile)),
    );
    Sinon.replace(vscode.workspace.fs, 'readFile', fakeReadFile);
    const makefileInfo = await getMakefileInfo(makefilePath);
    expect(fakeReadFile.calledOnceWith(vscode.Uri.file('someRelevant/path/Makefile'))).to.be.true;
    const outputInfo = testMakefileInfo;
    outputInfo.tools = new ToolChain();
    expect(makefileInfo).to.deep.equal(testMakefileInfo);
    Sinon.restore();
  });
});
