import * as _ from 'lodash';
import * as definition from '../Definitions';
import * as path from 'path';
import * as process from 'process';
import * as shelljs from 'shelljs';
import * as vscode from 'vscode';

import { armNoneEabiDefinition, makeDefinition, openocdDefinition } from './toolChainDefinitions';
import {
  checkSettingsPathValidity,
  getNewestToolchainVersion,
  validateArmToolchainPath,
  validateXPMToolchainPath
} from './extensionToolchainHelpers';

import { ToolChain } from '../types/MakeInfo';
import getExtensionSettings from '../getInfo/getSettings';

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
export async function checkAutomaticallyInstalledBuildTools(
  settingsToolchain: ToolChain,
  context: vscode.ExtensionContext
): Promise<ToolChain> {
  // arm none eabi
  if (!settingsToolchain.armToolchainPath) {
    // TODO: should use the extensionToolChainHelpers and validateToolchain functions
    console.log('globalStoragePath', context.globalStoragePath);
    // const result = await getNewestToolchainVersion(armNoneEabiDefinition, context.globalStoragePath);
    const armToolchainPath = await validateXPMToolchainPath(armNoneEabiDefinition, context.globalStoragePath);
    if ((checkSettingsPathValidity(armToolchainPath))) {
      settingsToolchain.armToolchainPath = armToolchainPath;
    }
    console.log('arm toolchain path', armToolchainPath);
  }
  // OpenOCD
  if (!settingsToolchain.openOCDPath) {
    const openOCDPath = await validateXPMToolchainPath(openocdDefinition, context.globalStoragePath);
    if (checkSettingsPathValidity(openOCDPath)) {
      settingsToolchain.openOCDPath = openOCDPath;
    }
    console.log('openOCDPath', openOCDPath);
  }

  // make should not be checked for now except for windows. The others ones should have it in PATH
  // only windows make can be installed through xpm
  // TODO: test out ninja for embedded builds, might be nice to replace make with 
  if (!settingsToolchain.makePath && process.platform === 'win32') {
    const makePath = await validateXPMToolchainPath(makeDefinition, context.globalStoragePath);
    if (checkSettingsPathValidity(makePath)) {
      settingsToolchain.makePath = makePath;
    }
    console.log('makePath', makePath);
  }

  // TODO: add cmake once the time comes to integrate testing frameworks. (Also when wanting to build with ninja)


  return Promise.resolve(settingsToolchain);
}

