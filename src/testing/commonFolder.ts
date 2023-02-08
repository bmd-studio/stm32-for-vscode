
import { checkIfFileExitsIfNotWrite, checkIfDirectoryExistsIfNotWrite } from '../Helpers';
import { join } from 'path';
import { Uri, window } from 'vscode';
import commonReadme from './commonReadme';

export const COMMON_DIRECTORY = 'Common';
export const COMMON_README_PATH = join(COMMON_DIRECTORY, 'README.md');

export default async function setupCommonFolder(workspaceUri: Uri): Promise<void> {

  const localCommonFolder = join(workspaceUri.fsPath, COMMON_DIRECTORY);
  const localReadmePath = join(workspaceUri.fsPath, COMMON_README_PATH);
  try {
    await checkIfDirectoryExistsIfNotWrite(localCommonFolder);
    await checkIfFileExitsIfNotWrite(localReadmePath, commonReadme);
  } catch (err) {
    window.showErrorMessage(
      `Something went wrong with making the ${COMMON_DIRECTORY} folder, please create it manually. Error: ${err}`
    );
  }
}
