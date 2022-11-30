import * as vscode from 'vscode';

import {
  addTestToolSettingsToWorkspace,
  cleanUpSTM32ForVSCodeArtifacts,
  waitForWorkspaceFoldersChange
} from '../helpers';
import { afterEach, beforeEach, suite, test } from 'mocha';
import { expect } from 'chai';
import { join } from 'path';

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
  test('default build test and check for openocd configuration', async () => {
    // execute the test build.
    await buildSTM();
    // Check if the correct target is found see issue #125. the L0 series
    // has a different naming convention than the rest of the STM32 line
    // already verified that workspaceFolder is existing
    const openocdPath = join(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '', 'openocd.cfg');
    const openocdConfigFile = await vscode.workspace.fs.readFile(vscode.Uri.file(openocdPath));
    const openOcdfile = Buffer.from(openocdConfigFile).toString('utf-8');
    expect(openOcdfile.includes('source [find target/stm32l0.cfg]')).to.be.true;
  }).timeout(120000);

});