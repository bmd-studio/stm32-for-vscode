import * as path from 'path';
import * as shelljs from 'shelljs';

import { Uri, workspace, } from 'vscode';

import { TextEncoder } from 'util';

export function splitStringLines(input: string): string[] {
  return input.split(/\r\n|\r|\n/);
}

export function fsPathToPosix(fsPath: string): string {
  return fsPath.split(path.sep).join(path.posix.sep);
}

export function convertToolPathToAbsolutePath(toolPath: string, dir?: boolean): string {
  const absolutePAth = shelljs.which(toolPath);
  let returnPath = absolutePAth;
  returnPath = fsPathToPosix(returnPath);
  if (dir) {
    returnPath = path.posix.dirname(returnPath);
  }
  return returnPath;
}

/**
 * Helper function for writing a file in the workspace. Returns a promise
 * @param workspacePathUri Path to the active workspace
 * @param filePath Relative path to the file within the workspace
 * @param file The file that needs to be written
 */
export function writeFileInWorkspace(
  workspacePathUri: Uri, filePath: string, file: string): Promise<void> {
  const totalPath = path.resolve(fsPathToPosix(workspacePathUri.fsPath), filePath);
  const propertiesUri = Uri.file(totalPath);
  const encoder = new TextEncoder();
  return new Promise((resolve, reject) => {
    try {
      workspace.fs.writeFile(propertiesUri, encoder.encode(file)).then(() => {
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function getWorkspaceUri(): Uri | null {
  const workspaces = workspace.workspaceFolders;
  if (workspaces && workspaces.length > 0) {
    return workspaces[0].uri;
  }
  return null;
}