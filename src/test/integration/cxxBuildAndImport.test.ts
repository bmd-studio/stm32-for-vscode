import * as vscode from 'vscode';

import {
  addTestToolSettingsToWorkspace,
  cleanUpSTM32ForVSCodeArtifacts,
  waitForWorkspaceFoldersChange
} from '../helpers';
import { afterEach, beforeEach, suite, test } from 'mocha';
import { parseConfigfile, readConfigFile, writeConfigFile } from '../../configuration/stm32Config';

import buildSTM from '../../BuildTask';
import importAndSetupCubeIDEProject from '../../import';

suite('import and convert to C++ test', () => {
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

  test('Import Cube project convert to C++ and build', async () => {
    await importAndSetupCubeIDEProject();

    // change the config to c++
    const configurationFile = await readConfigFile();
    const projectConfiguration = await parseConfigfile(configurationFile);
    projectConfiguration.language = 'C++';
    await writeConfigFile(projectConfiguration);
    await buildSTM();
  }).timeout(120000);
});