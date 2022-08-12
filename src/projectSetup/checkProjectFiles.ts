import * as path from 'path';
import * as vscode from 'vscode';
import * as Helpers from '../Helpers';

import { EXTENSION_CONFIG_NAME } from '../Definitions';

interface HasProjectFilesInterface {
  makefile: boolean;
  config: boolean;
  openocd: boolean;
}

export default async function checkProjectFiles(): Promise<HasProjectFilesInterface | null> {
  const workspaceUri = Helpers.getWorkspaceUri();
  if (!workspaceUri) {
    return null;
  }

  const makefilePath = path.join(workspaceUri.fsPath, 'Makefile');
  const makefileStat = await new Promise((resolve) => {
    vscode.workspace.fs.stat(vscode.Uri.file(makefilePath)).then((value) => {
      resolve(value);
    }, () => {
      resolve(null);
    });
  });

  const configPath = path.join(workspaceUri.fsPath, EXTENSION_CONFIG_NAME);
  const configStat = await new Promise((resolve) => {
    vscode.workspace.fs.stat(vscode.Uri.file(configPath)).then((value) => {
      resolve(value);
    }, () => {
      resolve(null);
    });
  });

  const openocdConfigPath = path.join(workspaceUri.fsPath, 'openocd.cfg');
  const openocdConfigStat = await new Promise((resolve) => {
    vscode.workspace.fs.stat(vscode.Uri.file(openocdConfigPath)).then((value) => {
      resolve(value);
    }, () => {
      resolve(null);
    });
  });

  return Promise.resolve({
    makefile: !!makefileStat,
    config: !!configStat,
    openocd: !!openocdConfigStat,
  });
}
