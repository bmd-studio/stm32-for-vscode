import { Uri, window, workspace } from 'vscode';
import { join } from 'path';
import {
  checkIfFileExists, checkIfFileExitsIfNotWrite, fsPathToPosix, getWorkspaceUri,
} from '../Helpers';

import libraryReadme from './modulesReadme';

export const MODULES_FOLDER = 'modules';
const MODULES_README_PATH = `${MODULES_FOLDER}/README.md`;

export default async function setupModulesFolder(): Promise<void> {
  const workspacUri = getWorkspaceUri();
  if (!workspacUri) {
    return;
  }

  const localModulesFolder = join(fsPathToPosix(workspacUri.fsPath), MODULES_FOLDER);
  const localReadmePath = join(fsPathToPosix(workspacUri.fsPath), MODULES_README_PATH);
  if (await checkIfFileExists(localModulesFolder)) {
    return;
  }
  try {
    await workspace.fs.createDirectory(Uri.file(localModulesFolder));
    await checkIfFileExitsIfNotWrite(localReadmePath, libraryReadme);
  } catch (err) {
    window.showErrorMessage(
      `Something went wrong with making the ${MODULES_FOLDER} folder, please create it manually. Error: ${err}`,
    );
  }
}

interface SourceFiles {
  sources: string[],
  includes: string[]
}

interface ModuleFolderFiles {
  c: SourceFiles;
  cxx: SourceFiles;
  asm: SourceFiles;
}

export function getFilesFromModulesFolder(): Promise<ModuleFolderFiles> {
}