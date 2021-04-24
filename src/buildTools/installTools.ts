import * as _ from 'lodash';
import * as path from 'path';
import * as process from 'process';
import * as decompress from 'decompress';
import * as vscode from 'vscode';
import * as shelljs from 'shelljs';
import executeTask from '../HandleTasks';

import {
  BuildToolDefinition,
  armNoneEabiDefinition,
  cMakeDefinition,
  makeDefinition,
  openocdDefinition
} from './toolChainDefinitions';
import {
  getNewestToolchainVersion,
  getToolVersionFolders,
  getToolBasePath,
  validateXPMToolchainPath
} from './extensionToolchainHelpers';

import { GITHUB_ISSUES_URL } from '../Definitions';
import axios from 'axios';
import { exec } from 'child_process';
import { platform } from 'process';

type xpmInstallType = Promise<void>;

/**
 * Function for installing a build dependency through npm using the buildToolDefinition
 * @param context vscode context
 * @param definition definition of the build tool found in toolChainDefinitions.ts
 */
export async function xpmInstall(
  context: vscode.ExtensionContext, npx: string, definition: BuildToolDefinition
): xpmInstallType {
  if (!_.has(definition, 'installation.xpm')) {
    throw new Error('Could not install using xpm');
  }
  const pathToSaveTo = context.globalStoragePath;
  const env = process.env;
  _.set(env, 'XPACKS_SYSTEM_FOLDER', pathToSaveTo);
  _.set(env, 'XPACKS_REPO_FOLDER', pathToSaveTo);
  const execOptions = {
    env,
  };
  try {
    await executeTask(
      'installation',
      `installing: ${definition.name}`,
      [`${npx}`, `xpm install --global ${definition.installation.xpm}`],
      execOptions
    );
  } catch (err) {
    throw err;
  }
}

/**
 * Installs openocd using xpm
 * @param context vscode extension context
 */
export function installOpenOcd(context: vscode.ExtensionContext, npx: string): xpmInstallType {
  return xpmInstall(context, npx, openocdDefinition);
}
/**
 * Installs make using xpm
 * @note need to use something else then xpm 
 * @param context vscode extension context
 */
export function installMake(context: vscode.ExtensionContext, npx: string): Promise<void> {
  let executeCmd = '';
  if (shelljs.which('make')) {
    return Promise.resolve();
  }

  switch (platform) {
    case "darwin": {
      executeCmd = makeDefinition.installation.darwin || '';
    } break;
    case "win32": {
      const win32XPMMakeDefinition = _.cloneDeep(makeDefinition);
      win32XPMMakeDefinition.installation.xpm = win32XPMMakeDefinition.installation.windows;
      // executeCmd = makeDefinition.installation.windows || '';
      return xpmInstall(context, npx, win32XPMMakeDefinition);
    } break;
    case "linux": {
      executeCmd = makeDefinition.installation.linux || '';
    } break;
  }
  return new Promise((resolve, reject) => {
    exec(`${executeCmd}`, (error, /*stdout, stderr*/) => {
      if (error) {
        reject(error);
        return;
      }
      // console.log(`stdout: ${stdout}`);
      // console.error(`stderr: ${stderr}`);
      resolve();
    });
  });
}

/**
 * Installs cmake using xpm
 * @param context vscode extension context
 */
export function installCMake(context: vscode.ExtensionContext, npx: string): xpmInstallType {
  return xpmInstall(context, npx, cMakeDefinition);
}
/**
 * Installs arm-none-eabi tool chain using xpm
 * @param context vscode extension context
 */
export function installArmNonEabi(context: vscode.ExtensionContext, npx: string): xpmInstallType {
  return xpmInstall(context, npx, armNoneEabiDefinition);
}

const nodeRegex = {
  win32: {
    x32: /href="(node-v\d*.\d*.\d*-win-x86.zip)/gm,
    x64: /href="(node-v\d*.\d*.\d*-win-x64.zip)/gm
  },
  darwin: {
    x64: /href="(node-v\d*.\d*.\d*.-darwin-x64.tar.gz)/gm
  },
  linux: {
    arm: /href="(node-v\d*.\d*.\d*.-linux-armv7l.tar.gz)/gm,
    arm64: /href="(node-v\d*.\d*.\d*.-linux-arm64.tar.gz)/gm,
    x64: /href="(node-v\d*.\d*.\d*.-linux-x64.tar.gz)/gm,
    ppc64: /href="(node-v\d*.\d*.\d*.-linux-ppc64le.tar.gz)/gm,
    s390x: /href="(node-v\d*.\d*.\d*.-linux-s390x.tar.gz)/gm,
  }
};

/**
 * 
 * @param latestNodeBody body of the https://nodejs.org/dist/latest/ page
 * @param platform the platform for which to get the node version
 * @param arch the arch for which to get the node version
 */
export function getPlatformSpecificNodeLink(
  latestNodeBody: string, platform: NodeJS.Platform, arch: string
): string | null {
  const platformRegex = _.cloneDeep(_.get(nodeRegex, `${platform}.${arch}`, null));
  let link = null;
  if (platformRegex) {
    const result = platformRegex.exec(latestNodeBody);
    if (_.isArray(result)) {
      link = result[0];
    } else {
      link = result;
    }
  }
  if (_.isString(link)) {
    link = link.replace(`href="`, '');
  }
  return link;
}

const nodeLatestURL = 'https://nodejs.org/dist/latest/';

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
            'No link found for this specific platform, ' +
            'please open a new issue to ask for support for your specific platform at: ' +
            'https://github.com/bmd-studio/stm32-for-vscode/issues'
          )
        );
      }
    }).catch((err) => {
      reject(err);
    });
  });
}

