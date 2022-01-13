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

import * as path from 'path';

import {
  EXTENSION_CONFIG_NAME,
  makefileName,
} from './Definitions';
import MakeInfo, { ExtensionConfiguration } from './types/MakeInfo';
import {
  Uri,
  window,
  workspace
} from 'vscode';
import { cpus, targetsMCUs } from './configuration/ConfigInfo';

import { checkForRequiredFiles } from './getInfo/getFiles';
import executeTask from './HandleTasks';
import { fsPathToPosix } from './Helpers';
import {
  getInfo,
} from './getInfo';
import updateConfiguration from './configuration/WorkspaceConfigurations';
import updateMakefile from './UpdateMakefile';
import { writeConfigFile } from './configuration/stm32Config';

/**
 * Checks if the language is C++ and that there is no main.cpp present. 
 * If so it will output the main.cpp in the build folder, so it can be used for compilation.
 * @param info makefile info
 */
async function checkForMainCPPOrAddWhenNecessary(info: MakeInfo): Promise<MakeInfo> {
  if (!workspace.workspaceFolders) {
    window.showErrorMessage('No workspace folder is open. Stopped build');
    return Promise.reject(Error('no workspace folder is open'));
  }
  // if language is C++ and the main.c file is not converted to a main.cpp file
  if (info.language === 'C++') {
    const cMainIndex = info.cSources.findIndex((file) => (file.includes('main.c')));
    const hasCMain = (cMainIndex >= 0);
    const hasCXXMain = (info.cxxSources.findIndex(
      (file) => (
        file.includes('main.cpp') || file.includes('main.cxx')
      )
    ) >= 0);

    if (hasCMain && !hasCXXMain) {
      // create a copy of the main.c file in the build folder.
      const pathToCMain = path.join(workspace.workspaceFolders[0].uri.fsPath, info.cSources[cMainIndex]);
      const cMainFile = await workspace.fs.readFile(Uri.file(pathToCMain));
      const cxxMainFilePath = path.join(workspace.workspaceFolders[0].uri.fsPath, 'build', 'main.cpp');
      await workspace.fs.writeFile(Uri.file(cxxMainFilePath), cMainFile);
      const relativeCXXPath = path.posix.join('build', 'main.cpp');
      info.cxxSources.push(relativeCXXPath);
      info.cSources.splice(cMainIndex, 1);
    }
  }
  return info;
}

export default async function buildSTM(options?: { flash?: boolean; cleanBuild?: boolean }): Promise<void> {
  const {
    flash,
    cleanBuild,
  } = options || {};


  let currentWorkspaceFolder;
  let info = {} as MakeInfo;
  if (!workspace.workspaceFolders || !workspace.workspaceFolders?.[0]) {
    window.showErrorMessage('No workspace folder is open. Stopped build');
    return Promise.reject(Error('no workspace folder is open'));
  }
  // check for makefiles
  const rootFileList = await workspace.fs.readDirectory(workspace.workspaceFolders[0].uri);
  const filesInDir: string[] = rootFileList.map((entry) => {
    return entry[0];
  });
  const requiredFilesInDir = checkForRequiredFiles(filesInDir);
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
      'Makefile was not found. If using CubeMX please select generate makefile under:Project Manager>Project/Toolchain IDE. Or do you want to generate a blank stm32-config-yaml file, so a custom project can be configured?',
      'Cancel',
      'Generate config file'
    );
    if (response === 'Generate config file') {
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

    // update makefile info and main.cpp if required.
    info = await checkForMainCPPOrAddWhenNecessary(info);
    await updateMakefile(currentWorkspaceFolder, info);

    try {
      await updateConfiguration(workspace.workspaceFolders[0].uri, info);
    } catch (err) {
      const errorMsg = `Something went wrong with configuring the workspace. ERROR: ${err}`;
      window.showErrorMessage(errorMsg);
      throw new Error(errorMsg);
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
