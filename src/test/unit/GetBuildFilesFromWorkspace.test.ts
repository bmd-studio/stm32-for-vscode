import * as Sinon from 'sinon';
import * as assert from 'assert';

import { FileListWithRandomFiles, HeaderFiles, SortedBuildFiles } from '../fixtures/testFileLists';
import {
  // convertToRelative,
  getDirCaseFree,
  getIncludeDirectoriesFromFileList,
  sortFiles
} from '../../getInfo/getFiles';

import { afterEach, suite, test } from 'mocha';

import { expect } from 'chai';

suite('GetBuildFilesFromWorkspaceTest', () => {
  afterEach(() => {
    Sinon.restore();
  });
  test('GetDirCaseFree', () => {
    const dirNames = ['Test', 'src', 'lIB', 'library', 'Inc', 'Driver', 'makefile'];
    assert.equal(getDirCaseFree('src', dirNames), 'src');
    assert.equal(getDirCaseFree('inc', dirNames), 'Inc');
    assert.equal(getDirCaseFree('TEST', dirNames), 'Test');
    assert.equal(getDirCaseFree('lib', dirNames), 'lIB');
    assert.equal(getDirCaseFree('Driver', dirNames), 'Driver');
    assert.equal(getDirCaseFree('inC', dirNames), 'Inc');
    assert.equal(getDirCaseFree('makefile', dirNames), 'makefile');
  });

  test('includes', () => {
    const testArr = ['something/otherthing.h',
      // eslint-disable-next-line max-len
      'c:someReally/dr@wnout/l0ngp4ath/using_various-intermittent/char$ters/workspace/Src/someawesomfolder/thefile.h'];
    // eslint-disable-next-line max-len
    const expectedTestoutput = ['c:someReally/dr@wnout/l0ngp4ath/using_various-intermittent/char$ters/workspace/Src/someawesomfolder', 'something'];
    expect(getIncludeDirectoriesFromFileList(testArr)).to.deep.equal(expectedTestoutput);

    const output = getIncludeDirectoriesFromFileList(HeaderFiles);
    expect(output).to.deep.equal(SortedBuildFiles.cIncludeDirectories);


  });
  test('sortFiles', () => {
    const output = sortFiles(FileListWithRandomFiles);
    // this is done as cIncludeDirectories are not handled in the build files anymore.
    SortedBuildFiles.cIncludeDirectories = [];
    expect([]).to.deep.equal(output.cIncludeDirectories);
    expect(SortedBuildFiles.cSources).to.deep.equal(output.cSources);
    expect(SortedBuildFiles.cxxSources).to.deep.equal(output.cxxSources);
    expect(SortedBuildFiles.assemblySources).to.deep.equal(output.assemblySources);
    expect(SortedBuildFiles).to.deep.equal(output);
  });
});