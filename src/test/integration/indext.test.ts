import * as Definitions from '../../Definitions';
import * as path from 'path';
import * as vscode from 'vscode';

import { afterEach, suite, test } from 'mocha';

import buildSTM from '../../BuildTask';

// function cleanUp(projectPath: string) {

// }

function getSTM32ProjectDirectory(projectName: string): string {
  return path.resolve(__dirname, '../../../src/test/STM32-projects', projectName);
}

async function waitForWorkspaceFoldersChanges(): Promise<void> {
  return new Promise((resolve) => {
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      resolve();
    });
  });
}

async function cleanUpSTM32ForVSCodeArtifacts(): Promise<void> {
  if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders?.[0]) {
    return;
  }
  const currentWorkspaceFolderUri = vscode.workspace.workspaceFolders[0];
  const makefilePath = path.join(currentWorkspaceFolderUri.uri.fsPath, Definitions.makefileName);
  const configPath = path.join(currentWorkspaceFolderUri.uri.fsPath, Definitions.EXTENSION_CONFIG_NAME);
  const workspaceSettingsPath = path.join(currentWorkspaceFolderUri.uri.fsPath, ".vscode");
  const openocdConfigPath = path.join(currentWorkspaceFolderUri.uri.fsPath, "openocd.cfg");
  const buildDirectoryPath = path.join(currentWorkspaceFolderUri.uri.fsPath, "build");


  const fileDeletePromises = [
    vscode.workspace.fs.delete(vscode.Uri.file(makefilePath), { useTrash: false }),
    vscode.workspace.fs.delete(vscode.Uri.file(configPath), { useTrash: false }),
    vscode.workspace.fs.delete(vscode.Uri.file(openocdConfigPath), { useTrash: false }),
    vscode.workspace.fs.delete(vscode.Uri.file(workspaceSettingsPath), { useTrash: false, recursive: true }),
    vscode.workspace.fs.delete(vscode.Uri.file(buildDirectoryPath), { useTrash: false, recursive: true }),
  ];
  try {
    await Promise.all(fileDeletePromises);
  } catch (error) {
    console.error('Something went wrong with cleaning up the integration test', error);
  }
}

suite('integration', () => {
  afterEach(() => {
    cleanUpSTM32ForVSCodeArtifacts();
  });
  test('H753ZI_fresh', async () => {
    // // in out for now
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders?.[0]) {
      await waitForWorkspaceFoldersChanges();
      // wait for the folder to be loaded
    }
    // execute the test build here
    try {
      await buildSTM();
    } catch (error) {
      throw error;
    }

  }).timeout(30000);

});