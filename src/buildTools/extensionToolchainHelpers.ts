import * as _ from 'lodash';
import * as path from 'path';
import * as shelljs from 'shelljs';
import * as vscode from 'vscode';

import { BuildToolDefinition, INSTALLATION_PATH, TOOL_FOLDER_PATH, XPACKS_DEV_TOOL_PATH } from './toolChainDefinitions';

import { armNoneEabiDefinition } from '../Requirements';

export interface XPMToolVersion {
  toolVersion: number[];
  xpmVersion: number[];
  fileName: string;
}

export function checkSettingsPathValidity(path: string | boolean): boolean {
  if (path && _.isString(path) && !_.isEmpty(path)) {
    return true;
  }
  return false;
}


export function parseXPMVersionNumbers(fileName: string): XPMToolVersion {
  const [toolVersion = '', xpmVersion = ''] = fileName.split('-');
  const [major = 0, middle = 0, minor = 0] = toolVersion.split('.').map((number) => {
    return parseInt(number);
  });
  const [xpmMajor, xpmMiddle = 0, xpmMinor = 0] = xpmVersion.split('.').map((number) => {
    return parseInt(number);
  });
  return {
    toolVersion: [major, middle, minor],
    xpmVersion: [xpmMajor, xpmMiddle, xpmMinor],
    fileName,
  };
}

export function isVersionFile(version: XPMToolVersion): boolean {
  const toolVersions = version.toolVersion;
  if (toolVersions[0] === 0 && toolVersions[1] === 0 && toolVersions[2] === 0) {
    return false;
  }
  return true;
}

export function compareVersions(version1: XPMToolVersion | null, version2: XPMToolVersion): XPMToolVersion {
  if (!version1) { return version2; }
  // check the main tool version
  for (let i = 0; i < version1.toolVersion.length; i++) {
    const version1Number = version1.toolVersion[i];
    const version2Number = version2.toolVersion[i];
    if (version1Number > version2Number) {
      return version1;
    }
    if (version1Number < version2Number) {
      return version2;
    }
  }

  // check the xpm tool version
  for (let i = 0; i < version1.xpmVersion.length; i++) {
    const version1Number = version1.xpmVersion[i];
    const version2Number = version2.xpmVersion[i];
    if (version1Number > version2Number) {
      return version1;
    }
    if (version1Number < version2Number) {
      return version2;
    }
  }
  return version1;
}



export function getNewestToolchainVersion(tool: BuildToolDefinition, xpmPath: string): Promise<XPMToolVersion | boolean> {
  return new Promise((resolve, reject) => {
    if (!tool.xpmName) {
      reject(new Error('No xpm name found in definition file'));
      return;
    }
    const toolPath = vscode.Uri.file(path.join(xpmPath, XPACKS_DEV_TOOL_PATH, tool.xpmName));
    vscode.workspace.fs.readDirectory(toolPath).then((files) => {
      if (!files) {
        reject(new Error('No files found'));
        return;
      }
      let newest: XPMToolVersion | null = null;
      files.map((file) => {
        const [fileName, fileType] = file;
        if (fileType === vscode.FileType.Directory) {
          newest = compareVersions(newest, parseXPMVersionNumbers(fileName));
        }
      });
      if (!newest || !isVersionFile(newest)) {
        reject(new Error('no tool found'));
        return;
      }
      resolve(newest);
    }, (error) => {
      console.error(error);
    });
  });
}

export function validateXPMToolchainPath(tool: BuildToolDefinition, xpmPath: string): Promise<string | boolean> {
  return new Promise((resolve) => {
    getNewestToolchainVersion(tool, xpmPath).then((value) => {
      if (!value || _.isBoolean(value)) {
        resolve(false);
        return;
      }
      const versionPath = path.join(xpmPath, XPACKS_DEV_TOOL_PATH, tool.xpmName, value.fileName);
      const toolPath = path.join(versionPath, tool.xpmPath);
      const fullPath = path.join(toolPath, tool.standardCmd);
      const shellPath = shelljs.which(fullPath);
      if (checkSettingsPathValidity(shellPath)) {
        if (tool.name === armNoneEabiDefinition.name) {
          resolve(toolPath);
          return;
        }
        resolve(shellPath);
      }
      resolve(false);
    }).catch((error) => {
      console.error(error);
      resolve(false);
    });
  });
}


export function validateArmToolchainPath(armToolChainPath: string | boolean): string | false {
  if (!armToolChainPath || _.isEmpty(armToolChainPath) || !_.isString(armToolChainPath)) { return false; }
  const immediatePath = shelljs.which(armToolChainPath);
  let armPath: string | false = false;
  if (immediatePath) {
    armPath = path.normalize(path.join(immediatePath, '..'));
  } else {
    const appendedArmPath = path.normalize(path.join(armToolChainPath, 'arm-none-eabi-gcc'));
    if (shelljs.which(appendedArmPath)) {
      armPath = armToolChainPath;
    }
  }
  return armPath;
}


