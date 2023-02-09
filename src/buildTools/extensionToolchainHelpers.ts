import { join, normalize } from 'path';
import * as vscode from 'vscode';
import which from 'which';

import {
  BuildToolDefinition,
  XPACKS_DEV_TOOL_PATH,
  armNoneEabiDefinition
} from './toolChainDefinitions';
import { forEach, isBoolean, isEmpty, isString } from 'lodash';

export interface XPMToolVersion {
  toolVersion: number[];
  xpmVersion: number[];
  fileName: string;
}

export function checkSettingsPathValidity(path: string | undefined): string | undefined {
  if (path && isString(path) && !isEmpty(path)) {
    return path;
  }
  return undefined;
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
  return join(xpmPath, XPACKS_DEV_TOOL_PATH, tool.xpmName);
}
export async function getToolVersionFolders(
  tool: BuildToolDefinition, xpmPath: string): Promise<[string, vscode.FileType][] | null> {
  if (!tool.xpmName) {
    return null;
  }
  const toolPath = vscode.Uri.file(getToolBasePath(tool, xpmPath));
  try {
    const files = await vscode.workspace.fs.readDirectory(toolPath);
    return files;
  } catch (err) {
    return null;
  }
}

/**
 * Function which returns 
 * @param tool build tool definition
 * @param xpmPath the path to which the xpm install was performed.
 * @returns 
 */
export async function getNewestToolchainVersion(
  tool: BuildToolDefinition, xpmPath: string
): Promise<XPMToolVersion | undefined> {

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
}

/**
 * validates the xpm installed extension
 * @param tool: the XPM definition of the build tool found in toolChainDefinitions.ts
 * @param xpmInstallationDirectory: the installation directory for XPM 
 */
export async function validateXPMToolchainPath(
  tool: BuildToolDefinition,
  xpmInstallationDirectory: string
): Promise<string | undefined> {
  try {
    const value = await getNewestToolchainVersion(tool, xpmInstallationDirectory);
    if (!value || isBoolean(value)) {
      return undefined;
    }
    const versionPath = join(xpmInstallationDirectory, XPACKS_DEV_TOOL_PATH, tool.xpmName, value.fileName);
    const toolPath = join(versionPath, tool.xpmPath);
    const fullPath = join(toolPath, tool.standardCmd);
    const shellPath = (await which(fullPath, { nothrow: true })) || undefined;
    if (checkSettingsPathValidity(shellPath)) {
      if (tool.name === armNoneEabiDefinition.name) {
        return toolPath;
      }
      return shellPath;
    }
    return undefined;
  } catch (err) {
    return undefined;
  }
}
