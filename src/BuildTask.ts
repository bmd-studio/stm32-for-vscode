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
import {
  getInfo,
} from './Info';
import {
  makefileName,
} from './Definitions';
import updateConfiguration from './workspaceConfiguration/WorkspaceConfigurations';
import updateMakefile from './UpdateMakefile';

export default async function buildSTM(options: { flash?: boolean; cleanBuild?: boolean }): Promise<void> {
  const {
    flash,
    cleanBuild,
  } = options || {};
  return new Promise(async (resolve, reject) => {
    let currentWorkspaceFolder;
    let info = {} as MakeInfo;
    if (!workspace.workspaceFolders) {
      window.showErrorMessage('No workspace folder is open. Stopped build');
      reject(Error('no workspace folder is open'));
      return;
    }
    try {
      currentWorkspaceFolder = workspace.workspaceFolders[0].uri.fsPath;
      info = await getInfo(currentWorkspaceFolder);
      await updateMakefile(currentWorkspaceFolder, info);
      if (cleanBuild) {
        await executeTask('build', 'STM32 clean', `make -f ${makefileName} clean`);
      }
      await executeTask('build', 'STM32 build', `make -f ${makefileName}${flash ? ' flash' : ''}`);
    } catch (err) {
      const errMsg = `Something went wrong during the build process: ${err}`;
      window.showErrorMessage(errMsg);
      reject(errMsg);
      return;
    }

    try {
      await updateConfiguration(workspace.workspaceFolders[0].uri, info);
    } catch (err) {
      const errorMsg = `Something went wrong with configuring the workspace. ERROR: ${err}`;
      window.showErrorMessage(errorMsg);
      reject(errorMsg);
    }
    resolve();
  });
}
