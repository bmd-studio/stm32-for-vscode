import * as Sinon from 'sinon';
import chaiAsPromised from 'chai-as-promised';
import * as makefileFunctions from '../../CreateMakefile';
import * as path from 'path';
import * as vscode from 'vscode';
import { Uri } from 'vscode';
import { afterEach, suite, test, beforeEach } from 'mocha';
import { expect, use } from 'chai';
import { stm32ForVSCodeResult, testMakefileInfo } from '../fixtures/testSTMCubeMakefile';
import updateMakefile, { getCurrentMakefile, writeMakefile } from '../../UpdateMakefile';
import createMakefile from '../../CreateMakefile';

import { TextEncoder } from 'util';
import { makefileName } from '../../Definitions';
import { makeFSOverWritable } from '../helpers/fsOverwriteFunctions';

use(chaiAsPromised);
suite('Update makefile', () => {
  beforeEach(() => {
    makeFSOverWritable(vscode);
  });
  afterEach(() => {
    Sinon.restore();
  });
  test('get current makefile with existing file', () => {
    const testString = 'hello';
    const testUInt8Arr = Uint8Array.from(Buffer.from(testString));
    const workspaceFSReadFileFake = Sinon.fake.returns(Promise.resolve(testUInt8Arr));
    Sinon.replace(vscode.workspace.fs, 'readFile', workspaceFSReadFileFake);
    const makefilePath = './Makefile';
    expect(getCurrentMakefile(makefilePath)).to.eventually.equal(testString);
    expect(workspaceFSReadFileFake.calledOnceWith(Uri.file(makefilePath))).to.be.true;
  });
  test('get current makefile without existing file', () => {
    const testUInt8Arr = new Uint8Array(0);
    const workspaceFSReadFileFake = Sinon.fake.returns(Promise.resolve(testUInt8Arr));
    Sinon.replace(vscode.workspace.fs, 'readFile', workspaceFSReadFileFake);

    const makefilePath = './Makefile';
    expect(getCurrentMakefile(makefilePath)).to.eventually.be.rejected;
    expect(workspaceFSReadFileFake.calledOnce).to.be.true;
    expect(workspaceFSReadFileFake.calledOnceWith(Uri.file(makefilePath))).to.be.true;
  });
  test('write makefile successfully in utf-8 format', async () => {
    const writeFileFake = Sinon.fake.returns(Promise.resolve());
    Sinon.replace(vscode.workspace.fs, 'writeFile', writeFileFake);
    const makefilePath = 'AwesomeSTM32Makefile';
    const makefileString = 'a nice looking makefile';
    const fileToWriteTo = Uri.file(makefilePath);
    await writeMakefile(makefilePath, makefileString);
    expect(writeFileFake.calledOnce).to.be.true;
    expect(
      writeFileFake.calledOnceWith(
        fileToWriteTo,
        Buffer.from(makefileString, 'utf-8')
      )
    ).to.be.true;
  });
  test('to not update makefile when same makefile is present', async () => {
    const fakeMakefileReadFile = Sinon.fake.returns(Promise.resolve(new TextEncoder().encode(stm32ForVSCodeResult)));
    const fakeMakefileWriteFile = Sinon.fake.returns(Promise.resolve());
    const fakeMakefileCreate = Sinon.fake.returns(stm32ForVSCodeResult);
    Sinon.replace(makefileFunctions, 'default', fakeMakefileCreate);
    Sinon.replace(vscode.workspace.fs, 'writeFile', fakeMakefileWriteFile);
    Sinon.replace(vscode.workspace.fs, 'readFile', fakeMakefileReadFile);

    await updateMakefile('local', testMakefileInfo);
    expect(fakeMakefileReadFile.calledOnce).to.be.true;
    expect(fakeMakefileWriteFile.callCount).to.equal(0);
  });

  test('update makefile when different makefile is present', async () => {
    const fakeMakefileReadFile = Sinon.fake.returns(Promise.resolve(new TextEncoder().encode('stm32ForVSCodeResult')));
    const fakeMakefileWriteFile = Sinon.fake.returns(Promise.resolve());
    Sinon.replace(vscode.workspace.fs, 'readFile', fakeMakefileReadFile);
    Sinon.replace(vscode.workspace.fs, 'writeFile', fakeMakefileWriteFile);
    await updateMakefile('local', testMakefileInfo);
    // await expect(updateMakefile('local', testMakefileInfo)).to.eventually.be.fulfilled;
    expect(fakeMakefileReadFile.calledOnce).to.be.true;
    expect(fakeMakefileWriteFile.calledOnce).to.be.true;
    expect(
      fakeMakefileWriteFile.calledOnceWith(
        Uri.file(path.posix.join('local', makefileName)),
        Buffer.from(createMakefile(testMakefileInfo), 'utf8')
      )
    ).to.be.true;
  });

  test('write makefile when no earlier makefile is present', async () => {
    const fakeMakefileReadFile = Sinon.fake.returns(Promise.reject(new Error('makefile is not present')));
    const fakeMakefileWriteFile = Sinon.fake.returns(Promise.resolve());
    Sinon.replace(vscode.workspace.fs, 'readFile', fakeMakefileReadFile);
    Sinon.replace(vscode.workspace.fs, 'writeFile', fakeMakefileWriteFile);
    await updateMakefile('local', testMakefileInfo);
    expect(fakeMakefileReadFile.calledOnce).to.be.true;
    expect(fakeMakefileWriteFile.calledOnce).to.be.true;
    expect(
      fakeMakefileWriteFile.calledOnceWith(
        Uri.file(path.posix.join('local', makefileName)),
        Buffer.from(createMakefile(testMakefileInfo), 'utf8')
      )
    ).to.be.true;
  });
});
