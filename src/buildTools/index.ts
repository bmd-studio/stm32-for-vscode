import * as toolChainValidation from './validateToolchain';
import * as vscode from 'vscode';

export async function checkBuildTools(context: vscode.ExtensionContext): Promise<boolean> {
  const hasBuildTools = context.globalState.get('hasBuildTools');

  if (!hasBuildTools) {
    console.error('build tools are not present');
    // should run validation and if true update state.
  }
  let currentToolchain = toolChainValidation.checkSettingsForBuildTools();
  console.log('current toolchain from settings', currentToolchain);
  currentToolchain = await toolChainValidation.checkAutomaticallyInstalledBuildTools(currentToolchain, context);
  console.log('current Toolchain with build tools', currentToolchain);
  currentToolchain = toolChainValidation.checkBuildToolsInPath(currentToolchain);
  console.log('final toolchain check', currentToolchain);

  return Promise.resolve(toolChainValidation.hasRelevantBuildTools(currentToolchain));
}