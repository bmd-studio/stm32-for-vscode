import * as toolChainValidation from './validateToolchain';
import * as vscode from 'vscode';

export async function checkBuildTools(context: vscode.ExtensionContext): Promise<boolean> {
  // const hasBuildTools = context.globalState.get('hasBuildTools');

  let currentToolchain = toolChainValidation.checkSettingsForBuildTools();
  currentToolchain = await toolChainValidation.checkAutomaticallyInstalledBuildTools(currentToolchain, context);
  currentToolchain = toolChainValidation.checkBuildToolsInPath(currentToolchain);
  const hasBuildTools = toolChainValidation.hasRelevantBuildTools(currentToolchain);
  console.log({currentToolchain, hasBuildTools});
  context.globalState.update('hasBuildTools', hasBuildTools);
  return Promise.resolve(hasBuildTools);
}