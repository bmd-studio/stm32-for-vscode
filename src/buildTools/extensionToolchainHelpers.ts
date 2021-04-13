import * as _ from 'lodash';
import * as path from 'path';
import * as shelljs from 'shelljs';
import * as vscode from 'vscode';

import {
  BuildToolDefinition,
  XPACKS_DEV_TOOL_PATH,
  armNoneEabiDefinition
} from './toolChainDefinitions';

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

/**
 * return the xpm path for the specified tool e.g ...../bmd.stm32-for-vscode/@xpack-dev-tools/openocd
 * @param tool The tool for which the paths needs to be found
 * @param xpmPath The path to the xpm install location e.g. context.globalStoragePath
 */
export function getToolBasePath(tool: BuildToolDefinition, xpmPath: string): string {
  return path.join(xpmPath, XPACKS_DEV_TOOL_PATH, tool.xpmName);
}
export function getToolVersionFolders(
  tool: BuildToolDefinition, xpmPath: string): Promise<[string, vscode.FileType][] | null> {
  return new Promise((resolve) => {
    if (!tool.xpmName) {
      resolve(null);
      return;
    }
    const toolPath = vscode.Uri.file(getToolBasePath(tool, xpmPath));
    vscode.workspace.fs.readDirectory(toolPath).then((files) => {
      resolve(files);
    }, () => {

      resolve(null);
    });
  });
}

/**
 * Function which returns 
 * @param tool build tool defintion
 * @param xpmPath the path to which the xpm install was performed.
 * @returns 
 */
export async function getNewestToolchainVersion(
  tool: BuildToolDefinition, xpmPath: string
): Promise<XPMToolVersion | undefined> {
  try {
    const files = await getToolVersionFolders(tool, xpmPath);
    if (!files) {
      return undefined;
    }
    let newest: XPMToolVersion | null = null;
    files.map((file) => {
      const [fileName, fileType] = file;
      if (fileType === vscode.FileType.Directory) {
        newest = compareVersions(newest, parseXPMVersionNumbers(fileName));
      }
    });
    if (!newest || !isVersionFile(newest)) {
      throw new Error('no tool found');
    }
    return newest;
  } catch (err) {
    throw err;
  }
}

export async function validateXPMToolchainPath(tool: BuildToolDefinition, xpmPath: string): Promise<string | boolean> {
  try {
    const value = await getNewestToolchainVersion(tool, xpmPath);
    if (!value || _.isBoolean(value)) {
      return false;
    }
    const versionPath = path.join(xpmPath, XPACKS_DEV_TOOL_PATH, tool.xpmName, value.fileName);
    const toolPath = path.join(versionPath, tool.xpmPath);
    const fullPath = path.join(toolPath, tool.standardCmd);
    const shellPath = shelljs.which(fullPath);
    if (checkSettingsPathValidity(shellPath)) {
      if (tool.name === armNoneEabiDefinition.name) {
        return toolPath;
      }
      return shellPath;
    }
    return false;
  } catch (err) {
    return false;
  }
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

export function checkToolchainPathForTool(
  toolPath: string | boolean,
  definition: BuildToolDefinition
): string | boolean {
  if (!checkSettingsPathValidity(toolPath)) {
    return false;
  }
  const regularPath = shelljs.which(toolPath);
  if (checkSettingsPathValidity(regularPath)) {
    return regularPath;
  }
  // after this check the path with the standard command
  if (_.isString(toolPath)) {
    const standardCommandPath = shelljs.which(path.join(toolPath, definition.standardCmd));
    if (checkSettingsPathValidity(standardCommandPath)) {
      return standardCommandPath;
    }
    // after this check the path with the non standard commands
    let nonStandardPath = false;
    _.forEach(definition.otherCmds, (entry) => {
      const tryPath = path.join(toolPath, entry);
      const whichedTryPath = shelljs.which(tryPath);
      if (checkSettingsPathValidity(whichedTryPath)) {
        nonStandardPath = whichedTryPath;
      }
    });
    if (nonStandardPath) {
      return nonStandardPath;
    }
  }
  return false;
}