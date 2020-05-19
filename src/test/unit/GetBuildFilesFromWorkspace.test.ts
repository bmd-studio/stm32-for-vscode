import * as assert from 'assert';
import { before, test, suite, afterEach, it } from 'mocha';
import {expect} from 'chai';
import {getDirCaseFree, checkForRequiredFiles, sortFiles, getIncludes, convertToRelative, REQUIRED_RESOURCES} from '../../GetBuildFilesFromWorkspace';
import {FileListWithRandomFiles, cFiles, asmFiles, HeaderFiles, cxxFiles, cIncludes, SortedBuildFiles } from '../fixtures/testFileLists';
import * as Sinon from 'sinon';
import { window } from 'vscode';
import * as _ from 'lodash';

suite('GetFilesTest', () => {
  // before(() => {
  //   vscode.window.showInformationMessage('Start all tests.');
  // });
  before(() => {
  });
  afterEach(()=>{
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
    const someFiles = ['somePreamble/src', 'somesortofw13r@preamble_ofsomeSort/inc', 'src/tuna', 'src/melt', 'Drivers/STM32_HAL/some_overly_long_file_name_to_depict_some/STM/library_hal_file.c'];
    const warningMsg = Sinon.fake();
    Sinon.replace(window, 'showWarningMessage', warningMsg);
    assert.equal(checkForRequiredFiles(someFiles), false);
    assert.equal(warningMsg.callCount, REQUIRED_RESOURCES.length - 2);
  });
  test('CheckForRequiredFilesSucceeds', () => {
    const files = ['somePreamble/src', 'somesortofw13r@preamble_ofsomeSort/inc', 'Drivers/STM32_HAL/some_overly_long_file_name_to_depict_some/STM/library_hal_file.c', './preamble_ofsomeSort/preamble/Drivers', 'Makefile'];
    const warningMsg = Sinon.fake();
    Sinon.replace(window, 'showWarningMessage', warningMsg);
    assert.equal(checkForRequiredFiles(files), true);
    assert.equal(warningMsg.callCount, 0);
  });
  test('sortFiles', () => {
    const output = sortFiles(FileListWithRandomFiles);
    console.log({SortedBuildFiles, output});
    console.log({SortedBuildFilesIncs: SortedBuildFiles.cIncludes, outputIncs: output.cIncludes});
    
    // assert.deepEqual(SortedBuildFiles.cIncludes, output.cIncludes);
    expect(SortedBuildFiles.cIncludes).to.deep.equal(output.cIncludes);
    expect(SortedBuildFiles.cSources).to.deep.equal(output.cSources);
    expect(SortedBuildFiles.cxxSources).to.deep.equal(output.cxxSources);
    expect(SortedBuildFiles.asmSources).to.deep.equal(output.asmSources);
    expect(SortedBuildFiles.cIncludes).to.deep.equal(output.cIncludes);
    expect(SortedBuildFiles).to.deep.equal(output);
  });
});