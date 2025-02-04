import * as decompress from 'decompress';
import * as path from 'path';
import * as process from 'process';

import * as vscode from 'vscode';

import {
  BuildToolDefinition,
  armNoneEabiDefinition,
  cMakeDefinition,
  makeDefinition,
  openocdDefinition
} from './toolChainDefinitions';
import {
  checkAutomaticallyInstalledBuildTools,
  hasRelevantAutomaticallyInstalledBuildTools
} from './validateToolchain';
import {
  getNewestToolchainVersion,
  getToolBasePath,
  getToolVersionFolders,
  validateXPMToolchainPath
} from './extensionToolchainHelpers';

import CommandMenu from '../menu/CommandMenu';
import { GITHUB_ISSUES_URL } from '../Definitions';
import axios from 'axios';
import { checkBuildTools } from '.';
import { exec } from 'child_process';
import executeTask from '../HandleTasks';
import { platform } from 'process';
import { which } from '../Helpers';

type XpmInstallType = Promise<void>;

/**
 * Function for installing a build dependency through npm using the buildToolDefinition
 * @param toolsStoragePath storage path to where the tools are stored. The extension uses the globalStoragePath for this
 * @param definition definition of the build tool found in toolChainDefinitions.ts
 */
export async function xpmInstall(
  toolsStoragePath: vscode.Uri, npx: string, definition: BuildToolDefinition
): XpmInstallType {
  if (!definition?.installation?.xpm) {
    throw new Error('Could not install using xpm');
  }
  const pathToSaveTo = toolsStoragePath.fsPath;
  const nodePath = path.join(npx, '../');
  const pathSeparator = platform === 'win32' ? ';' : ':';
  let env: { [key: string]: string } = process.env as { [key: string]: string };
  env = Object.fromEntries(
    Object.entries(env)
      .map(([key, value]) => {
        if (key.includes('npm') || key.toUpperCase().includes('NVM')) {
          return [key, ''];
        }
        return [key, value];
      })
  );
  env['XPACKS_SYSTEM_FOLDER'] = pathToSaveTo;
  env['XPACKS_REPO_FOLDER'] = pathToSaveTo;
  env['npm_config_yes'] = `${true}`;
  env['PATH'] = env?.['PATH']
    ?.split(pathSeparator)
    .filter((pathValue) => (!pathValue.includes('node') && !pathValue.includes('nvm')))
    .join(pathSeparator);
  env['PATH'] = `${nodePath}${pathSeparator}${env.PATH}`;

  env['npm_config_cache'] = path.join(toolsStoragePath.fsPath, 'cache');
  env['NODE'] = nodePath;

  const execOptions = {
    env,
    cwd: path.join(npx, '../'),
  };
  try {
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(toolsStoragePath, 'cache'));
  } catch (_err) { }

  const npxCommand = platform === 'win32' ? `${npx}.cmd` : npx;
  await executeTask(
    'installation',
    `installing: ${definition.name}`,
    [
      // adding the .cmd for windows, otherwise it will open in a different window for powershell.
      `${npxCommand}`,
      // `--cache "${path.join(context.globalStorageUri.fsPath, 'cache')}"`,
      `xpm install --global ${definition.installation.xpm}`
    ],
    execOptions
  );
}

/**
 * Installs openocd using xpm
 * @param context vscode extension context
 */
export function installOpenOcd(toolsStoragePath: vscode.Uri, npx: string): XpmInstallType {
  return xpmInstall(toolsStoragePath, npx, openocdDefinition);
}
/**
 * Installs make using xpm
 * @note need to use something else then xpm 
 * @param context vscode extension context
 */
