// import buildSTM from '../../BuildTask';
import * as Sinon from 'sinon';
import * as assert from 'assert';

import { afterEach, before, it, suite, test } from 'mocha';
// import { workspace, Uri, WorkspaceFolder, window } from 'vscode';
import createMakefile, {createStringList} from '../../CreateMakefile';
import { expect, use } from 'chai';
import {stm32ForVSCodeResult, testMakefileInfo} from '../fixtures/testSTMCubeMakefile';

suite('CreateMakefile', () => {
  test('check for proper line endings on string list', () => {
    const testEntries = ['hi', 'hello', 'some/filename.txt' ];
    const expectedResult = 'hi \\\nhello \\\nsome/filename.txt\n';
    const result = createStringList(testEntries);
    expect(result).to.equal(expectedResult);
  });
  test('outputs empty string on empty array', () => {
    const result = createStringList([]);
    expect(result).to.equal('');
  });

  test('Create makefile matches template', () => {
    const result = createMakefile(testMakefileInfo);
    expect(result).to.equal(stm32ForVSCodeResult);
  });

});