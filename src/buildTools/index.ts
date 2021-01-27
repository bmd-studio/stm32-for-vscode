import * as toolChainValidation from './validateToolchain';
import * as vscode from 'vscode';
import * as _ from 'lodash';
import { ToolChain } from '../types/MakeInfo';


export function setCortexDebugSettingsInWorkspace(tools: ToolChain): void {
  const cortexDebugSetting = vscode.workspace.getConfiguration('cortex-debug');
  cortexDebugSetting.update('armToolchainPath', tools.armToolchainPath, vscode.ConfigurationTarget.Workspace);
  cortexDebugSetting.update('openocdPath', tools.openOCDPath,  vscode.ConfigurationTarget.Workspace);
}

/**
 * Checks build tools and updates settings accordingly. Priority of assignment is: 
 * highest: build tools in setting,
 * mid: build tools installed by the extension
 * low: build tools in path
 * @param context vscode extension context
 */
export async function checkBuildTools(context: vscode.ExtensionContext): Promise<boolean> {
  // const hasBuildTools = context.globalState.get('hasBuildTools');
  
  const settingBuildTools = toolChainValidation.checkSettingsForBuildTools();
  const pathBuildTools = toolChainValidation.checkBuildToolsInPath();
  const extensionInstalledTools = await toolChainValidation.checkAutomaticallyInstalledBuildTools(context);

  
  let finalBuildTools = toolChainValidation.compareAndUpdateMissingBuildTools(settingBuildTools, extensionInstalledTools);
  finalBuildTools = toolChainValidation.compareAndUpdateMissingBuildTools(finalBuildTools, pathBuildTools);


  // update settings when they are not in the settings e.g. after a deletion or an update.
  // Check will be performed at start-up and then for the rest of the extension lifetime
  // these settings will be used for compilation.
  const extensionSettings = vscode.workspace.getConfiguration('stm32-for-vscode');
  _.forEach(finalBuildTools, (toolPath, key) => {
    if(!_.isEqual(toolPath, _.get(settingBuildTools, key))) {
      extensionSettings.update(key,toolPath, vscode.ConfigurationTarget.Global);
    }
  });

  // check if all relevant build tools are present. If not a menu should be shown, where the user
  // has the option to install the build tools automatically
  const hasBuildTools = toolChainValidation.hasRelevantBuildTools(finalBuildTools);

  context.globalState.update('hasBuildTools', hasBuildTools);
  if(hasBuildTools) {
    setCortexDebugSettingsInWorkspace(finalBuildTools);
  }
  return Promise.resolve(hasBuildTools);
}

