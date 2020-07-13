import createMakefile, { createStringList } from '../../CreateMakefile';
import { stm32ForVSCodeResult, testMakefileInfo } from '../fixtures/testSTMCubeMakefile';
import { suite, test } from 'mocha';

import { expect } from 'chai';

suite('CreateMakefile', () => {
  test('check for proper line endings on string list', () => {
    const testEntries = ['hi', 'hello', 'some/filename.txt'];
    const expectedResult = 'hello \\\nhi \\\nsome/filename.txt\n';
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