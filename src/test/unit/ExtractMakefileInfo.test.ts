/**
* MIT License
*
* Copyright (c) 2020 Bureau Moeilijke Dingen
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/
import * as assert from 'assert';
import { before, test, suite } from 'mocha';
import {
  extractMultiLineInfo, extractSingleLineInfo, extractMakefileInfo, getTargetSTM,
} from '../../ExtractMakefileInfo';
import testMakefile, { testMakefileInfo } from '../fixtures/testSTMCubeMakefile';
import MakeInfo from '../../types/MakeInfo';

suite('MakefileInfoTest', () => {
  // before(() => {
  //   vscode.window.showInformationMessage('Start all tests.');
  // });
  before(() => {
  });
  test('extractSingleLineInfo', () => {
    // assert.
    assert.equal(extractSingleLineInfo('target', testMakefile), testMakefileInfo.target);
    assert.equal(extractSingleLineInfo('C_SOURCES', testMakefile), ' \\');
    assert.equal(extractSingleLineInfo('PREFIX', testMakefile), 'arm-none-eabi-');
    assert.equal(extractSingleLineInfo('CPU', testMakefile), '-mcpu=cortex-m7');
    assert.equal(extractSingleLineInfo('LIBS', testMakefile), '-lc -lm -lnosys');
  });
  test('extractMultiLineInfo', () => {
    assert.deepEqual(extractMultiLineInfo('C_DEFS', testMakefile), ['-DUSE_HAL_DRIVER', '-DSTM32H743xx', '-DUSE_HAL_DRIVER', '-DSTM32H743xx']);
    assert.deepEqual(extractMultiLineInfo('c_sources', testMakefile), testMakefileInfo.cSources);
    assert.deepEqual(extractMultiLineInfo('target', testMakefile), []);
  });
  test('getTargetSTM', () => {
    assert.equal(getTargetSTM(testMakefileInfo.cSources), 'stm32h7x');
  });

  test('extractAllInfo', () => {
    const info: MakeInfo = new MakeInfo();
    const output = extractMakefileInfo(testMakefile);
    assert.deepEqual(output.targetMCU, testMakefileInfo.targetMCU);
    assert.deepEqual(output.target, testMakefileInfo.target);
    assert.deepEqual(output.ldscript, testMakefileInfo.ldscript);
    assert.deepEqual(output.mcu, testMakefileInfo.mcu);
    assert.deepEqual(output.floatAbi, testMakefileInfo.floatAbi);
    assert.deepEqual(output.fpu, testMakefileInfo.fpu);
    assert.deepEqual(output.cpu, testMakefileInfo.cpu);
    assert.deepEqual(output.asmSources, testMakefileInfo.asmSources);
    assert.deepEqual(output.cxxSources, testMakefileInfo.cxxSources);
    assert.deepEqual(output.cSources, testMakefileInfo.cSources);
    assert.deepEqual(output.asIncludes, testMakefileInfo.asIncludes);
    assert.deepEqual(output.cxxIncludes, testMakefileInfo.cxxIncludes);
    assert.deepEqual(output.cIncludes, testMakefileInfo.cIncludes);
    assert.deepEqual(output.asDefs, testMakefileInfo.asDefs);
    assert.deepEqual(output.cxxDefs, testMakefileInfo.cxxDefs);
    assert.deepEqual(output.cDefs, testMakefileInfo.cDefs);
  });
});
