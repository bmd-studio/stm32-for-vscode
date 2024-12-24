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


const configFiles = [
  "stm32c0x.cfg",
  "stm32f0x.cfg",
  "stm32f1x.cfg",
  "stm32f2x.cfg",
  "stm32f3x.cfg",
  "stm32f4x.cfg",
  "stm32f7x.cfg",
  "stm32g0x.cfg",
  "stm32g4x.cfg",
  "stm32h7x.cfg",
  "stm32h7x_dual_bank.cfg",
  "stm32l0.cfg",
  "stm32l0_dual_bank.cfg",
  "stm32l1.cfg",
  "stm32l1x_dual_bank.cfg",
  "stm32l4x.cfg",
  "stm32l5x.cfg",
  "stm32mp13x.cfg",
  "stm32mp15x.cfg",
  "stm32u5x.cfg",
  "stm32w108xx.cfg",
  "stm32wbx.cfg",
  "stm32wlx.cfg",
  "stm32x5x_common.cfg",
  "stm32xl.cfg",
  "stm8l.cfg",
  "stm8l151x2.cfg",
  "stm8l151x3.cfg",
  "stm8l152.cfg",
  "stm8l15xx4.cfg",
  "stm8l15xx6.cfg",
  "stm8l15xx8.cfg",
  "stm8s.cfg",
  "stm8s003.cfg",
  "stm8s103.cfg",
  "stm8s105.cfg",
];

/**
 * Finds the openocd target MCU from the full name
 * @param name the fullname e.g. STM32H723ZGTx
 * @returns the openocd target MCU
 */
export function getTargetMCUFromFullName(name: string): string | undefined {
  let targetNameFind = name.toLowerCase();
  while (targetNameFind.length > 0) {
    const possibleMatch = configFiles.find((entry) => entry.includes(targetNameFind));
    if (possibleMatch) {
      return possibleMatch.replace('.cfg', '');
    }
    targetNameFind = targetNameFind.substring(0, targetNameFind.length - 1);
  }
  return undefined;
}
