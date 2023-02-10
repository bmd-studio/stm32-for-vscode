import { workspace, } from 'vscode';

import { afterEach, beforeEach, suite, test } from 'mocha';

import buildSTM from '../../BuildTask';
import {
  addTestToolSettingsToWorkspace,
  waitForWorkspaceFoldersChange,
  cleanUpSTM32ForVSCodeArtifacts,
  getContext,
} from '../helpers';
import importAndSetupCubeIDEProject from '../../import';

const extensionContext = getContext();


suite('importer test', () => {
  afterEach(() => {
    cleanUpSTM32ForVSCodeArtifacts();
  });
  beforeEach(async () => {
    // wait for the folder to be loaded
    if (!workspace.workspaceFolders || !workspace.workspaceFolders?.[0]) {
      await waitForWorkspaceFoldersChange(2000);
    }
    await addTestToolSettingsToWorkspace();
  });

  test('Import Cube example project and build', async () => {
    await importAndSetupCubeIDEProject();
    await buildSTM(extensionContext);

  }).timeout(120000);
});
