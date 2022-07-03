
import { checkIfFileExists, fsPathToPosix, getWorkspaceUri, checkIfFileExitsIfNotWrite } from '../Helpers';
import { join } from 'path';
import { workspace, Uri, window } from 'vscode';
import libraryReadme from './libraryReadme';

const LIBRARIES_FOLDER = 'libraries';
const LIBRARY_README_PATH = `${LIBRARIES_FOLDER}/README.md`;

export default async function setupLibrariesFolder(): Promise<void> {
  const workspacUri = getWorkspaceUri();
  if (!workspacUri) {
    return;
  }

  const localLibrariesFolder = join(fsPathToPosix(workspacUri.fsPath), LIBRARIES_FOLDER);
  const localReadmePath = join(fsPathToPosix(workspacUri.fsPath), LIBRARY_README_PATH);
  if (await checkIfFileExists(localLibrariesFolder)) {
    return;
  }
  try {
    await workspace.fs.createDirectory(Uri.file(localLibrariesFolder));
    await checkIfFileExitsIfNotWrite(localReadmePath, libraryReadme);
  } catch (err) {
    window.showErrorMessage(
      `Something went wrong with making the ${LIBRARIES_FOLDER} folder, please create it manually. Error: ${err}`
    );
  }
}