/**
 * Downloads the latest compressed version of node to the extensions global storage directory in ta tmp folder.
 * @param context vscode extensions context
 * @param fileDownloadName the platform specific filename for node
 */
export function downloadLatestNode(context: vscode.ExtensionContext, fileDownloadName: string): Promise<string> {
  const pathToSaveTo = context.globalStoragePath;
  const downloadURL = `${nodeLatestURL}${fileDownloadName}`;
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
  try {
    await decompress(filePath, outPath);
  } catch (err) {
    vscode.window.showWarningMessage(err);
    if (err.message.includes('EEXIST')) {
      await vscode.workspace.fs.delete(vscode.Uri.file(outPath), { recursive: true });
      return extractFile(filePath, outPath);
    }
    throw err;
  }
  return outPath;
}

// TODO: create an integration test for downloading node.
/**
 * Function for downloading and extracting a new latest node version
 * @param context vscode context
 */
export function getNode(context: vscode.ExtensionContext): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const latestNodeLink = await getLatestNodeLink();
      const latestNodeCompressed = await downloadLatestNode(context, latestNodeLink);
      const extractedNodeFileLoc = await extractFile(
        latestNodeCompressed,
        path.join(context.globalStoragePath, 'node')
      );
      const dirContents = await vscode.workspace.fs.readDirectory(vscode.Uri.file(extractedNodeFileLoc));
      const nodeInstallationFilePath = _.find(dirContents, (file) => { return (file[0].indexOf('node') >= 0); });
      if (!nodeInstallationFilePath || !nodeInstallationFilePath[0]) {
        reject(new Error('No node installation could be found after download and extraction'));
        return;
      }
      resolve(path.join(extractedNodeFileLoc, nodeInstallationFilePath[0]));
    } catch (error) {
      vscode.window.showErrorMessage(
        `An error occurred during the node installation process, 
        please try again or create an issue at: ${GITHUB_ISSUES_URL}, with stating error: ${error}`
      );
      reject(error);
    }
  });
}

export async function removeOldTools(tool: BuildToolDefinition, context: vscode.ExtensionContext): Promise<void> {
  try {
    const newest = await getNewestToolchainVersion(tool, context.globalStoragePath);
    const files = await getToolVersionFolders(tool, context.globalStoragePath);
    if (files && newest) {
      files.map(async (file) => {
        if (file[0] !== newest.fileName && file[1] === vscode.FileType.Directory) {
          const filePath = path.join(getToolBasePath(tool, context.globalStoragePath), file[0]);
          await vscode.workspace.fs.delete(vscode.Uri.file(filePath), { recursive: true });
        }
      });
    }
  } catch (error) {
    // nothing to do
  }
}
export async function addExtensionInstalledToolsToSettings(context: vscode.ExtensionContext): Promise<void> {
  const extensionConfiguration = vscode.workspace.getConfiguration('stm32-for-vscode');
  //openocd
  const openocd = await validateXPMToolchainPath(openocdDefinition, context.globalStoragePath);
  if (openocd) {
    await extensionConfiguration.update('openOCDPath', openocd, vscode.ConfigurationTarget.Global);
  }

  // arm-none-eabi
  const armEabi = await validateXPMToolchainPath(armNoneEabiDefinition, context.globalStoragePath);
  if (armEabi) {
    await extensionConfiguration.update('armToolchainPath', armEabi, vscode.ConfigurationTarget.Global);
  }


  // make, currently we only install it for windows in the extension
  if (platform === 'win32') {
    const make = await validateXPMToolchainPath(makeDefinition, context.globalStoragePath);
    if (make) {
      await extensionConfiguration.update('makePath', make, vscode.ConfigurationTarget.Global);
    }

  }
}

export function installAllTools(context: vscode.ExtensionContext): Promise<void | Error> {
  return new Promise((resolve) => {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Installing build tools',
      cancellable: false,
    }, async (progress) => {
      progress.report({ increment: 0, message: 'Starting build tools installation' });
      try {

        progress.report({ increment: 0, message: 'installing local copy of node' });
        const nodeInstallLocation = await getNode(context);
        const nodeBinLocation = platform === 'win32' ? nodeInstallLocation : path.join(nodeInstallLocation, 'bin');
        const npxInstallation = path.join(nodeBinLocation, 'npx');
        progress.report({ increment: 10, message: 'Node installed' });

        progress.report({ increment: 10, message: 'installing openOCD' });
        await installOpenOcd(context, npxInstallation);
        progress.report({ increment: 20, message: 'installing make' });
        await installMake(context, npxInstallation);
        progress.report({ increment: 20, message: 'installing arm-none-eabi' });
        await installArmNonEabi(context, npxInstallation);
        progress.report({ increment: 20, message: 'Finished installing build tools' });
        if (nodeInstallLocation) {
          // remove the node location
          vscode.workspace.fs.delete(vscode.Uri.file(nodeInstallLocation), { recursive: true });
          vscode.workspace.fs.delete(vscode.Uri.file(path.join(context.globalStoragePath, 'tmp')), { recursive: true });
        }
        progress.report({ increment: 10, message: 'Cleaning up' });
        await removeOldTools(openocdDefinition, context);
        await removeOldTools(armNoneEabiDefinition, context);
        if (platform === 'win32') {
          try {
            await removeOldTools(makeDefinition, context);
          } catch (err) {
            // console.error(err);
          }
        }
        await addExtensionInstalledToolsToSettings(context);
        progress.report({ increment: 20, message: 'done' });
      } catch (err) {
        vscode.window.showErrorMessage(`Something has gone wrong while installing the build toold: ${err}`);
      }
      progress.report({ increment: 100, message: 'Finshed build tool installation' });
      resolve();
    });
  });
}



