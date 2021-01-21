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
import { getWorkspaceSettings } from '../getInfo/getSettings';

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
  const settings = getWorkspaceSettings();
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

/**
 * Checks if the setting is already there and if not tries to check pre installed locations
 * @param settingsToolchain 
 */
export async function checkAutomaticallyInstalledBuildTools(
  settingsToolchain: ToolChain,
  context: vscode.ExtensionContext
): Promise<ToolChain> {
  // arm none eabi
  if (!settingsToolchain.armToolchainPath) {
    // TODO: should use the extensionToolChainHelpers and validateToolchain functions
    // const result = await getNewestToolchainVersion(armNoneEabiDefinition, context.globalStoragePath);
    const armToolchainPath = await validateXPMToolchainPath(armNoneEabiDefinition, context.globalStoragePath);
    if ((checkSettingsPathValidity(armToolchainPath))) {
      settingsToolchain.armToolchainPath = armToolchainPath;
    }
  }
  // OpenOCD
  if (!settingsToolchain.openOCDPath) {
    const openOCDPath = await validateXPMToolchainPath(openocdDefinition, context.globalStoragePath);
    if (checkSettingsPathValidity(openOCDPath)) {
      settingsToolchain.openOCDPath = openOCDPath;
    }
  }

  // make should not be checked for now except for windows. The others ones should have it in PATH
  // only windows make can be installed through xpm
  if (!settingsToolchain.makePath && process.platform === 'win32') {
    const makePath = await validateXPMToolchainPath(makeDefinition, context.globalStoragePath);
    if (checkSettingsPathValidity(makePath)) {
      settingsToolchain.makePath = makePath;
    }
  }

  // Cmake
  if (!settingsToolchain.cMakePath) {
    const cMakePath = await validateXPMToolchainPath(cMakeDefinition, context.globalStoragePath);
    if (checkSettingsPathValidity(cMakePath)) {
      settingsToolchain.cMakePath = cMakePath;
    }
  }

  return Promise.resolve(settingsToolchain);
}

/**
 * Checks if missing buildTools in the settingsToolchain are in path
 * @param settingsToolchain toolchain to check when values are false it will check if the tools are in path
 */
export function checkBuildToolsInPath(settingsToolchain: ToolChain): ToolChain {
  if (!settingsToolchain.armToolchainPath) {
    const shellPath = shelljs.which(armNoneEabiDefinition.standardCmd);
    if (checkSettingsPathValidity(shellPath)) {
      // for some weird reason the shellPath gets rejected when I do not toString() it
      const armDirectory = path.dirname(shellPath.toString());
      settingsToolchain.armToolchainPath = armDirectory;
    }
  }
  // OpenOCD
  if (!settingsToolchain.openOCDPath) {
    const shellPath = shelljs.which(openocdDefinition.standardCmd);
    if (checkSettingsPathValidity(shellPath)) {
      settingsToolchain.openOCDPath = shellPath;
    }
  }
  if (!settingsToolchain.makePath) {
    const shellPath = shelljs.which(makeDefinition.standardCmd);
    if (checkSettingsPathValidity(shellPath)) {
      settingsToolchain.makePath = shellPath;
    }
  }
  if (!settingsToolchain.cMakePath) {
    const shellPath = shelljs.which(cMakeDefinition.standardCmd);
    if (checkSettingsPathValidity(shellPath)) {
      settingsToolchain.cMakePath = shellPath;
    }
  }

  return settingsToolchain;
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