export async function installMake(toolsStoragePath: vscode.Uri, npx: string): Promise<void> {
  let executeCmd = '';
  if (which('make')) {
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
      let cmd = makeDefinition.installation.linux as string | string[];
      let linuxExecutable = Array.isArray(cmd) ? cmd : [cmd];
      /**
       * It is essential to run update if the extension is installed in devcontainer. Otherwise
       * encounter the error `E: Unable to locate package build-essential`
       */
      await executeTask('shell', 'update package lists', ['sudo', '-S apt-get update'], {});
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

/**
 * Installs cmake using xpm
 * @param context vscode extension context
 */
export function installCMake(toolsStoragePath: vscode.Uri, npx: string): XpmInstallType {
  return xpmInstall(toolsStoragePath, npx, cMakeDefinition);
}
/**
 * Installs arm-none-eabi tool chain using xpm
 * @param context vscode extension context
 */
export function installArmNonEabi(toolsStoragePath: vscode.Uri, npx: string): XpmInstallType {
  return xpmInstall(toolsStoragePath, npx, armNoneEabiDefinition);
}
const nodeRegex: { [key: string]: { [key: string]: RegExp } } = {
  win32: {
    x32: /href="(\/dist\/v\d+\.\d+\.\d+\/node-v\d+\.\d+\.\d+-win-x86.zip)/gm,
    x64: /href="(\/dist\/v\d+\.\d+\.\d+\/node-v\d+\.\d+\.\d+-win-x64.zip)/gm,
    ia32: /href="(\/dist\/v\d+\.\d+\.\d+\/node-v\d+\.\d+\.\d+-win-x86.zip)/gm,
    ia64: /href="(\/dist\/v\d+\.\d+\.\d+\/node-v\d+\.\d+\.\d+-win-x64.zip)/gm,
  },
  darwin: {
    x64: /href="(\/dist\/v\d+\.\d+\.\d+\/node-v\d+\.\d+\.\d+-darwin-x64.tar.gz)/gm,
    arm64: /href="(\/dist\/v\d+\.\d+\.\d+\/node-v\d+\.\d+\.\d+-darwin-arm64.tar.gz)/gm
  },
  linux: {
    arm: /href="(\/dist\/v\d+\.\d+\.\d+\/node-v\d+\.\d+\.\d+-linux-armv7l.tar.gz)/gm,
    arm64: /href="(\/dist\/v\d+\.\d+\.\d+\/node-v\d+\.\d+\.\d+-linux-arm64.tar.gz)/gm,
    x64: /href="(\/dist\/v\d+\.\d+\.\d+\/node-v\d+\.\d+\.\d+-linux-x64.tar.gz)/gm,
    ppc64: /href="(\/dist\/v\d+\.\d+\.\d+\/node-v\d+\.\d+\.\d+-linux-ppc64le.tar.gz)/gm,
    s390x: /href="(\/dist\/v\d+\.\d+\.\d+\/node-v\d+\.\d+\.\d+-linux-s390x.tar.gz)/gm,
  }
};
const nodePlatformIdentifiers: { [key: string]: { [key: string]: string } } = {
  win32: {
    x32: 'win-x86.zip',
    x64: 'win-x64.zip',
    ia32: 'win-x86.zip',
    ia64: 'win-x64.zip',
  },
  darwin: {
    x64: 'darwin-x64.tar.gz',
    arm64: 'darwin-arm64.tar.gz',
  },
  linux: {
    arm: 'linux-armv7l.tar.gz',
    arm64: 'linux-arm64.tar.gz',
    x64: 'linux-x64.tar.gz',
    ppc64: 'linux-ppc64le.tar.gz',
    s390x: 'linux-s390x.tar.gz',
  }
};


/**
 * 
 * @param latestNodeBody body of the https://nodejs.org/dist/latest/ page
 * @param platform the platform for which to get the node version
 * @param arch the arch for which to get the node version
 */
export function getPlatformSpecificNodeLink(
  latestNodeBody: string, currentPlatform: NodeJS.Platform, arch: string
): string | undefined {
  const platformLinkId = nodePlatformIdentifiers?.[`${currentPlatform}`]?.[`${arch}`];
  const splitRegex = /<a\s+href=\"/gm;
  const hrefSplit = latestNodeBody.split(splitRegex);
  const platformPreLink = hrefSplit.filter((input) => {
    return input.includes(platformLinkId);
  });
  if (!platformLinkId || platformPreLink.length === 0) {
    throw new Error(
      // eslint-disable-next-line max-len
      `Could not find the NodeJS link for your specific platform: platform: ${process.platform}, arch: ${process.arch}. Please open a GitHub Issue: ${GITHUB_ISSUES_URL}`);
  }

  const platformLink = platformPreLink[0].slice(0, platformPreLink[0].indexOf('"'));
  return platformLink;
}

// latest gallium is the latest lts v16 version. 
const nodeLatestURL = 'https://nodejs.org/dist/latest-gallium/';

/**
 * Gets the latest node version download filename for the current platform.
 */
export function getLatestNodeLink(): Promise<string> {

  return new Promise((resolve, reject) => {
    axios.get(nodeLatestURL).then((response) => {
      const latestLink = getPlatformSpecificNodeLink(response.data, process.platform, process.arch);
      if (latestLink) {
        resolve(`${latestLink}`);
      } else {
        reject(
          new Error(
            'No link found for this specific platform. ' +
            'Please open a new issue to ask for support for your specific platform at: ' +
            GITHUB_ISSUES_URL
          )
        );
      }
    }).catch((err) => {
      reject(err);
    });
  });
}




const nodeBaseUrl = 'https://nodejs.org';
/**
 * Downloads the latest compressed version of node to the extensions global storage directory in ta tmp folder.
 * @param context vscode extensions context
 * @param fileDownloadName the platform specific filename for node
 */
export function downloadLatestNode(toolsStoragePath: vscode.Uri, fileDownloadName: string): Promise<string> {
  const pathToSaveTo = toolsStoragePath.fsPath;
  const downloadURL = `${nodeBaseUrl}${fileDownloadName}`;
  const downloadPath = path.join(pathToSaveTo, 'tmp', fileDownloadName);

  return new Promise((resolve, reject) => {

    axios.get(downloadURL, { responseType: 'arraybuffer' }).then((response) => {
      vscode.workspace.fs.writeFile(vscode.Uri.file(downloadPath), response.data).then(() => {
        resolve(downloadPath);
      }, (error) => {
        reject(error);
      });
    }).catch(err => reject(err));

  });
}

/**
 * Extracts compressed files to a specific directory.
 * @param context vscode extension context
 * @param filePath path to the file to be extracted
 * @param outPath path to the output directory
 */
export async function extractFile(filePath: string, outPath: string): Promise<string> {
  // TODO: replace this with the node native zlib
  try {
    await decompress(filePath, outPath);
  } catch (err: any) {
    vscode.window.showWarningMessage(`${err}`);
    if (err?.message?.includes('EEXIST')) {
      await vscode.workspace.fs.delete(vscode.Uri.file(outPath), { recursive: true });
      return extractFile(filePath, outPath);
    }
    throw err;
  }
  return outPath;
}

/**
 * Function for downloading and extracting a new latest node version
 * @param toolsStoragePath storage path to where the tools are stored. The extension uses the globalStoragePath for this
 */
export async function getNode(toolsStoragePath: vscode.Uri): Promise<string> {
  try {
    const latestNodeLink = await getLatestNodeLink();
    const latestNodeCompressed = await downloadLatestNode(toolsStoragePath, latestNodeLink);
    const extractedNodeFileLoc = await extractFile(
      latestNodeCompressed,
      path.join(toolsStoragePath.fsPath, 'node')
    );
    const dirContents = await vscode.workspace.fs.readDirectory(vscode.Uri.file(extractedNodeFileLoc));
    const nodeInstallationFilePath = dirContents.find((file) => { return (file[0].indexOf('node') >= 0); });
    if (!nodeInstallationFilePath || !nodeInstallationFilePath[0]) {
      throw new Error('No node installation could be found after download and extraction');
    }
    return path.join(extractedNodeFileLoc, nodeInstallationFilePath[0]);
  } catch (error) {
    vscode.window.showErrorMessage(
      `An error occurred during the node installation process.
        Please try again, or create an issue at: ${GITHUB_ISSUES_URL}. Include the error: ${error}`
    );
    throw error;
  }
}

export async function removeOldTools(tool: BuildToolDefinition, toolsStoragePath: vscode.Uri): Promise<void> {
  try {
    const newest = await getNewestToolchainVersion(tool, toolsStoragePath.fsPath);
    const files = await getToolVersionFolders(tool, toolsStoragePath.fsPath);
    if (files && newest) {
      const filesPromises = files.map(async (file) => {
        if (file[0] !== newest.fileName && file[1] === vscode.FileType.Directory) {
          const filePath = path.join(getToolBasePath(tool, toolsStoragePath.fsPath), file[0]);
          return await vscode.workspace.fs.delete(vscode.Uri.file(filePath), { recursive: true });
        }
        return Promise.resolve();
      });
      await Promise.all(filesPromises);
    }
  } catch (error) {
    // nothing to do
  }
}
export async function addExtensionInstalledToolsToSettings(toolsStoragePath: vscode.Uri): Promise<void> {
  const extensionConfiguration = vscode.workspace.getConfiguration('stm32-for-vscode');
  //openocd
  const openocd = await validateXPMToolchainPath(openocdDefinition, toolsStoragePath.fsPath);
  if (openocd) {
    await extensionConfiguration.update('openOCDPath', openocd, vscode.ConfigurationTarget.Global);
  }
  // arm-none-eabi
  const armEabi = await validateXPMToolchainPath(armNoneEabiDefinition, toolsStoragePath.fsPath);
  if (armEabi) {
    await extensionConfiguration.update('armToolchainPath', armEabi, vscode.ConfigurationTarget.Global);
  }
  // make, currently we only install it for windows in the extension
  if (platform === 'win32') {
    const make = await validateXPMToolchainPath(makeDefinition, toolsStoragePath.fsPath);
    if (make) {
      await extensionConfiguration.update('makePath', make, vscode.ConfigurationTarget.Global);
    }
  }
  vscode.window.showInformationMessage(
    'Do you want to set the same openOCD path and arm tools path for the Cortex Debug extension as well?'
    , 'yes'
  ).then((button) => {
    if (button === 'yes') {
      const cortexConfig = vscode.workspace.getConfiguration('cortex-debug');
      cortexConfig.update('openocdPath', openocd, vscode.ConfigurationTarget.Global);
      cortexConfig.update('armToolchainPath', armEabi, vscode.ConfigurationTarget.Global);
    }
  });
}
/**
 * Install all relevant tools for compiling for a specific platform
 * @note there is a specific issue on windows x32 systems when it uses the ia32 arch.
 * The binaries for xpack are not compiled for this arch and it will not find it.
 * Give the decline of x32 systems this will not be supported.
 * @param toolsStoragePath path where the tools will be installed
 * @returns void
 */
export function installAllTools(toolsStoragePath: vscode.Uri): Promise<void | Error> {
  return new Promise((resolve) => {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Installing build tools',
      cancellable: false,
    }, async (progress) => {
      if (process.arch === 'ia32') {
        vscode.window.showWarningMessage(
          // eslint-disable-next-line max-len
          `There is a known issue with windows system with the ia32. Tools might not install correctly. Should you encounter this issue. Please open an issue on: ${GITHUB_ISSUES_URL}`
        );
      }

      progress.report({ increment: 0, message: 'Starting build tools installation' });
      // FIXME: VSCode for X32 does not work as it is converted to iar32. This does not work for XPack
      try {
        // Node
        progress.report({ increment: 0, message: 'Installing local copy of node' });
        const nodeInstallLocation = await getNode(toolsStoragePath);
        const nodeBinLocation = platform === 'win32' ? nodeInstallLocation : path.join(nodeInstallLocation, 'bin');
        const npxInstallation = path.join(nodeBinLocation, 'npx');
        progress.report({ increment: 10, message: 'Node installed' });

        // OPEN OCD
        progress.report({ increment: 10, message: 'Installing openOCD' });
        await installOpenOcd(toolsStoragePath, npxInstallation);
        // Make
        progress.report({ increment: 20, message: 'Installing make' });
        await installMake(toolsStoragePath, npxInstallation);
        // arm-none-eabi
        progress.report({ increment: 20, message: 'Installing arm-none-eabi' });
        await installArmNonEabi(toolsStoragePath, npxInstallation);
        progress.report({ increment: 20, message: 'Finished installing build tools' });

        // clean-up
        if (nodeInstallLocation) {
          // remove the node location
          vscode.workspace.fs.delete(vscode.Uri.file(nodeInstallLocation), { recursive: true });
          vscode.workspace.fs.delete(vscode.Uri.file(path.join(toolsStoragePath.fsPath, 'tmp')), { recursive: true });
        }
        progress.report({ increment: 10, message: 'Cleaning up' });
        await removeOldTools(openocdDefinition, toolsStoragePath);
        await removeOldTools(armNoneEabiDefinition, toolsStoragePath);
        if (platform === 'win32') {
          try {
            await removeOldTools(makeDefinition, toolsStoragePath);
          } catch (err) {
          }
        }
        await addExtensionInstalledToolsToSettings(toolsStoragePath);
        progress.report({ increment: 10, message: 'Awaiting for all to be installed' });
        // check if build tool installation is finished
        const startTime = Date.now();
        let hasBuildToolsInstalled = false;
        while (Date.now() - startTime < 60000 && !hasBuildToolsInstalled) {
          const currentToolchain = await checkAutomaticallyInstalledBuildTools(toolsStoragePath);
          hasBuildToolsInstalled = hasRelevantAutomaticallyInstalledBuildTools(currentToolchain);
        }

      } catch (err) {
        vscode.window.showErrorMessage(`Something has gone wrong while installing the build tools: ${err}`);
        throw (err);
      }
      progress.report({ increment: 100, message: 'Finished build tool installation' });
      resolve();
    });
  });
}




export async function installBuildToolsCommand(
  context: vscode.ExtensionContext,
  commandMenu: CommandMenu | undefined,
): Promise<void> {
  try {
    await installAllTools(context.globalStorageUri);
    const hasBuildTools = await checkBuildTools(context);
    if (hasBuildTools && commandMenu) {
      commandMenu.refresh();
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Something went wrong while installing the build tools. Error:${error}`);
  }
}
