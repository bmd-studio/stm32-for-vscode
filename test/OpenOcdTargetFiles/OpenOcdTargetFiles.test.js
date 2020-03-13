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
import assert from 'assert';
import { before, test, suite } from 'mocha';
import getOpenOcdTarget from '../../src/OpenOcdTargetFiles';

suite('Open OCD target test', () => {
  before(() => {
  });
  test('Test regular targets', () => {
    assert.equal(getOpenOcdTarget('stm32h7x'), 'stm32h7x.cfg');
    assert.equal(getOpenOcdTarget('stm32l0x'), 'stm32l0.cfg');
    assert.equal(getOpenOcdTarget('stm32l4x'), 'stm32l4x.cfg');
    assert.equal(getOpenOcdTarget('stm32f4x'), 'stm32f4x.cfg');
  });
  test('Test false targets', () => {
    assert.equal(getOpenOcdTarget('avr32'), false);
    assert.equal(getOpenOcdTarget('microchip'), false);
    assert.equal(getOpenOcdTarget('avr8'), false);
  });
});
