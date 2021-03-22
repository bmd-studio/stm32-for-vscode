import * as _ from 'lodash';
import * as definition from '../Definitions';
import * as path from 'path';
import * as process from 'process';
import * as shelljs from 'shelljs';
import * as vscode from 'vscode';

import { armNoneEabiDefinition, cMakeDefinition, makeDefinition, openocdDefinition } from './toolChainDefinitions';
import {
  checkSettingsPathValidity,
  checkToolchainPathForTool,
  getNewestToolchainVersion,
  validateArmToolchainPath,
  validateXPMToolchainPath
} from './extensionToolchainHelpers';

import { ToolChain } from '../types/MakeInfo';
import { getExtensionSettings } from '../getInfo/getSettings';
import { add } from 'lodash';

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
  if (checkSettingsPathValidity(settings.cMakePath)) {
    const cMakePath: string | boolean = checkToolchainPathForTool(settings.cMakePath, cMakeDefinition);
    if (checkSettingsPathValidity(cMakePath)) {
      settingsToolchain.cMakePath = cMakePath;
    }
  }
  return settingsToolchain;
}

export function compareAndUpdateMissingBuildTools(startSettings: ToolChain, additionalSettings: ToolChain): ToolChain {
  const newSettings = _.cloneDeep(startSettings);

  _.forEach(startSettings, (setting, key) => {
    if(!setting) {
      _.set(newSettings, key, _.get(additionalSettings, key));
    }
  });
  return newSettings;
}


/**
 * Checks if the setting is already there and if not tries to check pre installed locations
 * @param settingsToolchain 
 */
export async function checkAutomaticallyInstalledBuildTools(
  context: vscode.ExtensionContext
): Promise<ToolChain> {
  const installedBuildTools = new ToolChain();
  // arm none eabi
  const armToolchainPath = await validateXPMToolchainPath(armNoneEabiDefinition, context.globalStoragePath);
  if ((checkSettingsPathValidity(armToolchainPath))) {
    installedBuildTools.armToolchainPath = armToolchainPath;
  }
  // OpenOCD
  const openOCDPath = await validateXPMToolchainPath(openocdDefinition, context.globalStoragePath);
  if (checkSettingsPathValidity(openOCDPath)) {
    installedBuildTools.openOCDPath = openOCDPath;
  }

  // make should not be checked for now except for windows. The others ones should have it in PATH
  // only windows make can be installed through xpm
  if (process.platform === 'win32') {
    const makePath = await validateXPMToolchainPath(makeDefinition, context.globalStoragePath);
    if (checkSettingsPathValidity(makePath)) {
      installedBuildTools.makePath = makePath;
    }
  }
  // TODO: add this once I integrate testing
  // Cmake
  // if (!settingsToolchain.cMakePath) {
  //   const cMakePath = await validateXPMToolchainPath(cMakeDefinition, context.globalStoragePath);
  //   if (checkSettingsPathValidity(cMakePath)) {
  //     settingsToolchain.cMakePath = cMakePath;
  //   }
  // }

  return Promise.resolve(installedBuildTools);
}

/**
 * Checks if missing buildTools in the settingsToolchain are in path
 * @param settingsToolchain toolchain to check when values are false it will check if the tools are in path
 */
export function checkBuildToolsInPath(): ToolChain {
  const  pathToolchain = new ToolChain();
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
  // cmake
  const cmakeShellPath = shelljs.which(cMakeDefinition.standardCmd);
  if (checkSettingsPathValidity(cmakeShellPath)) {
    pathToolchain.cMakePath = cmakeShellPath;
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