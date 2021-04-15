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
/*
 * Created by Jort Band - Bureau Moeilijke Dingen
 */

import {
  window,
  workspace,
} from 'vscode';

import MakeInfo from './types/MakeInfo';
import executeTask from './HandleTasks';
import { fsPathToPosix } from './Helpers';
import {
  getInfo,
} from './getInfo';
import {
  makefileName,
} from './Definitions';
import updateConfiguration from './configuration/WorkspaceConfigurations';
import updateMakefile from './UpdateMakefile';


export default async function buildSTM(options?: { flash?: boolean; cleanBuild?: boolean }): Promise<void> {
  const {
    flash,
    cleanBuild,
  } = options || {};


  let currentWorkspaceFolder;
  let info = {} as MakeInfo;
  if (!workspace.workspaceFolders) {
    window.showErrorMessage('No workspace folder is open. Stopped build');
    return Promise.reject(Error('no workspace folder is open'));
  }
  try {
    currentWorkspaceFolder = fsPathToPosix(workspace.workspaceFolders[0].uri.fsPath);
    info = await getInfo(currentWorkspaceFolder);
    await updateMakefile(currentWorkspaceFolder, info);
    const baseMakePath = `"${info.tools.makePath}" -j -f ${makefileName}`;

    if (cleanBuild) {
      await executeTask(
        'build',
        'STM32 clean',
        `${baseMakePath} clean`);
    }
    await executeTask(
      'build',
      'STM32 build',
      `${baseMakePath} ${flash ? ' flash' : ''}`
    );
  } catch (err) {
    const errMsg = `Something went wrong during the build process: ${err}`;
    window.showErrorMessage(errMsg);
    throw new Error(errMsg);
  }

  try {
    await updateConfiguration(workspace.workspaceFolders[0].uri, info);
  } catch (err) {
    const errorMsg = `Something went wrong with configuring the workspace. ERROR: ${err}`;
    window.showErrorMessage(errorMsg);
    throw new Error(errorMsg);
  }
}
