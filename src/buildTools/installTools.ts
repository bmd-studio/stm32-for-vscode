import * as process from 'process';
import { join } from 'path';
import which from 'which';
import { getNode } from './installNode';
import {
  Uri,
  ExtensionContext,
  ProgressLocation,
  window,
  FileType,
  ConfigurationTarget,
  workspace,
} from 'vscode';
import BUILD_TOOL_DEFINITIONS from './toolChainDefinitions';

import {
  BuildToolDefinition,
  makeDefinition,
} from './toolChainDefinitions';
import {
  checkAutomaticallyInstalledBuildTools, hasBuildTools,
} from './validateToolchain';
import {
  getNewestToolchainVersion,
  getToolBasePath,
  getToolVersionFolders,
  validateXPMToolchainPath
} from './extensionToolchainHelpers';

import CommandMenu from '../menu/CommandMenu';
import { GITHUB_ISSUES_URL } from '../Definitions';
import { checkBuildTools } from '.';
import { exec } from 'child_process';
import executeTask from '../HandleTasks';
import { platform } from 'process';

type XpmInstallType = Promise<void>;

/**
 * Function for installing a build dependency through npm using the buildToolDefinition
 * @param toolsStoragePath storage path to where the tools are stored. The extension uses the globalStoragePath for this
 * @param definition definition of the build tool found in toolChainDefinitions.ts
 */
export async function xpmInstall(
  toolsStoragePath: Uri, npx: string, definition: BuildToolDefinition
): XpmInstallType {
  if (!definition?.installation?.xpm) {
    throw new Error('Could not install using xpm');
  }
  const pathToSaveTo = toolsStoragePath.fsPath;
  const nodePath = join(npx, '../');
  const env: { [key: string]: string } = process.env as { [key: string]: string };
  env['XPACKS_SYSTEM_FOLDER'] = pathToSaveTo;
  env['XPACKS_REPO_FOLDER'] = pathToSaveTo;
  env['npm_config_yes'] = `${true}`;
  env['PATH'] = `${env.PATH}${platform === 'win32' ? ';' : ':'}${nodePath}`;
  const execOptions = {
    env,
    cwd: join(npx, '../'),
  };
  try {
    await workspace.fs.createDirectory(Uri.joinPath(toolsStoragePath, 'cache'));
  } catch (_err) { }

  const npxCommand = platform === 'win32' ? `${npx}.cmd` : npx;
  console.log(`installing ${definition.name}`);
  await executeTask(
    'installation',
    `installing: ${definition.name}`,
    [
      // adding the .cmd for windows, otherwise it will open in a different window for powershell.
      `${npxCommand}`,
      `xpm install --global ${definition.installation.xpm}`
    ],
    execOptions
  );
  console.log(`done installing ${definition.name}`);
}
/**
 * Installs make using xpm
 * @note need to use something else then xpm 
 * @param context vscode extension context
 */
