import createMakefile, { createSingleLineStringList, createStringList } from '../../CreateMakefile';
import { stm32ForVSCodeResult, testMakefileInfo } from '../fixtures/testSTMCubeMakefile';
import { suite, test } from 'mocha';

import { expect } from 'chai';

// TODO: add library testing in the mix. 
suite('CreateMakefile', () => {
  test('check for proper line endings on string list', () => {
    const testEntries = ['hi', 'hello', 'some/filename.txt'];
    const expectedResult = 'hello \\\nhi \\\nsome/filename.txt\n';
    const result = createStringList(testEntries);
    expect(result).to.equal(expectedResult);
  });

  test('single line stringlist', () => {
    const testArray = ['hello', 'beautiful', 'world'];
    const expectedResult = 'beautiful hello world ';
    const result = createSingleLineStringList(testArray);
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