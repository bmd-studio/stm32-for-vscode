import * as vscode from 'vscode';

import {
  addTestToolSettingsToWorkspace,
  cleanUpSTM32ForVSCodeArtifacts,
  waitForWorkspaceFoldersChange,
  hasExtensionTestFiles,
} from '../helpers';
import { afterEach, beforeEach, suite, test } from 'mocha';
import { expect } from 'chai';

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
    const hasTestFiles = await hasExtensionTestFiles();
    expect(hasTestFiles).to.be.true;
  }).timeout(120000);

  test('do clean build on fresh project test', async () => {
    // execute the test build.
    await buildSTM({ cleanBuild: true });
    const hasTestFiles = await hasExtensionTestFiles();
    expect(hasTestFiles).to.be.true;
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

    const hasTestFiles = await hasExtensionTestFiles();
    expect(hasTestFiles).to.be.true;

  }).timeout(120000);

});
