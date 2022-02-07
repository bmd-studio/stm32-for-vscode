import * as vscode from 'vscode';

import {
  checkAutomaticallyInstalledBuildTools,
  hasRelevantAutomaticallyInstalledBuildTools
} from '../../buildTools/validateToolchain';
import { suite, test } from 'mocha';

import { installAllTools } from '../../buildTools/installTools';
import { waitForWorkspaceFoldersChange, getTestToolsFolder } from '../helpers';

suite('build tools test', () => {
  test('install build tools', async () => {
    // should await the workspace, so STM32 for vscode is activated.
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders?.[0]) {
      await waitForWorkspaceFoldersChange(2000);
      // wait for the folder to be loaded
    }

    await installAllTools(vscode.Uri.file(getTestToolsFolder()));
    // checks if the build tools are installed and adds them 
    const result = await checkAutomaticallyInstalledBuildTools(vscode.Uri.file(getTestToolsFolder()));
    if (!hasRelevantAutomaticallyInstalledBuildTools(result)) {
      throw new Error('build tools did not install properly');
    }

  }).timeout(10 * 60 * 1000);
});