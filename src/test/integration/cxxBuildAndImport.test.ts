import { workspace, } from 'vscode';

import {
  addTestToolSettingsToWorkspace,
  cleanUpSTM32ForVSCodeArtifacts,
  waitForWorkspaceFoldersChange,
  getContext
} from '../helpers';
import { afterEach, beforeEach, suite, test } from 'mocha';
import { parseConfigfile, readConfigFile, writeConfigFile } from '../../configuration/stm32Config';

import buildSTM from '../../BuildTask';
import importAndSetupCubeIDEProject from '../../import';

const extensionContext = getContext();

suite('import and convert to C++ test', () => {
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

  test('Import Cube project convert to C++ and build', async () => {
    await importAndSetupCubeIDEProject();

    // change the config to c++
    const configurationFile = await readConfigFile();
    const projectConfiguration = parseConfigfile(configurationFile);
    projectConfiguration.language = 'C++';
    await writeConfigFile(projectConfiguration);
    await buildSTM(extensionContext);
  }).timeout(120000);
});
