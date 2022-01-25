import * as path from 'path';
import * as vscode from 'vscode';

import { checkAutomaticallyInstalledBuildTools, hasRelevantAutomaticallyInstalledBuildTools } from '../../buildTools/validateToolchain';
import { suite, test } from 'mocha';

import { installAllTools } from '../../buildTools/installTools';
import { waitForWorkspaceFoldersChange } from '../helpers';

// import { installAllTools } from '../../buildTools/installTools';

suite('build tools test', () => {
  test('install build tools', async () => {
    // should await the workspace, so STM32 for vscode is activated.
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders?.[0]) {
      await waitForWorkspaceFoldersChange(2000);
      // wait for the folder to be loaded
    }
    const buildToolsFolder = vscode.workspace.workspaceFolders?.[0];
    if (!buildToolsFolder) {
      throw new Error('no workspace folder to install build tools in.');
    }
    const buildToolsLocation = path.join(buildToolsFolder.uri.fsPath, 'tools');

    try {
      await installAllTools(vscode.Uri.file(buildToolsLocation));
      // checks if the build tools are installed and adds them 
      const result = await checkAutomaticallyInstalledBuildTools(vscode.Uri.file(buildToolsLocation));
      if (!hasRelevantAutomaticallyInstalledBuildTools(result)) {
        throw new Error('build tools did not install properly');
      }
      const stm32ForVSCodeWorkspaceConfiguration = vscode.workspace.getConfiguration('stm32-for-vscode');
      await stm32ForVSCodeWorkspaceConfiguration.update('openOCDPath', result.openOCDPath);
      await stm32ForVSCodeWorkspaceConfiguration.update('armToolchainPath', result.armToolchainPath);

      // await installAllTools()
    } catch (error) {
      throw error;
    }
  }).timeout(10 * 60 * 1000);
});