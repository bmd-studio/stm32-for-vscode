import * as vscode from 'vscode';

import { suite, test, before } from 'mocha';

import { installAllTools } from '../../buildTools/installTools';
import { waitForWorkspaceFoldersChange, addTestToolSettingsToWorkspace, getTestToolsFolder } from '../helpers';

suite('build tools test', () => {
  before(async () => {
    try {
      await vscode.workspace.fs.delete(vscode.Uri.file(getTestToolsFolder()), { recursive: true });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
    return Promise.resolve();

  });
  test('install build tools', async () => {
    // should await the workspace, so STM32 for vscode is activated.
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders?.[0]) {
      await waitForWorkspaceFoldersChange(2000);
      // wait for the folder to be loaded
    }
    try {
      await installAllTools(vscode.Uri.file(getTestToolsFolder()));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    await addTestToolSettingsToWorkspace();

  }).timeout(10 * 60 * 1000);
});
