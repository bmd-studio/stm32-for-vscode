/**
 * Sets up the test folder and all its content.
 * The test folder will contain individual tests and the common files needed for testing
 */
import { checkIfFileExists, checkIfFileExitsIfNotWrite, checkIfDirectoryExistsIfNotWrite, writeFile } from '../Helpers';
import { getDoctestFile, doctestReadmeFile } from './doctest';
import exampleTest from './exampleTest';
import { join } from 'path';
import { Uri, window } from 'vscode';

export const TEST_DIRECTORY = 'Test';
export const TEST_COMMON_DIRECTORY = 'Common';
export const DOCTEST_FILE_NAME = 'doctest.h';
export const DOCTEST_README_FILE_NAME = 'README.md';

export const EXAMPLE_FILE_NAME = 'factorialExample.test.cpp';
export const EXAMPLE_FILE_DIRECTORY = 'Example';

export default async function setupTestFolder(workspacePath: Uri): Promise<void> {
  const testFolderPath = join(workspacePath.fsPath, TEST_DIRECTORY);
  const commonFolderPath = join(testFolderPath, TEST_COMMON_DIRECTORY);
  const doctestFilePath = join(commonFolderPath, DOCTEST_FILE_NAME);
  const doctestReadmeFilePath = join(commonFolderPath, DOCTEST_README_FILE_NAME);

  const exampleFolderPath = join(testFolderPath, EXAMPLE_FILE_DIRECTORY);
  const exampleFilePath = join(exampleFolderPath, EXAMPLE_FILE_NAME);

  try {
    // test folder
    await checkIfDirectoryExistsIfNotWrite(testFolderPath);

    //common and doctest
    await checkIfDirectoryExistsIfNotWrite(commonFolderPath);
    const hasDoctestFile = await checkIfFileExists(DOCTEST_FILE_NAME);
    if (!hasDoctestFile) {
      const doctestFile = await getDoctestFile();
      writeFile(doctestFilePath, doctestFile);
    }
    await checkIfFileExitsIfNotWrite(doctestReadmeFilePath, doctestReadmeFile);

    // example
    await checkIfDirectoryExistsIfNotWrite(exampleFolderPath);
    await checkIfFileExitsIfNotWrite(exampleFilePath, exampleTest);

  } catch (error) {
    window.showErrorMessage(`Could not create the test folder or it's contents. Please make sure that you have permission to write in this directory, or create the test folder yourself and download and setup doctest yourself. Error: ${error}`);
  }
}
