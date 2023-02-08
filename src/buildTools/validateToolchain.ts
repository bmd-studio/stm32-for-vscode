import * as process from 'process';
import * as vscode from 'vscode';
import { dirname, join } from 'path';
import which from 'which';

import BUILD_TOOL_DEFINITIONS, { armNoneEabiDefinition, makeDefinition, openocdDefinition } from './toolChainDefinitions';
import {
  checkSettingsPathValidity,
  checkToolchainPathForTool,
  validateArmToolchainPath,
  validateXPMToolchainPath
} from './extensionToolchainHelpers';
import { forEach, get, set } from 'lodash';

import { ToolChain } from '../types/MakeInfo';
import { getExtensionSettings } from '../getInfo/getSettings';

/**
 *  Checks a list of key values pairs to see if they return a path for which.
 *  @param executablesToCheck: An object where the keys are paths to exectables e.g. {armNoneEabi: 'arm-none-eabi-gcc'}
 *  @returns  returns and object with the original keys 
 *  however the value is undefined when no path is found or the found path if found
 */
async function executablesWhichCheck(
  executablesToCheck: Record<string, string | undefined>
): Promise<Record<string, string | undefined>> {
  const checks = Object.entries(executablesToCheck).map(async ([key, value]) => {
    // check if value is defined if so check with which otherwise return undefined
    const result = !value ? undefined : await which(value, { nothrow: true });
    return [key, !result ? undefined : result];
  });
  const checkResults = await Promise.all(checks);
  return Object.fromEntries(checkResults);
}

/*
 * The steps for validating the toolchain are as follows
 * 1. Check settings paths
 * 2. Check for automatically installed tools by STM32 for VSCode
 * 3. Check the pre-installed tool paths in PATH 
*/
export async function getBuildTools(): Promise<Record<string, string | undefined>> {
  const settings = getExtensionSettings();
  const settingsExecutables = {
    // TODO: create a function to append the standard command to the end or return undefined.
    armNoneEabi: typeof settings.armToolchainPath === 'boolean' ? undefined :
      join(settings.armToolchainPath, BUILD_TOOL_DEFINITIONS.armNoneEabi.standardCmd),

  };
}



/*
 * The steps for validating the toolchain are as follows
 * 1. Check settings paths
 * 2. Check for automatically installed tools by STM32 for VSCode
 * 3. Check the pre-installed tool paths 
*/
/**
 * Function for retrieving the settings and checking if the build tools are valid.
 */
export function checkSettingsForBuildTools(): ToolChain {
  const settingsToolchain = new ToolChain();  // has standard all paths to false
  const settings = getExtensionSettings();
  // arm none eabi
  if (checkSettingsPathValidity(settings.armToolchainPath)) {
    const armPath = validateArmToolchainPath(settings.armToolchainPath);
    if (armPath) {
      settingsToolchain.armToolchainPath = armPath;
    }
  }

  // make command
  if (checkSettingsPathValidity(settings.makePath)) {
    const makePath: string | boolean = checkToolchainPathForTool(settings.makePath, makeDefinition);
    if (checkSettingsPathValidity(makePath)) {
      settingsToolchain.makePath = makePath;
    }
  }

  // openOCD
  if (checkSettingsPathValidity(settings.openOCDPath)) {
    const openOCDPath: string | boolean = checkToolchainPathForTool(settings.openOCDPath, openocdDefinition);
    if (checkSettingsPathValidity(openOCDPath)) {
      settingsToolchain.openOCDPath = openOCDPath;
    }
  }
  return settingsToolchain;
}

export function compareAndUpdateMissingBuildTools(startSettings: ToolChain, additionalSettings: ToolChain): ToolChain {
  const newSettings = { ...startSettings };

  forEach(startSettings, (setting, key) => {
    if (!setting) {
      set(newSettings, key, get(additionalSettings, key));
    }
  });
  return newSettings;
}


/**
 * Checks if the setting is already there and if not tries to check pre installed locations
 * @param settingsToolchain 
 */
export async function checkAutomaticallyInstalledBuildTools(
  toolsStoragePath: vscode.Uri
): Promise<ToolChain> {
  const installedBuildTools = new ToolChain();
  // arm none eabi
  const armToolchainPath = await validateXPMToolchainPath(armNoneEabiDefinition, toolsStoragePath.fsPath);
  if ((checkSettingsPathValidity(armToolchainPath))) {
    installedBuildTools.armToolchainPath = armToolchainPath;
  }
  // OpenOCD
  const openOCDPath = await validateXPMToolchainPath(openocdDefinition, toolsStoragePath.fsPath);
  if (checkSettingsPathValidity(openOCDPath)) {
    installedBuildTools.openOCDPath = openOCDPath;
  }

  // make should not be checked for now except for windows. The others ones should have it in PATH
  // only windows make can be installed through xpm
  if (process.platform === 'win32') {
    const makePath = await validateXPMToolchainPath(makeDefinition, toolsStoragePath.fsPath);
    if (checkSettingsPathValidity(makePath)) {
      installedBuildTools.makePath = makePath;
    }
  }
  return Promise.resolve(installedBuildTools);
}

/**
 * Checks if missing buildTools in the settingsToolchain are in path
 * @param settingsToolchain toolchain to check when values are false it will check if the tools are in path
 */
export function checkBuildToolsInPath(): ToolChain {
  const pathToolchain = new ToolChain();
  const armShellPath = shelljs.which(armNoneEabiDefinition.standardCmd);
  if (checkSettingsPathValidity(armShellPath)) {
    // for some weird reason the shellPath gets rejected when I do not toString() it
    const armDirectory = path.dirname(armShellPath.toString());
    pathToolchain.armToolchainPath = armDirectory;
  }
  // OpenOCD
  const openocdShellPath = shelljs.which(openocdDefinition.standardCmd);
  if (checkSettingsPathValidity(openocdShellPath)) {
    pathToolchain.openOCDPath = openocdShellPath;
  }
  // make
  const makeShellPath = shelljs.which(makeDefinition.standardCmd);
  if (checkSettingsPathValidity(makeShellPath)) {
    pathToolchain.makePath = makeShellPath;
  }
  return pathToolchain;
}

/**
 * Function for giving a boolean answer to the question are the required toolchain items present
 * @param settingsToolchain checks if al required toolchain items are present
 */
export function hasRelevantBuildTools(settingsToolchain: ToolChain): boolean {
  // for now leave cMake out of this
  if (settingsToolchain.armToolchainPath
    && settingsToolchain.makePath
    && settingsToolchain.openOCDPath
  ) {
    return true;
  }
  return false;
}

export function hasRelevantAutomaticallyInstalledBuildTools(settingsToolchain: ToolChain): boolean {
  let hasMakeForWindows = process.platform === 'win32' ? settingsToolchain.makePath : true;
  if (!hasMakeForWindows) {
    const systemMakepath = shelljs.which('make');
    if (systemMakepath) {
      hasMakeForWindows = true;
      settingsToolchain.makePath = systemMakepath;
    }
  }
  if (settingsToolchain.armToolchainPath
    && settingsToolchain.openOCDPath
    && hasMakeForWindows
  ) {
    return true;
  }
  return false;
}