export async function installMake(toolsStoragePath: Uri, npx: string): Promise<void> {
  let executeCmd = '';
  const makePath = await which('make');
  if (makePath) {
    return Promise.resolve();
  }

  switch (platform) {
    case "darwin": {
      executeCmd = makeDefinition.installation.darwin || '';
    } break;
    case "win32": {
      const win32XPMMakeDefinition = { ...makeDefinition };
      win32XPMMakeDefinition.installation.xpm = win32XPMMakeDefinition.installation.windows;
      return xpmInstall(toolsStoragePath, npx, win32XPMMakeDefinition);
    } break;
    case "linux": {
      let cmd = makeDefinition.installation.linux;
      let linuxExecutable = [''];
      if (cmd && !Array.isArray(cmd)) {
        linuxExecutable = [cmd];
      }
      await executeTask('shell', 'install make', linuxExecutable, {});
      return;
    } break;
  }
  return new Promise((resolve, reject) => {
    exec(`${executeCmd}`, (error, /*stdout, stderr*/) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}


export async function installTools(toolsStoragePath: Uri, npx: string): Promise<void> {
  const toolInstallationPromises = Object.entries(BUILD_TOOL_DEFINITIONS).map(([key, value]) => {
    if (key === 'make') {
      // make is a special exception as it is installed on most OS's and if not it requires special instructions
      return installMake(toolsStoragePath, npx);
    }
    return xpmInstall(toolsStoragePath, npx, value);
  });
  await Promise.all(toolInstallationPromises);
}



export async function removeOldTools(tool: BuildToolDefinition, toolsStoragePath: Uri): Promise<void> {
  try {
    const newest = await getNewestToolchainVersion(tool, toolsStoragePath.fsPath);
    const files = await getToolVersionFolders(tool, toolsStoragePath.fsPath);
    if (files && newest) {
      const filesPromises = files.map(async (file) => {
        if (file[0] !== newest.fileName && file[1] === FileType.Directory) {
          const filePath = join(getToolBasePath(tool, toolsStoragePath.fsPath), file[0]);
          return await workspace.fs.delete(Uri.file(filePath), { recursive: true });
        }
        return Promise.resolve();
      });
      await Promise.all(filesPromises);
    }
  } catch (error) {
    // nothing to do
  }
}


export async function addExtensionInstalledToolsToSettings(toolsStoragePath: Uri): Promise<void> {
  const extensionConfiguration = workspace.getConfiguration('stm32-for-vscode');
  const configurationPromises = Object.entries(BUILD_TOOL_DEFINITIONS).map(async ([key, value]) => {
    // make is the only one that will be installed for windows.
    if (key === 'make') {
      if (platform === 'win32') {
        const make = await validateXPMToolchainPath(value, toolsStoragePath.fsPath);
        if (make) {
          await extensionConfiguration.update('makePath', make, ConfigurationTarget.Global);
        }
      }
      return;
    }
    const xpmPath = await validateXPMToolchainPath(value, toolsStoragePath.fsPath);
    if (xpmPath) {
      await extensionConfiguration.update(value.settingName, xpmPath, ConfigurationTarget.Global);
    }
  });

  await Promise.all(configurationPromises);
}

/**
 * Cleans up all the old tools installed by XPM
 */
export async function cleanUpOldTools(toolsStoragePath: Uri): Promise<void> {
  const removeOldToolsPromises = Object.entries(BUILD_TOOL_DEFINITIONS).map(async ([key, value]) => {
    if (key === 'make') {
      if (platform === 'win32') {
        try {
          await removeOldTools(value, toolsStoragePath);
        } catch (err) {
        }
      }
      return;
    }
    await removeOldTools(value, toolsStoragePath);
  });
  await Promise.all(removeOldToolsPromises);
}

/**
 * Install all relevant tools for compiling for a specific platform
 * @note there is a specific issue on windows x32 systems when it uses the ia32 arch.
 * The binaries for xpack are not compiled for this arch and it will not find it.
 * Give the decline of x32 systems this will not be supported.
 * @param toolsStoragePath path where the tools will be installed
 * @returns void
 */
export function installAllTools(toolsStoragePath: Uri): Promise<void | Error> {
  return new Promise((resolve) => {
    window.withProgress({
      location: ProgressLocation.Notification,
      title: 'Installing build tools',
      cancellable: false,
    }, async (progress) => {
      if (process.arch === 'ia32') {
        window.showWarningMessage(
          // eslint-disable-next-line max-len
          `There is a known issue with windows system with the ia32. Tools might not install correctly. Should you encounter this issue. Please open an issue on: ${GITHUB_ISSUES_URL}`
        );
      }

      progress.report({ increment: 0, message: 'Starting build tools installation' });
      // FIXME: VSCode for X32 does not work as it is converted to iar32. This does not work for XPack
      try {
        // Node
        progress.report({ increment: 0, message: 'installing local copy of node' });
        const nodeInstallLocation = await getNode(toolsStoragePath);
        const nodeBinLocation = platform === 'win32' ? nodeInstallLocation : join(nodeInstallLocation, 'bin');
        const npxInstallation = join(nodeBinLocation, 'npx');
        progress.report({ increment: 10, message: 'Node installed' });

        // installing tools
        progress.report({ increment: 10, message: 'Installing all the different built tools this might take a while' });
        await installTools(toolsStoragePath, npxInstallation);


        progress.report({ increment: 50, message: 'Installation done. Cleaning up node' });
        // clean-up
        if (nodeInstallLocation) {
          // remove the node location
          workspace.fs.delete(Uri.file(nodeInstallLocation), { recursive: true });
          workspace.fs.delete(Uri.file(join(toolsStoragePath.fsPath, 'tmp')), { recursive: true });
        }
        progress.report({ increment: 10, message: 'Cleaning up old tools' });
        await cleanUpOldTools(toolsStoragePath);


        progress.report({ increment: 10, message: 'Clean up done. Adding tools to settings' });
        await addExtensionInstalledToolsToSettings(toolsStoragePath);

        progress.report({ increment: 10, message: 'Checking if installation has completed' });
        // check if build tool installation is finished
        const startTime = Date.now();
        let hasBuildToolsInstalled = false;
        while (Date.now() - startTime < 60000 && !hasBuildToolsInstalled) {
          await checkAutomaticallyInstalledBuildTools(toolsStoragePath);
          hasBuildToolsInstalled = await hasBuildTools(toolsStoragePath);
        }

      } catch (err) {
        window.showErrorMessage(`Something has gone wrong while installing the build tools: ${err}`);
        throw (err);
      }
      progress.report({ increment: 100, message: 'Finished build tool installation' });
      resolve();
    });
  });
}




export async function installBuildToolsCommand(
  context: ExtensionContext,
  commandMenu: CommandMenu | undefined,
): Promise<void> {
  try {
    await installAllTools(context.globalStorageUri);
    const hasBuildTools = await checkBuildTools(context);
    if (hasBuildTools && commandMenu) {
      commandMenu.refresh();
    }
  } catch (error) {
    window.showErrorMessage(`Something went wrong with installing the build tools. Error:${error}`);
  }
}
