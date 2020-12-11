import * as _ from 'lodash';
import * as path from 'path';
import * as process from 'process';
import * as shelljs from 'shelljs';
import * as vscode from 'vscode';
import axios from 'axios';
import * as unzipper from 'unzipper';
import * as fs from 'fs';

import {
  BuildToolDefinition,
  armNoneEabiDefinition,
  cMakeDefinition,
  makeDefinition,
  openocdDefinition
} from './toolChainDefinitions';

import { checkBuildTools } from '.';
import { exec } from 'child_process';
import { ExtensionContext } from 'vscode';
import {GITHUB_ISSUES_URL} from '../Definitions';

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

export function installOpenOcd(context: vscode.ExtensionContext): xpmInstallType {
  return xpmInstall(context, openocdDefinition);
}

export function installMake(context: vscode.ExtensionContext): xpmInstallType {
  return xpmInstall(context, makeDefinition);
}

export function installCMake(context: vscode.ExtensionContext): xpmInstallType {
  return xpmInstall(context, cMakeDefinition);
}

export function installArmNonEabi(context: vscode.ExtensionContext): xpmInstallType {
  return xpmInstall(context, armNoneEabiDefinition);
}

export function getNodeInstallation(context: vscode.ExtensionContext): Promise<string> {
  const standardNodePath = shelljs.which('node');
  if (standardNodePath) {
    return Promise.resolve(standardNodePath);
  }
  const pathToSaveTo = context.globalStoragePath;
  const downloadPath = path.posix.join(pathToSaveTo, 'tmp');
  const nodePath = path.posix.join(pathToSaveTo, 'node');
  return new Promise((resolve, reject) => {
    // curl.get('https://nodejs.org/dist/latest/', (err, response, body) => {
    //   console.log('body')
    // });
    const pkgRegex = /href="(node-v\d*.\d*.\d*.pkg)/gm;
    const win32Regex = /href="(node-v\d*.\d*.\d*-win-x86.zip)/gm;
    //TODO: use zip here to install and download node.
    if (shelljs.which('curl')) {
      exec(
        `curl "https://nodejs.org/dist/latest/node-\${VERSION: -$(wget - qO - https://nodejs.org/dist/latest/ | sed -nE 's|.*>node-(.*)\\.pkg</a>.*|\\1|p')}.pkg" > "${downloadPath}/node-latest.pkg" && sudo installer -store -pkg "${downloadPath}/node-latest.pkg" -target "${nodePath}" | bash`,
        (error, _stdout, stderr) => {
          if (stderr || error) {
            reject(new Error(stderr));
            return;
          }
          console.log(`downloaded the latest version of node to ${downloadPath}`);
          resolve(nodePath);
        }
      );
    }
    // curl is assumed for linux and osx. So there should only be an alternative for windows.

  });

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
  const platformRegex =_.cloneDeep( _.get(nodeRegex, `${platform}.${arch}`, null));
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

export function getLatestNodeLink(_context: vscode.ExtensionContext): Promise<string> {
  
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

export function downloadLatestNode(context: vscode.ExtensionContext, fileDownloadName: string): Promise<string> {
  const pathToSaveTo = context.globalStoragePath;
  // FIXME: should convert take the filename from the getLatestNodeLink
  const downloadURL = `${nodeLatestURL}${fileDownloadName}`;
  const downloadPath = path.join(pathToSaveTo, 'tmp', fileDownloadName);
  const nodePath = path.join(pathToSaveTo, 'node');
  console.log('starting download', fileDownloadName, downloadPath);
  return new Promise((resolve, reject) => {

    axios.get(downloadURL, {responseType: 'arraybuffer'}).then((response) => {
      console.log('gotten response', response.headers, typeof response.data, response.data.length);
      const file = Buffer.from(response.data, 0, response.data.length);
      // const fileBlob = new Blob([response.data]);
      vscode.workspace.fs.writeFile(vscode.Uri.file(downloadPath),response.data).then(() => {
        console.log('written file to', downloadPath);
        resolve(downloadPath);
      }, (error) => {
        console.log('download failed');
        reject(error);
      });
    }).catch(err => reject(err));
  });
}
export function extractFile(context: vscode.ExtensionContext, filePath: string): Promise<string> {
  const pathToSaveTo = context.globalStoragePath;
  const nodePath = path.join(pathToSaveTo, 'node');
  const name = '';
  // const filePathWithoutFilename = filePath.replace(/\/g, '/');
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(unzipper.Extract({ path: nodePath })).on('close', () => {
        console.log('extracted file at', nodePath);
        resolve(nodePath);
      }).on('error', (error) => {
        console.error(error);
        reject(error);
      }).on('data', (chunk) => {
        console.log('chunk');
        console.log(chunk);
      });
  });
}
/**
 * Function for downloading and extracting a new latest node version
 * @param context vscode context
 */
export function getNode(context: vscode.ExtensionContext): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const latestNodeLink = await getLatestNodeLink(context);
      const latestNodeCompressed = await downloadLatestNode(context, latestNodeLink);
      const extractedNodeFileLoc = await extractFile(context, latestNodeCompressed);
      const dirContents = await vscode.workspace.fs.readDirectory(vscode.Uri.file(extractedNodeFileLoc));
      const nodeInstallationFilePath = _.find(dirContents, (file) => {return (file[0].indexOf('node') >= 0 );});
      if(!nodeInstallationFilePath || !nodeInstallationFilePath[0]) {
        reject(new Error('No node installation could be found after download and extraction'));
        return;
      } 
      resolve(path.join(extractedNodeFileLoc, nodeInstallationFilePath[0]));
    } catch(error) {
      vscode.window.showErrorMessage(`An error occurred during the node installation process, please try again or create an issue at: ${GITHUB_ISSUES_URL}, with stating error: ${error}`);
      reject(error);
    }
  });
}