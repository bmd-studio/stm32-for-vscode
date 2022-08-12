import * as Definitions from '../../Definitions';
import * as path from 'path';
import * as vscode from 'vscode';

import {
  checkAutomaticallyInstalledBuildTools,
  hasRelevantAutomaticallyInstalledBuildTools,
} from '../../buildTools/validateToolchain';

export async function waitForWorkspaceFoldersChange(timeoutMs?: number): Promise<void> {
  const rejectTimeout = timeoutMs || 500;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Waiting for the workspace folder update timed out, at: ${rejectTimeout}ms`));
    }, rejectTimeout);
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

export function getTestToolsFolder(): string {
  return path.join(__dirname, '../../../', 'tooling');
}

export async function addTestToolSettingsToWorkspace(): Promise<void> {
  // await installAllTools(vscode.Uri.file(getTestToolsFolder()));
  // checks if the build tools are installed and adds them
  const result = await checkAutomaticallyInstalledBuildTools(vscode.Uri.file(getTestToolsFolder()));
  if (!hasRelevantAutomaticallyInstalledBuildTools(result)) {
    throw new Error('Could not find the correct build tools');
  }
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders?.[0]) {
    const stm32ForVSCodeWorkspaceConfiguration = vscode.workspace.getConfiguration(
      'stm32-for-vscode', vscode.workspace.workspaceFolders[0]
    );
    await stm32ForVSCodeWorkspaceConfiguration.update('openOCDPath', result.openOCDPath);
    await stm32ForVSCodeWorkspaceConfiguration.update('armToolchainPath', result.armToolchainPath);
    await stm32ForVSCodeWorkspaceConfiguration.update('makePath', result.makePath ? result.makePath : 'make');
  }
}

export async function removeTestToolsFolder(): Promise<void> {
  try {
    await vscode.workspace.fs.delete(vscode.Uri.file(getTestToolsFolder()), { recursive: true, useTrash: false });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('something went wrong with removing the test folder');
    throw (error);
  }
}

export async function cleanUpSTM32ForVSCodeArtifacts(): Promise<void> {
  if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders?.[0]) {
    return;
  }
  const currentWorkspaceFolderUri = vscode.workspace.workspaceFolders[0];
  const makefilePath = path.join(currentWorkspaceFolderUri.uri.fsPath, Definitions.makefileName);
  const configPath = path.join(currentWorkspaceFolderUri.uri.fsPath, Definitions.EXTENSION_CONFIG_NAME);
  const workspaceSettingsPath = path.join(currentWorkspaceFolderUri.uri.fsPath, '.vscode');
  const openocdConfigPath = path.join(currentWorkspaceFolderUri.uri.fsPath, 'openocd.cfg');
  const buildDirectoryPath = path.join(currentWorkspaceFolderUri.uri.fsPath, 'build');

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
    // eslint-disable-next-line no-console
    console.error(await vscode.workspace.fs.readDirectory(currentWorkspaceFolderUri.uri));
    // eslint-disable-next-line no-console
    console.error('Something went wrong with cleaning up the integration test', error);
  }
}
