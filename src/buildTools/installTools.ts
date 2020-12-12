import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import * as unzipper from 'unzipper';
import * as vscode from 'vscode';

import {
  BuildToolDefinition,
  armNoneEabiDefinition,
  cMakeDefinition,
  makeDefinition,
  openocdDefinition
} from './toolChainDefinitions';

import { ExtensionContext } from 'vscode';
import { GITHUB_ISSUES_URL } from '../Definitions';
import axios from 'axios';
import { checkBuildTools } from '.';
import { exec } from 'child_process';

type xpmInstallType = Promise<void>;

/**
 * Function for installing a build dependency through npm using the buildToolDefinition
 * @param context vscode context
 * @param definition definition of the build tool found in toolChainDefinitions.ts
 */
export function xpmInstall(context: vscode.ExtensionContext, definition: BuildToolDefinition): xpmInstallType {
  return new Promise((resolve, reject) => {

    if (!_.has(definition, 'installation.xpm')) {
      reject(new Error('Could not install using xpm'));
      return;
    }
    const pathToSaveTo = context.globalStoragePath;
    const env = process.env;
    _.set(env, 'XPACKS_SYSTEM_FOLDER', pathToSaveTo);
    _.set(env, 'XPACKS_REPO_FOLDER', pathToSaveTo);
    const execOptions = {
      env,
    };
    exec(`npx xpm install --global ${definition.installation.xpm}`, execOptions, (error, _stdout, stderr) => {
      console.log(`tool: ${definition.name}`);
      if (stderr || error) {
        reject(new Error(stderr));
        return;
      }
      resolve();
    });
  });
}

/**
 * Installs openocd using xpm
 * @param context vscode extension context
 */
export function installOpenOcd(context: vscode.ExtensionContext): xpmInstallType {
  return xpmInstall(context, openocdDefinition);
}
/**
 * Installs make using xpm
 * @param context vscode extension context
 */
export function installMake(context: vscode.ExtensionContext): xpmInstallType {
  return xpmInstall(context, makeDefinition);
}
/**
 * Installs cmake using xpm
 * @param context vscode extension context
 */
export function installCMake(context: vscode.ExtensionContext): xpmInstallType {
  return xpmInstall(context, cMakeDefinition);
}
/**
 * Installs arm-none-eabi tool chain using xpm
 * @param context vscode extension context
 */
export function installArmNonEabi(context: vscode.ExtensionContext): xpmInstallType {
  return xpmInstall(context, armNoneEabiDefinition);
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
export function getPlatformSpecificNodeLink(latestNodeBody: string, platform: NodeJS.Platform, arch: string): string | null {
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
      // console.log('axios response', response.data);
      const latestLink = getPlatformSpecificNodeLink(response.data, process.platform, process.arch);
      if (latestLink) {
        resolve(`${latestLink}`);
      } else {
        reject(
          new Error(
            'No link found for this specific platform, please open a new issue to ask for support for your specific platform at: https://github.com/bmd-studio/stm32-for-vscode/issues'
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
export function extractFile(filePath: string, outPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(unzipper.Extract({ path: outPath })).on('close', () => {
        resolve(outPath);
      }).on('error', (error) => {
        reject(error);
      });
  });
}

// TODO: create a clean-up function
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
      const extractedNodeFileLoc = await extractFile(latestNodeCompressed, path.join(context.globalStoragePath, 'node'));
      const dirContents = await vscode.workspace.fs.readDirectory(vscode.Uri.file(extractedNodeFileLoc));
      const nodeInstallationFilePath = _.find(dirContents, (file) => { return (file[0].indexOf('node') >= 0); });
      if (!nodeInstallationFilePath || !nodeInstallationFilePath[0]) {
        reject(new Error('No node installation could be found after download and extraction'));
        return;
      }
      resolve(path.join(extractedNodeFileLoc, nodeInstallationFilePath[0]));
    } catch (error) {
      vscode.window.showErrorMessage(`An error occurred during the node installation process, please try again or create an issue at: ${GITHUB_ISSUES_URL}, with stating error: ${error}`);
      reject(error);
    }
  });
}