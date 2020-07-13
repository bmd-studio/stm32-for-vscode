import * as Sinon from 'sinon';
import * as assert from 'assert';

import { FileListWithRandomFiles, HeaderFiles, SortedBuildFiles } from '../fixtures/testFileLists';
import {
  REQUIRED_RESOURCES,
  checkForRequiredFiles,
  convertToRelative,
  getDirCaseFree,
  getIncludes,
  sortFiles
} from '../../GetBuildFilesFromWorkspace';
import { afterEach, suite, test } from 'mocha';

import { expect } from 'chai';
import { window } from 'vscode';

suite('GetFilesTest', () => {
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
  test('CheckForRequiredFilesFails', () => {
    const warningMsg = Sinon.fake();
    Sinon.replace(window, 'showWarningMessage', warningMsg);
    assert.equal(checkForRequiredFiles([]), false);
    assert.equal(warningMsg.callCount, REQUIRED_RESOURCES.length);
  });
  test('CheckForRequiredFilesSomeFail', () => {
    const someFiles = ['somePreamble/src',
      'somesortofw13r@preamble_ofsomeSort/inc',
      'src/tuna',
      'src/melt',
      'Drivers/STM32_HAL/some_overly_long_file_name_to_depict_some/STM/library_hal_file.c'
    ];
    const warningMsg = Sinon.fake();
    Sinon.replace(window, 'showWarningMessage', warningMsg);
    assert.equal(checkForRequiredFiles(someFiles), false);
    assert.equal(warningMsg.callCount, REQUIRED_RESOURCES.length - 2);
  });
  test('CheckForRequiredFilesSucceeds', () => {
    const files = ['somePreamble/src',
      'somesortofw13r@preamble_ofsomeSort/inc',
      'Drivers/STM32_HAL/some_overly_long_file_name_to_depict_some/STM/library_hal_file.c',
      './preamble_ofsomeSort/preamble/Drivers', 'Makefile'];
    const warningMsg = Sinon.fake();
    Sinon.replace(window, 'showWarningMessage', warningMsg);
    assert.equal(checkForRequiredFiles(files), true);
    assert.equal(warningMsg.callCount, 0);
  });
  test('convertToRelative', () => {
    const absolutePaths = [
      'c:someReally/dr@wnout/l0ngp4ath/using_various-intermittent/char$ters/workspace/Makefile',
      'c:someReally/dr@wnout/l0ngp4ath/using_various-intermittent/char$ters/workspace/Inc',
      // eslint-disable-next-line max-len
      'c:someReally/dr@wnout/l0ngp4ath/using_various-intermittent/char$ters/workspace/Src/someawesomfolder/awesomecakes.cpp'
    ];
    const absolutePathsWithSlashes = [
      'c:someReally/dr@wnout/l0ngp4ath/using_various-intermittent/char$ters/workspace/Makefile/',
      'c:someReally/dr@wnout/l0ngp4ath/using_various-intermittent/char$ters/workspace/Inc/',
      // eslint-disable-next-line max-len
      'c:someReally/dr@wnout/l0ngp4ath/using_various-intermittent/char$ters/workspace/Src/someawesomfolder/awesomecakes.cpp'
    ];
    const currentWorkspace = 'c:someReally/dr@wnout/l0ngp4ath/using_various-intermittent/char$ters/workspace/';
    // eslint-disable-next-line max-len
    const currentWorkspaceWithoutSlash = 'c:someReally/dr@wnout/l0ngp4ath/using_various-intermittent/char$ters/workspace/';
    const relativePaths = [
      'Makefile',
      'Inc',
      'Src/someawesomfolder/awesomecakes.cpp',
    ];
    //TODO: define behavior for when the string cannot be converted to a relative path to that position.
    expect(convertToRelative(absolutePaths, currentWorkspaceWithoutSlash)).to.deep.equal(relativePaths);
    expect(convertToRelative(absolutePaths, currentWorkspace)).to.deep.equal(relativePaths);
    expect(convertToRelative(absolutePathsWithSlashes, currentWorkspace)).to.deep.equal(relativePaths);

    // test paths that are outside of the relative scope
    const pathsOutsideWorkspace = ['c:somepath/gcc_arm/arm-none-eabi-gcc', 'c:/somepath/workspace/main.cpp'];
    const pathsOutsideWorkspaceOutput = ['../../../c:somepath/gcc_arm/arm-none-eabi-gcc', 'main.cpp'];
    expect(convertToRelative(pathsOutsideWorkspace, 'c:/somepath/workspace/'))
      .to.deep.equal(pathsOutsideWorkspaceOutput);

  });
  test('includes', () => {
    const testArr = ['something/otherthing.h',
      // eslint-disable-next-line max-len
      'c:someReally/dr@wnout/l0ngp4ath/using_various-intermittent/char$ters/workspace/Src/someawesomfolder/thefile.h'];
    // eslint-disable-next-line max-len
    const expectedTestoutput = ['-Ic:someReally/dr@wnout/l0ngp4ath/using_various-intermittent/char$ters/workspace/Src/someawesomfolder', '-Isomething'];
    expect(getIncludes(testArr)).to.deep.equal(expectedTestoutput);

    const output = getIncludes(HeaderFiles);
    expect(output).to.deep.equal(SortedBuildFiles.cIncludes);


  });
  test('sortFiles', () => {
    const output = sortFiles(FileListWithRandomFiles);
    // assert.deepEqual(SortedBuildFiles.cIncludes, output.cIncludes);
    expect(SortedBuildFiles.cIncludes).to.deep.equal(output.cIncludes);
    expect(SortedBuildFiles.cSources).to.deep.equal(output.cSources);
    expect(SortedBuildFiles.cxxSources).to.deep.equal(output.cxxSources);
    expect(SortedBuildFiles.asmSources).to.deep.equal(output.asmSources);
    expect(SortedBuildFiles.cIncludes).to.deep.equal(output.cIncludes);
    expect(SortedBuildFiles).to.deep.equal(output);
  });
});