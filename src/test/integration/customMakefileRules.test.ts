import * as vscode from 'vscode';
import { execSync } from 'child_process';
import {
  addTestToolSettingsToWorkspace,
  cleanUpSTM32ForVSCodeArtifacts,
  getContext,
  waitForWorkspaceFoldersChange
} from '../helpers';
import { afterEach, beforeEach, suite, test } from 'mocha';

import buildSTM from '../../BuildTask';
import { getConfigFileFromWorkspace } from '../../configuration/stm32Config';
import * as Helpers from '../../Helpers';
import { EXTENSION_CONFIG_NAME } from '../../Definitions';
const extensionContext = getContext();

suite('customMakefileRules test', () => {
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

  test('Custom makefile rule integration test', async () => {
    await buildSTM(extensionContext);
    let stm32ConfigFile = await getConfigFileFromWorkspace();
    stm32ConfigFile = stm32ConfigFile.replace('customMakefileRules:', `
customMakefileRules:
 - command: sayhello
   rule: echo "hello"
    `);
    const workspaceFolderUri = Helpers.getWorkspaceUri();
    if (!workspaceFolderUri) {
      throw Error('something went wrong with getting the workspace folder URI');
    }
    await Helpers.writeFileInWorkspace(workspaceFolderUri, EXTENSION_CONFIG_NAME, stm32ConfigFile);
    await buildSTM(extensionContext);

    execSync('make -f STM32Make.make sayhello',
      {
        cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath
      }
    );

  }).timeout(120000);
});
