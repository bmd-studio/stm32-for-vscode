import * as path from 'path';
import * as shelljs from 'shelljs';
const { platform } = process;

import { Uri, workspace, env } from 'vscode';

import { TextEncoder } from 'util';

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
