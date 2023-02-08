import { join } from 'path';
import { checkIfFileExists, getWorkspaceUri } from '../Helpers';

import setupTestFolder,
{
  TEST_DIRECTORY,
  TEST_COMMON_DIRECTORY,
  EXAMPLE_FILE_NAME,
  EXAMPLE_FILE_DIRECTORY,
  DOCTEST_FILE_NAME,
  DOCTEST_README_FILE_NAME,
} from './testFolder';
import setupCommonFolder, { COMMON_DIRECTORY, COMMON_README_PATH } from './commonFolder';

export async function setupTesting(): Promise<void> {
  const workspaceUri = getWorkspaceUri();
  if (!workspaceUri) {
    throw Error('Currently not in an active workspace');
  }

  // check if the test folders already exits. If not create the default folders
  const testDirectoryPath = join(workspaceUri.fsPath, TEST_DIRECTORY);
  const commonDirectoryPath = join(workspaceUri.fsPath, COMMON_DIRECTORY);
  const hasTestDirectory = await checkIfFileExists(testDirectoryPath);
  const hasCommonDirectory = await checkIfFileExists(commonDirectoryPath);
  if (!hasTestDirectory) {
    await setupTestFolder(workspaceUri);
  }
  if (!hasCommonDirectory) {
    await setupCommonFolder(workspaceUri);
  }

  // TODO: maybe add target to the configuration over here.
}

export {
  COMMON_DIRECTORY,
  TEST_DIRECTORY,
  TEST_COMMON_DIRECTORY,
  EXAMPLE_FILE_NAME,
  EXAMPLE_FILE_DIRECTORY,
  COMMON_README_PATH,
  DOCTEST_FILE_NAME,
  DOCTEST_README_FILE_NAME,
};
