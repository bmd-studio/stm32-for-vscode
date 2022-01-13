import { scanForFiles } from "../getFiles";
import { workspace, Uri } from 'vscode';
import * as path from 'path';

async function getStartupFilePath(): Promise<string | undefined> {
  const currentWorkspaceFolder = workspace.workspaceFolders?.[0];
  if (!currentWorkspaceFolder) {
    return undefined;
  }
  const cubeIDEStartupFilePaths = await scanForFiles(['**/STM32CubeIDE/**/startup_*.s']);
  if (cubeIDEStartupFilePaths[0]) {
    return cubeIDEStartupFilePaths[0];
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const SW4STM32StartupFilePaths = await scanForFiles(['**/SW4STM32/**/startup_*.s']);
  if (SW4STM32StartupFilePaths[0]) {
    return SW4STM32StartupFilePaths[0];
  }
  const anyStartupFilePaths = await scanForFiles(['**/startup_*.s']);
  if (anyStartupFilePaths[0]) {
    return anyStartupFilePaths[0];
  }
  return undefined;
}


/**
 * Searches for a startup file in the workspace and returns it as a string.
 * @returns the startup file in string format.
 */
async function getStartupFile(startupFilePath: string): Promise<string | undefined> {
  const currentWorkspaceFolder = workspace.workspaceFolders?.[0];
  if (!currentWorkspaceFolder) {
    return undefined;
  }
  if (path) {
    const startupFileArray = await workspace.fs.readFile(
      Uri.file(
        path.join(currentWorkspaceFolder.uri.fsPath, startupFilePath)
      )
    );
    const startupFile = Buffer.from(startupFileArray).toString('utf8');
    return startupFile;
  }
  return undefined;
}

export interface StartupFileInfo {
  path: string;
  cpu: string | undefined;
  fpu: string | undefined;
}

export default async function getStartupFileInfo(): Promise<StartupFileInfo> {
  try {
    const startupFilePath = await getStartupFilePath();
    if (!startupFilePath) {
      throw new Error('Could not find startup file');
    }
    const startupFile = await getStartupFile(startupFilePath);
    if (!startupFile) {
      throw new Error('could not read the startup file');
    }
    const result: StartupFileInfo = {
      path: startupFilePath,
      cpu: undefined,
      fpu: undefined,
    };

    const cpuRegex = /\.cpu\s+(\w+-[\w\d]+)/;
    const cpuSearchResult = cpuRegex.exec(startupFile);

    if (cpuSearchResult) {
      result.cpu = cpuSearchResult[cpuSearchResult.length - 1];
    }

    const fpuRegex = /\.fpu\s+([\w-\d]+)/;
    const fpuSearchResult = fpuRegex.exec(startupFile);
    if (fpuSearchResult) {
      result.fpu = fpuSearchResult[fpuSearchResult.length - 1];
    }
    return result;
  } catch (error) {
    throw error;
  }
}