import * as path from 'path';

const { platform } = process;

import { Uri, workspace, env } from 'vscode';

import { TextEncoder } from 'util';
import which = require('which');

export function splitStringLines(input: string): string[] {
  return input.split(/\r\n|\r|\n/);
}

export function escapeSpacesInPath(fsPath: string): string {
  return fsPath.split(' ').join('\\ ');
}

export function fsPathToPosix(fsPath: string, escapeSpaces?: boolean): string {
  let posixPath = fsPath.split(path.sep).join(path.posix.sep);
  if (escapeSpaces) {
    posixPath = escapeSpacesInPath(posixPath);
  }
  return posixPath;
}

export function whichSync(path: string | undefined | boolean):  string  | false {
  if(!path || typeof path  === 'boolean') {return false;}
  return which.sync(path, {nothrow: true}) || false;
}

export function convertToolPathToAbsolutePath(toolPath: string, dir?: boolean): string {
  const absolutePAth = which.sync(toolPath);
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

export function getAutomationShell(): string {
  let automationShell = env.shell;
  const shellSettings = workspace.getConfiguration('terminal.integrated.automationShell');
  switch (platform) {
    case 'win32': {
      const winShellSetting = shellSettings.get('windows');
      if (winShellSetting && typeof winShellSetting === 'string' && winShellSetting.length > 0) {
        automationShell = winShellSetting;
      }
    } break;
    case 'darwin': {
      const osxShellSetting = shellSettings.get('osx');
      if (osxShellSetting && typeof osxShellSetting === 'string' && osxShellSetting.length > 0) {
        automationShell = osxShellSetting;
      }
    } break;
    default: {
      // assume the rest is a version of linux
      const linuxShellSetting = shellSettings.get('linux');
      if (linuxShellSetting && typeof linuxShellSetting === 'string' && linuxShellSetting.length > 0) {
        automationShell = linuxShellSetting;
      }
    }
  }
  return automationShell;
}

export function isString(value: string | boolean | unknown): boolean {
  if (typeof value === 'boolean') {
    return false;
  }
  return typeof value === 'string' ||
    (!Array.isArray(value) && (value !== null && typeof value === 'object'));
}

export function uniq<T>(arr: T[]): T[] {
  const set = new Set(arr);
  return [...set];
}
