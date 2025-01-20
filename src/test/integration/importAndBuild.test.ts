import * as vscode from 'vscode';

import { afterEach, beforeEach, suite, test } from 'mocha';

import buildSTM from '../../BuildTask';
import {
  addTestToolSettingsToWorkspace,
  waitForWorkspaceFoldersChange,
  cleanUpSTM32ForVSCodeArtifacts
} from '../helpers';
import importAndSetupCubeIDEProject from '../../import';

async function stopExit(time: number): Promise<void> {
  return new Promise<void>(
    (resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    }
  );

}
suite('importer test', () => {
  afterEach(() => {
    cleanUpSTM32ForVSCodeArtifacts();
  });
  beforeEach(async () => {
    // wait for the folder to be loaded
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders?.[0]) {
      await waitForWorkspaceFoldersChange(2000);
    }
    await addTestToolSettingsToWorkspace();
  });

  test('Import Cube example project and build', async () => {
    await importAndSetupCubeIDEProject();
    await buildSTM();
  }).timeout(120000);
});