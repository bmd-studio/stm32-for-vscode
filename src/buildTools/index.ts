import * as _ from 'lodash';
import * as path from 'path';
import * as toolChainValidation from './validateToolchain';
import * as vscode from 'vscode';

import { ToolChain } from '../types/MakeInfo';
import { which } from 'shelljs';

/**
 * Sets up cortex debug to work with the paths STM32 for VSCode is given in the settings.
 * @param tools object containing toolchain paths
 */
export function setCortexDebugSettingsInWorkspace(tools: ToolChain): void {
  const cortexDebugSetting = vscode.workspace.getConfiguration('cortex-debug');
  if (
    cortexDebugSetting.get('armToolchainPath')
    && cortexDebugSetting.get('armToolchainPath') !== tools.armToolchainPath
  ) {
    cortexDebugSetting.update('armToolchainPath', tools.armToolchainPath, vscode.ConfigurationTarget.Workspace);
  }
  if (cortexDebugSetting.get('openocdPath') && cortexDebugSetting.get('openocdPath') !== tools.openOCDPath) {
    cortexDebugSetting.update('openocdPath', tools.openOCDPath, vscode.ConfigurationTarget.Workspace);
  }
}

/**
 * Checks build tools and updates settings accordingly. Priority of assignment is:
 * highest: build tools in setting,
 * mid: build tools installed by the extension
 * low: build tools in path
 * @param context vscode extension context
 */
export async function checkBuildTools(context: vscode.ExtensionContext): Promise<boolean> {
  const settingBuildTools = toolChainValidation.checkSettingsForBuildTools();
  const pathBuildTools = toolChainValidation.checkBuildToolsInPath();
  const extensionInstalledTools = await toolChainValidation.checkAutomaticallyInstalledBuildTools(
    context.globalStorageUri,
  );

  let finalBuildTools = toolChainValidation.compareAndUpdateMissingBuildTools(
    settingBuildTools,
    extensionInstalledTools,
  );
  finalBuildTools = toolChainValidation.compareAndUpdateMissingBuildTools(finalBuildTools, pathBuildTools);

  // update settings when they are not in the settings e.g. after a deletion or an update.
  // Check will be performed at start-up and then for the rest of the extension lifetime
  // these settings will be used for compilation.
  const extensionSettings = vscode.workspace.getConfiguration('stm32-for-vscode');
  const globalSettingsUpdatePromises: Thenable<void>[] = [];
  _.forEach(finalBuildTools, (toolPath, key) => {
    if (!_.isEqual(toolPath, extensionSettings.get(key))) {
      globalSettingsUpdatePromises.push(extensionSettings.update(key, toolPath, vscode.ConfigurationTarget.Global));
    }
  });
  await Promise.all(globalSettingsUpdatePromises);
  // check if there is a local settings file and update if neccessary.
  // NOTE: settings should not be added or editted in the workspace for STM32 for vscode,
  // however old version of STM32 for VSCode did put it in the workspace folder
  const localUpdatePromises: Thenable<void>[] = [];
  if (vscode?.workspace?.workspaceFolders?.[0]) {
    const localSettingsPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.vscode', 'settings.json');

    const localExtensionSettings = vscode.workspace.getConfiguration(
      'stm32-for-vscode',
      vscode.Uri.file(localSettingsPath)
    );
    
    _.forEach(finalBuildTools, (toolPath, key) => {
      const localPath = localExtensionSettings.get(key);
      if (localPath === undefined) { return; }
      let localWhichPath = which(localPath);
      if (key === 'armToolchainPath') {
        localWhichPath = which(path.join(`${localPath}`, 'arm-none-eabi-gcc'));
      }
      if ((!_.isEqual(toolPath, localPath) && !localWhichPath) || !localPath) {
        localUpdatePromises.push(localExtensionSettings.update(key, toolPath, vscode.ConfigurationTarget.Workspace));
      }
    });
  }

  await Promise.all(localUpdatePromises);

  // check if all relevant build tools are present. If not a menu should be shown, where the user
  // has the option to install the build tools automatically
  const hasBuildTools = toolChainValidation.hasRelevantBuildTools(finalBuildTools);

  context.globalState.update('hasBuildTools', hasBuildTools);
  if (hasBuildTools) {
    setCortexDebugSettingsInWorkspace(finalBuildTools);
  }
  return Promise.resolve(hasBuildTools);
}

export function getBuildToolsFromSettings(): ToolChain {
  const extensionSettings = vscode.workspace.getConfiguration('stm32-for-vscode');
  const toolChain = new ToolChain();
  _.forEach(toolChain, (_value, key) => {
    _.set(toolChain, key, extensionSettings.get(key));
  });
  return toolChain;
}
