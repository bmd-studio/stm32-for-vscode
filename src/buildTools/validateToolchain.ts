import * as _ from 'lodash';
import * as definition from '../Definitions';
import * as path from 'path';
import * as shelljs from 'shelljs';
import * as vscode from 'vscode';

import { ToolChain } from '../types/MakeInfo';
import getExtensionSettings from '../getInfo/getSettings';

export function checkSettingsPathValidity(path: string | boolean): boolean {
  if (path && _.isString(path) && !_.isEmpty(path)) {
    return true;
  }
  return false;
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


/*
 * The steps for validating the toolchain are as follows
 * 1. Check settings paths
 * 2. Check for automatically installed tools by STM32 for VSCode
 * 3. Check the pre-installed tool paths 
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
    const makePath: string = shelljs.which(settings.makePath);
    if (checkSettingsPathValidity(makePath)) {
      settingsToolchain.makePath = makePath;
    }
  }

  // openOCD
  if (checkSettingsPathValidity(settings.openOCDPath)) {
    const openOCDPath: string = shelljs.which(settings.openOCDPath);
    if (checkSettingsPathValidity(openOCDPath)) {
      settingsToolchain.makePath = openOCDPath;
    }
  }
  return settingsToolchain;
}

/**
 * Checks if the setting is already there and if not tries to check pre installed locations
 * @param settingsToolchain 
 */
export function checkAutomaticallyInstalledBuildTools(settingsToolchain: ToolChain): ToolChain {
  // arm none eabi
  if (!settingsToolchain.armToolchainPath) {
    // TODO: should use the extensionToolChainHelpers and validateToolchain functions
  }

  return settingsToolchain;
}



