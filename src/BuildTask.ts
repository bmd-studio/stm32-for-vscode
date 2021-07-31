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

import MakeInfo, { ExtensionConfiguration } from './types/MakeInfo';
import executeTask from './HandleTasks';
import { fsPathToPosix } from './Helpers';
import {
  getInfo,
} from './getInfo';
import {
  EXTENSION_CONFIG_NAME,
  makefileName,
} from './Definitions';
import updateConfiguration from './configuration/WorkspaceConfigurations';
import updateMakefile from './UpdateMakefile';
import { checkForRequiredFiles } from './getInfo/getFiles';
import { targetsMCUs, cpus } from './configuration/ConfigInfo';
import { writeConfigFile } from './configuration/stm32Config';


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
  // check for makefiles
  const rootFileList = await workspace.fs.readDirectory(workspace.workspaceFolders[0].uri);
  const filesInDir: string[] = rootFileList.map((entry) => {
    return entry[0];
  });
  const requiredFilesInDir = checkForRequiredFiles(filesInDir);
  let hasConfigAndMakefileMissing = false;
  let makefileIsPresent = false;
  let configFileIsPresent = false;
  requiredFilesInDir.forEach((file) => {
    if (file.file === 'Makefile') {
      makefileIsPresent = file.isPresent;
    }
    if (file.file === EXTENSION_CONFIG_NAME) {
      configFileIsPresent = file.isPresent;
    }
  });
  if (!makefileIsPresent && !configFileIsPresent) {
    const response = await window.showInformationMessage(
      // eslint-disable-next-line max-len
      'Makefile was not found. If using CubeMX please select generate makefile under:Project Manager>Project/Toolchain IDE. Or do you want to generate a blank stm32-config-yaml file, so a custom project can be configured?', 'Cancel', 'Generate config file'
    );
    if (response === 'Generate config file') {
      console.log('Should generate config file');
      const targetMCU = await window.showQuickPick(targetsMCUs, {
        title: 'Pick a target MCU',
      });
      const targetCPU = await window.showQuickPick(cpus, {
        title: 'pick a target cpu architecture',
      });
      const ldScript = await window.showInputBox({
        title: 'linker script',
        prompt: 'please enter the name/path to the linker script'
      });
      const standardConfig: ExtensionConfiguration = new ExtensionConfiguration();
      if (targetMCU) {
        standardConfig.targetMCU = targetMCU;
      }
      if (targetCPU) {
        standardConfig.cpu = targetCPU;
      }
      if (ldScript) {
        standardConfig.ldscript = ldScript;
      }
      await writeConfigFile(standardConfig);
    } else {
      return;
    }
  }

  try {
    currentWorkspaceFolder = fsPathToPosix(workspace.workspaceFolders[0].uri.fsPath);
    info = await getInfo(currentWorkspaceFolder);
    await updateMakefile(currentWorkspaceFolder, info);

    try {
      await updateConfiguration(workspace.workspaceFolders[0].uri, info);
    } catch (err) {
      const errorMsg = `Something went wrong with configuring the workspace. ERROR: ${err}`;
      window.showErrorMessage(errorMsg);
      throw new Error(errorMsg);
    }

    const makeArguments = `-j16 -f ${makefileName}`;

    if (cleanBuild) {
      await executeTask(
        'build',
        'STM32 clean',
        [
          `${info.tools.makePath}`,
          makeArguments,
          `clean`
        ],
        {},
        "$gcc"
      );
    }
    await executeTask(
      'build',
      'STM32 build',
      [
        `${info.tools.makePath}`,
        makeArguments,
        `${flash ? ' flash' : ''}`
      ],
      {},
      "$gcc"
    );
  } catch (err) {
    const errMsg = `Something went wrong during the build process: ${err}`;
    window.showErrorMessage(errMsg);
    throw new Error(errMsg);
  }
}
