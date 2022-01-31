import * as vscode from 'vscode';

import {
  addTestToolSettingsToWorkspace,
  cleanUpSTM32ForVSCodeArtifacts,
  waitForWorkspaceFoldersChange
} from '../helpers';
import { afterEach, beforeEach, suite, test } from 'mocha';

import buildSTM from '../../BuildTask';

suite('build test', () => {
  afterEach(async () => {
    // console.log('curent dir');
    if (vscode.workspace?.workspaceFolders?.[0]) {
      const workspaceDir = await vscode.workspace.fs.readDirectory(vscode.workspace.workspaceFolders[0].uri);
      console.error('workspace directory', workspaceDir);
    }

    await cleanUpSTM32ForVSCodeArtifacts();
  });
  beforeEach(async () => {
    // wait for the folder to be loaded
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders?.[0]) {
      await waitForWorkspaceFoldersChange(2000);
    }

    await addTestToolSettingsToWorkspace();
  });
  test('default build test', async () => {
    // execute the test build.
    await buildSTM();
    if (vscode.workspace?.workspaceFolders?.[0]) {
      const workspaceDir = await vscode.workspace.fs.readDirectory(vscode.workspace.workspaceFolders[0].uri);
      console.error({ workspaceDir });
    }

  }).timeout(120000);

  test('build build clean build', async () => {
    // // in out for now
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders?.[0]) {
      await waitForWorkspaceFoldersChange(2000);
      // wait for the folder to be loaded
    }
    // execute the test build here
    await buildSTM();
    await buildSTM();
    await buildSTM({ cleanBuild: true });


  }).timeout(120000);

});