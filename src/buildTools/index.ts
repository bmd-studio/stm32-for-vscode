import * as vscode from 'vscode';

export function checkBuildTools(context: vscode.ExtensionContext): boolean {
  const hasBuildTools = context.globalState.get('hasBuildTools');

  if (!hasBuildTools) {
    console.error('build tools are not present');
    // should run validation and if true update state.
  }

  return false;
}