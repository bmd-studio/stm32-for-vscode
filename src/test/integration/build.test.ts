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
  }).timeout(120000);

  test('do clean build on fresh project test', async () => {
    // execute the test build.
    await buildSTM({ cleanBuild: true });
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