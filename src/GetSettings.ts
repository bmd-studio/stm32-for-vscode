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

import * as _ from 'lodash';

import { ToolChain } from './types/MakeInfo';
import { workspace } from 'vscode';

/**
 * @description returns workspace settings
 * @returns {ToolChain} the settings from the workspace
 */
export default function getWorkspaceSettings(): ToolChain {
  const settings = workspace.getConfiguration('stm32-for-vscode');
  const result = new ToolChain();
  const armToolchainPath = settings.get('armToolchainPath');
  const openOCDPath = settings.get('openOCDPath');
  const makePath = settings.get('makePath');
  const openOCDInterface = settings.get('openOCDInterface');

  if (!_.isEmpty(armToolchainPath) && _.isString(armToolchainPath)) {
    result.armToolchainPath = armToolchainPath;
  }
  if (!_.isEmpty(openOCDPath) && _.isString(openOCDPath)) {
    result.openOCDPath = openOCDPath;
  }
  if (!_.isEmpty(makePath) && _.isString(makePath)) {
    result.makePath = makePath;
  }
  if (!_.isEmpty(openOCDInterface) && _.isString(openOCDInterface)) {
    result.openOCDInterface = openOCDInterface;
  }

  return result;
}  