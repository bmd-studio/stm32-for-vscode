import { suite, test } from 'mocha';

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
import { expect } from 'chai';
import getOpenOcdTarget from '../../OpenOcdTargetFiles';

suite('Open OCD target test', () => {
  test('Test regular targets', () => {
    expect(getOpenOcdTarget('stm32h7x')).to.equal('stm32h7x.cfg');
    expect(getOpenOcdTarget('stm32l0x')).to.equal('stm32l0.cfg');
    expect(getOpenOcdTarget('stm32l4x')).to.equal('stm32l4x.cfg');
    expect(getOpenOcdTarget('stm32f4x')).to.equal('stm32f4x.cfg');
  });
  test('Test false targets', () => {
    expect(getOpenOcdTarget('avr32')).to.be.false;
    expect(getOpenOcdTarget('microchip')).to.be.false;
    expect(getOpenOcdTarget('avr8')).to.be.false;
  });
});
