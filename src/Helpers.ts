import * as path from 'path';
import { TextEncoder } from 'util';
import { Uri, workspace, } from 'vscode';



// FIXME: use native implementation of VSCode
/**
 * Helper function for writing a file in the workspace. Returns a promise
 * @param workspacePathUri Path to the active workspace
 * @param filePath Relative path to the file within the workspace
 * @param file The file that needs to be written
 */
export function writeFileInWorkspace(
  workspacePathUri: Uri, filePath: string, file: string) {
  const totalPath = path.resolve(workspacePathUri.fsPath, filePath);
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

export function splitStringLines(input: string) {
  return input.split(/\r\n|\r|\n/);
}