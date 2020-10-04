import {parseXPMVersionNumbers, XPMToolVersion, isVersionFile, compareVersions, getNewestToolchainVersion } from '../../../getInfo/extensionToolchainHelpers';
import * as vscode from 'vscode';
import * as Sinon from 'sinon';
import { expect } from 'chai';
import { lowerFirst } from 'lodash';
import {openocdDefinition} from '../../../getInfo/ToolChainDefintions';
import { fake } from 'sinon';
const standardVersionFile: XPMToolVersion = {
  xpmVersion: [5,2,0],
  toolVersion: [1,2,3],
  fileName: '1.2.3-5.2',
};


suite('Extension Toolchain Helpers', () => {
  test('parse XPM version number', () => {
    const versionFileName = '1.2.333-5.2';
    const versionResult: XPMToolVersion = {
      xpmVersion: [5,2,0],
      toolVersion: [1,2,333],
      fileName: versionFileName,
    };
    expect(parseXPMVersionNumbers).to.deep.equal(versionResult);
  });
  test('is version file', () => {
    const noVersionFile: XPMToolVersion = {
      xpmVersion: [0,0,0],
      toolVersion: [0,0,0],
      fileName: 'something',
    };
    const versionFile: XPMToolVersion = {
      xpmVersion: [5,2,0],
      toolVersion: [1,2,3],
      fileName: '1.2.3-5.2',
    };
    expect(isVersionFile(noVersionFile)).to.be.false;
    expect(isVersionFile(versionFile)).to.be.true;
  });
  test('compare version', () => {
    const lowerVersionFile: XPMToolVersion = {
      xpmVersion: [5,2,0],
      toolVersion: [1,1,3],
      fileName: '1.1.3-5.2',
    };
    const lowerVersionFileXPM: XPMToolVersion = {
      xpmVersion: [4,3,0],
      toolVersion: [1,2,3],
      fileName: '1.2.3-4.3',
    };
    
    expect(compareVersions(null, standardVersionFile)).to.deep.equal(standardVersionFile);
    expect(compareVersions(lowerVersionFile, standardVersionFile)).to.deep.equal(standardVersionFile);
    expect(compareVersions(standardVersionFile, lowerVersionFile)).to.deep.equal(standardVersionFile);
    expect(compareVersions(standardVersionFile, lowerVersionFileXPM)).to.deep.equal(standardVersionFile);
    expect(compareVersions(lowerVersionFileXPM, standardVersionFile)).to.deep.equal(standardVersionFile);
  });
  test('get newest xpm version when present', () => {
    const fakeReadDirectory = Sinon.fake.returns(Promise.resolve([
      ['randomFolder', vscode.FileType.Directory],
      ['randomFile', vscode.FileType.File],
      ['1.1.3-5.2', vscode.FileType.Directory],
      ['1.2.3-5.2', vscode.FileType.Directory],
    ]));
    const fs = vscode.workspace.fs;
    Sinon.replace(fs, 'readDirectory', fakeReadDirectory);
    expect(getNewestToolchainVersion(openocdDefinition)).to.eventually.equal(standardVersionFile);
    expect(fakeReadDirectory.calledOn).to.be.true;
    getNewestToolchainVersion(openocdDefinition).then((value) => {
      expect(value).to.deep.equal(standardVersionFile);
    });
    Sinon.restore();
  });
  test('get newest xpm version when none are present', ()=> {
    const fakeReadDirectory = Sinon.fake.returns(Promise.resolve(undefined));
    const fs = vscode.workspace.fs;
    Sinon.replace(fs, 'readDirectory', fakeReadDirectory);
    expect(getNewestToolchainVersion(openocdDefinition)).to.be.rejected;
    Sinon.restore();
  });

});