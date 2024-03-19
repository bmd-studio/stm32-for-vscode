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
  EXTENSION_TASK_TYPE_NAME,
  STM32_ENVIRONMENT_FILE_NAME,
  makefileName,
  STM32_ENVIRONMENT_FILE_NAME,
} from './Definitions';
import MakeInfo, { ToolChain } from './types/MakeInfo';
import {
  Uri,
  window,
  workspace
} from 'vscode';

import { checkForRequiredFiles } from './getInfo/getFiles';
import executeTask from './HandleTasks';
import { fsPathToPosix } from './Helpers';
import {
  getInfo,
} from './getInfo';
import updateConfiguration from './configuration/WorkspaceConfigurations';
import updateMakefile from './UpdateMakefile';
import { createProjectEnvironmentFile, hasProjectEnvironmentFile } from './projectSetup/projectEnvironment';
import { emptyProjectSetupPrompt } from './projectSetup';

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




/**
 * Checks if the project is set-up and if not it will prompt the user to setup the project
 * @param Uri workspace folder
 * @returns true when the project is setup. If false is returned the project is not setup and cannot be build
 */
export async function createProjectSetupWhenRequired(workspaceFolder: Uri): Promise<boolean> {
  // check for makefiles
  const rootFileList = await workspace.fs.readDirectory(workspaceFolder);
  const filesInDir: string[] = rootFileList.map((entry) => {
    return entry[0];
  });
  const requiredFilesInDir = checkForRequiredFiles(filesInDir);
  let makefileIsPresent = false;
  let configFileIsPresent = false;
  requiredFilesInDir.forEach((file) => {
    switch (file.file) {
      case 'Makefile':
        makefileIsPresent = file.isPresent;
        break;
      case EXTENSION_CONFIG_NAME:
        configFileIsPresent = file.isPresent;
        break;
    }
  });
  if (!makefileIsPresent && !configFileIsPresent) {
    return await emptyProjectSetupPrompt();
  }
  return true;
}

async function createSTM32EnvironmentFileWhenRequired(tools: ToolChain): Promise<void> {
  try {
    const hasFile = await hasProjectEnvironmentFile();
    if (!hasFile) {
      await createProjectEnvironmentFile(tools);
    }
  } catch (err) {
    // eslint-disable-next-line max-len
    window.showErrorMessage(`Something went wrong with creating the file ${STM32_ENVIRONMENT_FILE_NAME}, please create your own or retry. Error: ${err}`);
  }
}

export interface BuildSTMOptions {
  flash?: boolean;
  cleanBuild?: boolean;
  release?: boolean
};
export default async function buildSTM(options?: BuildSTMOptions): Promise<void> {
  const {
    flash,
    cleanBuild,
    release = false,
  } = options || {};

  let currentWorkspaceFolder;
  let info = {} as MakeInfo;
  if (!workspace?.workspaceFolders?.[0]) {
    window.showErrorMessage('No workspace folder is open. Stopped build');
    return Promise.reject(Error('no workspace folder is open'));
  }

  await createProjectSetupWhenRequired(workspace.workspaceFolders[0].uri);

  try {
    currentWorkspaceFolder = fsPathToPosix(workspace.workspaceFolders[0].uri.fsPath);

    info = await getInfo(currentWorkspaceFolder);
    await createSTM32EnvironmentFileWhenRequired(info.tools);
    let makeFlags = info.makeFlags.length > 0 ? ` ${info.makeFlags.join(' ')}` : '';
    makeFlags += release ? ' DEBUG=0' : ' DEBUG=1';
    const makeArguments = `-j16${makeFlags} -f ${makefileName}`;
    if (cleanBuild) {
      try {
        await executeTask(
          EXTENSION_TASK_TYPE_NAME,
          'STM32 clean',
          [
            `${info.tools.makePath}`,
            makeArguments,
            `clean`
          ],
          {},
          "$gcc"
        );
      } catch (err) {
        const errorMsg = `Something went wrong with cleaning the build. Still are going to proceed to building.
        ERROR: ${err}`;
        window.showErrorMessage(errorMsg);
      }
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
      EXTENSION_TASK_TYPE_NAME,
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
