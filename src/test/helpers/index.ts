import * as Definitions from '../../Definitions';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  COMMON_DIRECTORY,
  TEST_DIRECTORY,
  TEST_COMMON_DIRECTORY,
  EXAMPLE_FILE_NAME,
  EXAMPLE_FILE_DIRECTORY,
  COMMON_README_PATH,
  DOCTEST_FILE_NAME,
  DOCTEST_README_FILE_NAME,
} from '../../testing';

import {
  checkAutomaticallyInstalledBuildTools,
  checkIfAllBuildToolsArePresent,
} from '../../buildTools/validateToolchain';
import { checkIfFileExists } from '../../Helpers';
import { platform } from 'process';

export function getContext(): vscode.ExtensionContext {
  const context = vscode.extensions.getExtension(Definitions.FULL_EXTENSION_NAME);
  if (context === undefined) {
    console.log('COULD NOT FIND CONTEXT');
  }
  return context as unknown as vscode.ExtensionContext;
}

export async function waitForWorkspaceFoldersChange(timeoutMs?: number): Promise<void> {
  let rejectTimeout = timeoutMs || 500;
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
  if (platform !== 'win32') {
    delete result.makePath;
  }
  const hasAllBuildTools = checkIfAllBuildToolsArePresent(result);
  if (!hasAllBuildTools) {
    throw new Error('Could not find the correct build tools');
  }
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders?.[0]) {
    const stm32ForVSCodeWorkspaceConfiguration = vscode.workspace.getConfiguration(
      'stm32-for-vscode', vscode.workspace.workspaceFolders[0]);
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

export async function hasExtensionTestFiles(): Promise<boolean> {
  if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders?.[0]) {
    return false;
  }
  const currentWorkspaceFolderUri = vscode.workspace.workspaceFolders[0];
  const workspaceFSPath = currentWorkspaceFolderUri.uri.fsPath;

  const commonDirectoryPath = path.join(workspaceFSPath, COMMON_DIRECTORY);
  const testDirectoryPath = path.join(workspaceFSPath, TEST_DIRECTORY);
  const commonReadmePath = path.join(commonDirectoryPath, COMMON_README_PATH);
  const testCommonDirectoryPath = path.join(testDirectoryPath, TEST_COMMON_DIRECTORY);
  const testDoctestPath = path.join(testCommonDirectoryPath, DOCTEST_FILE_NAME);
  const testDoctestReadmePath = path.join(testCommonDirectoryPath, DOCTEST_README_FILE_NAME);
  const testExampleDirectory = path.join(testDirectoryPath, EXAMPLE_FILE_DIRECTORY);
  const testExamplePath = path.join(testExampleDirectory, EXAMPLE_FILE_NAME);

  const pathChecks = [
    commonReadmePath,
    testDoctestPath,
    testDoctestReadmePath,
    testExamplePath,
  ].map((path) => {
    return checkIfFileExists(path);
  });
  try {
    const result = await Promise.all(pathChecks);
    const hasPaths = result.reduce((accumulator, hasPath) => {
      if (!hasPath) {
        accumulator = false;
      }
      return accumulator;
    }, true);
    return hasPaths;
  } catch (error) {
    throw error;
  }
}

/**
 * Cleans up all the artifacts that are created by the STM32 for VSCode extension.
 */
export async function cleanUpSTM32ForVSCodeArtifacts(): Promise<void> {
  if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders?.[0]) {
    return;
  }
  const currentWorkspaceFolderUri = vscode.workspace.workspaceFolders[0];
  const makefilePath = path.join(currentWorkspaceFolderUri.uri.fsPath, Definitions.makefileName);
  const configPath = path.join(currentWorkspaceFolderUri.uri.fsPath, Definitions.EXTENSION_CONFIG_NAME);
  const workspaceSettingsPath = path.join(currentWorkspaceFolderUri.uri.fsPath, ".vscode");
  const openocdConfigPath = path.join(currentWorkspaceFolderUri.uri.fsPath, "openocd.cfg");
  const buildDirectoryPath = path.join(currentWorkspaceFolderUri.uri.fsPath, "build");
  const commonDirectoryPath = path.join(currentWorkspaceFolderUri.uri.fsPath, COMMON_DIRECTORY);
  const testDirectoryPath = path.join(currentWorkspaceFolderUri.uri.fsPath, TEST_DIRECTORY);

  const fileDeletePromises = [
    vscode.workspace.fs.delete(vscode.Uri.file(makefilePath), { useTrash: false }),
    vscode.workspace.fs.delete(vscode.Uri.file(configPath), { useTrash: false }),
    vscode.workspace.fs.delete(vscode.Uri.file(openocdConfigPath), { useTrash: false }),
    vscode.workspace.fs.delete(vscode.Uri.file(workspaceSettingsPath), { useTrash: false, recursive: true }),
    vscode.workspace.fs.delete(vscode.Uri.file(buildDirectoryPath), { useTrash: false, recursive: true }),
    vscode.workspace.fs.delete(vscode.Uri.file(commonDirectoryPath), { useTrash: false, recursive: true }),
    vscode.workspace.fs.delete(vscode.Uri.file(testDirectoryPath), { useTrash: false, recursive: true }),
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
