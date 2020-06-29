import * as assert from 'assert';
import { before, test, suite, afterEach, it } from 'mocha';
import {getIgnores, stripIgnoredFiles} from '../../HandleIgnoredFiles';
import * as helpers from '../../Helpers';
import {expect} from 'chai';
import { ignoreFileName } from '../../Definitions';
import * as Sinon from 'sinon';
import { workspace, Uri } from 'vscode';
import {testGlobFiles, testSTMIgnoreFile} from '../fixtures/testSTMIgnoreFile';
import * as _ from 'lodash';
import ignore from 'ignore';
import { mock } from 'sinon';

suite('Handle ignored files', () => {
  afterEach(() => {
    Sinon.restore();
  });
  test(`creation of file when ${ignoreFileName} is not present`, async () => {
    const findWorkspacefilesFake = Sinon.fake.returns( new Promise((resolve) => { resolve([]); }));
    const writeFileInWorkspaceFake = Sinon.fake();
    Sinon.replace(workspace, 'findFiles', findWorkspacefilesFake);
    Sinon.replace(helpers, 'writeFileInWorkspace', writeFileInWorkspaceFake);
    const mockWorkspaceUri = Uri.file('./localworkspace');
    const ignoreResult = await getIgnores(mockWorkspaceUri);
    expect(ignoreResult).to.deep.equal([]);
    expect(findWorkspacefilesFake.calledOnceWith(ignoreFileName)).to.be.true;
    expect(writeFileInWorkspaceFake.calledOnceWith(mockWorkspaceUri, ignoreFileName)).to.be.true;
    return new Promise((resolve) => {resolve();});
  });
  test(`Getting the fileglobs from ${ignoreFileName}`, async () => {
    const findWorkspacefilesFake = Sinon.fake.returns( new Promise((resolve) => { resolve([ignoreFileName]); }));
    const writeFileInWorkspaceFake = Sinon.fake();
    const readFileInWorkspaceFake = Sinon.fake.returns(new Promise((resolve) => {resolve(testSTMIgnoreFile);}));

    Sinon.replace(workspace, 'findFiles', findWorkspacefilesFake);
    Sinon.replace(helpers, 'writeFileInWorkspace', writeFileInWorkspaceFake);
    Sinon.replace(workspace.fs, 'readFile', readFileInWorkspaceFake);
    const mockWorkspaceUri = Uri.file('./localworkspace');
    const ignoreResult = await getIgnores(mockWorkspaceUri);
    expect(ignoreResult.sort()).to.deep.equal(testGlobFiles.sort());
    expect(writeFileInWorkspaceFake.callCount).to.equal(0);
    expect(readFileInWorkspaceFake.calledOnceWith(ignoreFileName)).to.be.true;
    return new Promise((resolve) => {resolve();});
  });
  test('ignoring the right files', () => {
    const fileListInput = [
      'ignoredDir/fileOne.txt',
      'ignoredDir/With/Some/DeeplyNestedFile.cpp',
      'unignoredTopFile.cpp',
      'localDir/somefile.h',
      'specificallyIgnoredFile.h',
      'ignoredDir/other.h',
      'someOtherOneLevelDeepDir/examples/example1.cpp',
      'someOtherOneLevelDeepDir/headers/hello.h',
    ];
    const fileListOutput = [
      'unignoredTopFile.cpp',
      'localDir/somefile.h',
      'someOtherOneLevelDeepDir/headers/hello.h',
    ];
    const globs = ['ignoredDir/**', 'specificallyIgnoredFile.h', 'someOtherOneLevelDeepDir/examples'];

    const processedFileList = stripIgnoredFiles(fileListInput, globs);
    expect(processedFileList.sort()).to.deep.equal(fileListOutput.sort());
  });
});