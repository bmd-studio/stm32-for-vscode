import * as toolChainValidation from './validateToolchain';
import * as vscode from 'vscode';

export async function checkBuildTools(context: vscode.ExtensionContext): Promise<boolean> {
  const hasBuildTools = context.globalState.get('hasBuildTools');

  if (!hasBuildTools) {
    console.error('build tools are not present');
    // should run validation and if true update state.
  }
  let currentToolchain = toolChainValidation.checkSettingsForBuildTools();
  currentToolchain = await toolChainValidation.checkAutomaticallyInstalledBuildTools(currentToolchain, context);
  console.log('current Toolchain', currentToolchain);
  return Promise.resolve(false);
}