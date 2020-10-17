import * as _ from 'lodash';
import * as path from 'path';
import * as process from 'process';
import * as shelljs from 'shelljs';
import * as vscode from 'vscode';

import {
  BuildToolDefinition,
  armNoneEabiDefinition,
  cMakeDefinition,
  makeDefinition,
  openocdDefinition
} from './toolChainDefinitions';

import { checkBuildTools } from '.';
import curl from 'curl';
import { exec } from 'child_process';
import { resolve } from 'dns';

type xpmInstallType = Promise<void>;

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
          resolve(nodePath);
        }
      );
    }
    // curl is assumed for linux and osx. So there should only be an alternative for windows.

  });

}