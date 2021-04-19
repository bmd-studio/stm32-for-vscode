import * as Sinon from 'sinon';
import * as vscode from 'vscode';

import {
  XPMToolVersion,
  compareVersions,
  getNewestToolchainVersion,
  isVersionFile,
  parseXPMVersionNumbers
} from '../../../buildTools/extensionToolchainHelpers';

import { afterEach, beforeEach } from 'mocha';
import { expect } from 'chai';
import { openocdDefinition } from '../../../buildTools/toolChainDefinitions';

const fs = vscode.workspace.fs;

const standardVersionFile: XPMToolVersion = {
  xpmVersion: [5, 2, 0],
  toolVersion: [1, 2, 3],
  fileName: '1.2.3-5.2',
};

suite('Extension Toolchain Helpers', () => {
  const fsOg = { ...vscode.workspace.fs };
  beforeEach(() => {
    Object.defineProperty(vscode.workspace.fs, 'readDirectory', () => { return Promise.resolve([]); });
    // Object.defineProperty(fs, 'readDirectory', () => { return Promise.resolve([]); });
  });
  afterEach(() => {
    Sinon.restore();
    Object.defineProperty(vscode.workspace.fs, 'readDirectory', fsOg.readDirectory);
  });
  test('parse XPM version number', () => {
    const versionFileName = '1.2.333-5.2';
    const versionResult: XPMToolVersion = {
      xpmVersion: [5, 2, 0],
      toolVersion: [1, 2, 333],
      fileName: versionFileName,
    };
    const version = parseXPMVersionNumbers(versionFileName);
    expect(version).to.deep.equal(versionResult);
  });
  test('is version file', () => {
    const noVersionFile: XPMToolVersion = {
      xpmVersion: [0, 0, 0],
      toolVersion: [0, 0, 0],
      fileName: 'something',
    };
    const versionFile: XPMToolVersion = {
      xpmVersion: [5, 2, 0],
      toolVersion: [1, 2, 3],
      fileName: '1.2.3-5.2',
    };
    expect(isVersionFile(noVersionFile)).to.be.false;
    expect(isVersionFile(versionFile)).to.be.true;
  });
  test('compare version', () => {
    const lowerVersionFile: XPMToolVersion = {
      xpmVersion: [5, 2, 0],
      toolVersion: [1, 1, 3],
      fileName: '1.1.3-5.2',
    };
    const lowerVersionFileXPM: XPMToolVersion = {
      xpmVersion: [4, 3, 0],
      toolVersion: [1, 2, 3],
      fileName: '1.2.3-4.3',
    };

    expect(compareVersions(null, standardVersionFile)).to.deep.equal(standardVersionFile);
    expect(compareVersions(lowerVersionFile, standardVersionFile)).to.deep.equal(standardVersionFile);
    expect(compareVersions(standardVersionFile, lowerVersionFile)).to.deep.equal(standardVersionFile);
    expect(compareVersions(standardVersionFile, lowerVersionFileXPM)).to.deep.equal(standardVersionFile);
    expect(compareVersions(lowerVersionFileXPM, standardVersionFile)).to.deep.equal(standardVersionFile);
  });
  test('get newest xpm version when present', async () => {
    // const fakeReadDirectory = Sinon.fake.returns(Promise.resolve([
    //   ['randomFolder', vscode.FileType.Directory],
    //   ['randomFile', vscode.FileType.File],
    //   ['1.1.3-5.2', vscode.FileType.Directory],
    //   ['1.2.3-5.2', vscode.FileType.Directory],
    // ]));
    // // fakeReadDirectory.call()
    // // Sinon.replace(fs, 'readDirectory', fakeReadDirectory);
    // const readDirStub = Sinon.stub(fs, 'readDirectory');
    // const thenableOutput: Promise<[(string | vscode.FileType), (string | vscode.FileType)][]> = () => {
    //   return new Promise((resolve) => {
    //     resolve([
    //       ['randomFolder', vscode.FileType.Directory],
    //       ['randomFile', vscode.FileType.File],
    //       ['1.1.3-5.2', vscode.FileType.Directory],
    //       ['1.2.3-5.2', vscode.FileType.Directory]]);
    //   });
    // };

    // readDirStub.returns(thenableOutput);
    // const newestToolChainVersion = await getNewestToolchainVersion(openocdDefinition, 'pathIsNotRead');
    // expect(newestToolChainVersion).to.deep.equal(standardVersionFile);
    // expect(fakeReadDirectory.calledOnce).to.be.true;
    // const pathNotRead = await getNewestToolchainVersion(openocdDefinition, 'pathIsNotRead');
    // expect(pathNotRead).to.deep.equal(standardVersionFile);
    // readDirStub.restore();
  });

  test('get newest xpm version when none are present', async () => {
    const fakeReadDirectory = Sinon.fake.returns(Promise.resolve(undefined));
    Sinon.replace(fs, 'readDirectory', fakeReadDirectory);

    return expect(getNewestToolchainVersion(openocdDefinition, 'pathIsNotRead')).to.be.rejected;
  });

});