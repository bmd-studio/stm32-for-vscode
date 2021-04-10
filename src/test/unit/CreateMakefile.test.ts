import * as Sinon from 'sinon';
import * as shelljs from 'shelljs';

import createMakefile, {
  createGCCPathOutput,
  createSingleLineStringList,
  createStringList
} from '../../CreateMakefile';
import { stm32ForVSCodeResult, testMakefileInfo } from '../fixtures/testSTMCubeMakefile';
import { suite, test } from 'mocha';

import MakeInfo from '../../types/MakeInfo';
import { expect } from 'chai';
import { platform } from 'process';

// TODO: add library testing in the mix. 
// TODO: add test for different programmer inclusions
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
  test('if GCC Path is not added when gcc is in path', () => {
    const makeInfo = new MakeInfo();
    makeInfo.tools.armToolchainPath = '.';
    expect(createGCCPathOutput(makeInfo)).to.equal('');
  });
  test('if absolute gcc path is added when not a bin path', () => {
    const relativePath = platform === 'win32' ? '.\\somefolder\\arm-none-eabi' : './somefolder/arm-none-eabi';
    const posixOutputPath = '/usr/somefolder/arm-none-eabi';
    const fsOutputPath = platform === 'win32' ? '\\usr\\somefolder\\arm-none-eabi' : posixOutputPath;
    const gccOutputPath = platform === 'win32' ?
      `${fsOutputPath}\\arm-none-eabi-gcc` : `${fsOutputPath}/arm-none-eabi-gcc`;
    const whichFake = Sinon.fake.returns(gccOutputPath);
    Sinon.replace(shelljs, 'which', whichFake);

    const makeInfo = new MakeInfo();
    makeInfo.tools.armToolchainPath = relativePath;
    const output = createGCCPathOutput(makeInfo);
    expect(output).to.equal(`GCC_PATH=${posixOutputPath}`);
    expect(whichFake.calledOnce).to.be.true;
    Sinon.restore();
  });
  test('Create makefile matches template', () => {
    const result = createMakefile(testMakefileInfo);
    expect(result).to.equal(stm32ForVSCodeResult);
  });

});