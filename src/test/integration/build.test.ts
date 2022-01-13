import * as Definitions from '../../Definitions';
import * as path from 'path';
import * as vscode from 'vscode';

import { afterEach, suite, test } from 'mocha';

import buildSTM from '../../BuildTask';

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

suite('build test', () => {
  afterEach(() => {
    cleanUpSTM32ForVSCodeArtifacts();
  });
  beforeEach(async () => {
    // wait for the folder to be loaded
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders?.[0]) {
      await waitForWorkspaceFoldersChanges();

    }
  })
  test('default build test', async () => {
    // execute the test build.
    try {
      await buildSTM();
    } catch (error) {
      throw error;
    }

  }).timeout(30000);

  test('build build clean build', async () => {
    // // in out for now
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders?.[0]) {
      await waitForWorkspaceFoldersChanges();
      // wait for the folder to be loaded
    }
    // execute the test build here
    try {
      await buildSTM();
      await buildSTM();
      await buildSTM({ cleanBuild: true });
    } catch (error) {
      throw error;
    }

  }).timeout(60000);

});