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
  MAKE_DEFAULT_CONCURRENT_JOBS,
  makefileName,
  STM32_ENVIRONMENT_FILE_NAME,
} from './Definitions';
import MakeInfo, { ExtensionConfiguration, ToolChain } from './types/MakeInfo';
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
import { createProjectEnvironmentFile, hasProjectEnvironmentFile } from './projectSetup/projectEnvironment';

/**
 * Checks if the language is C++ and that there is no main.cpp present. 
 * If so it will output the main.cpp in the build folder, so it can be used for compilation.
 * @param info makefile info
 */
async function checkForMainCPPOrAddWhenNecessary(info: MakeInfo): Promise<MakeInfo> {
  if (!workspace.workspaceFolders) {
    window.showErrorMessage('No workspace folder is open. Stopped build.');
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

async function checkForWorkspaceFolder(): Promise<Uri> {
  if (!workspace.workspaceFolders || !workspace.workspaceFolders?.[0]) {
    window.showErrorMessage('No workspace folder is open. Stopped build.');
    throw new Error('no workspace folder is open');
  }
  return workspace.workspaceFolders[0].uri;
}

interface BuildRequirements {
  posix: string;
  uri: Uri;
}
// NOTE: throws all the errors to the upperscope
async function checkForRequirements():Promise<BuildRequirements> {
  const workspaceFolder = await checkForWorkspaceFolder();
  const posixWorkspaceFolder = fsPathToPosix(workspaceFolder.fsPath);
  // check for makefiles
  const rootFileList = await workspace.fs.readDirectory(workspaceFolder);
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
      'Makefile was not found. If using CubeMX, please select: "Project Manager > Project/Toolchain IDE > Generate Makefile". Alternatively, would you like to generate a blank "STM32-for-VSCode.config.yaml" file, so a custom project can be configured?',
      'Cancel',
      'Generate YAML config file'
    );
    if (response === 'Generate YAML config file') {

      const targetName = await window.showInputBox({
        title: 'Pick a name for the project',
      });
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
      standardConfig.target = targetName || 'projectName';
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
      throw new Error('Project not configured, stopping build');
    }
  }
  return {posix: posixWorkspaceFolder, uri: workspaceFolder};

}

async function cleanBuildTask(makeArguments: string, makePath: string| boolean): Promise<void> {
  try {
    await executeTask(
      'build',
      'STM32 clean',
      [
        `${makePath}`,
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

export default async function buildSTM(options?: { 
  flash?: boolean,
  cleanBuild?: boolean,
  debug?: boolean 
}): Promise<void> {
  const {
    flash,
    cleanBuild,
    debug = true,
  } = options || {};


  let info = {} as MakeInfo;
  // TODO: add project scanner in here so it can find the first project.
  // Or create a way to use multiple projects and targets
  const currentWorkspaceFolder = await checkForRequirements();

  try {

    info = await getInfo(currentWorkspaceFolder.posix);
    await createSTM32EnvironmentFileWhenRequired(info.tools);
    let makeFlags = info.makeFlags.length > 0 ? ` ${info.makeFlags.join(' ')}` : '';
    const extensionConfiguration = workspace.getConfiguration('stm32-for-vscode');
    const concurrentJobs = extensionConfiguration.get('makeConcurrentJobs', MAKE_DEFAULT_CONCURRENT_JOBS);

    if(!debug) {
      makeFlags = `${makeFlags} DEBUG=0`;
    } else {
      makeFlags = `${makeFlags} DEBUG=1`;
    }

    const makeArguments = `-j${concurrentJobs}${makeFlags} -f ${makefileName}`;
    if (cleanBuild) {
      await cleanBuildTask(makeArguments, info.tools.makePath);
    }


    // update makefile info and main.cpp if required.
    info = await checkForMainCPPOrAddWhenNecessary(info);
    await updateMakefile(currentWorkspaceFolder.posix, info);

    try {
      await updateConfiguration(currentWorkspaceFolder.uri, info);
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
