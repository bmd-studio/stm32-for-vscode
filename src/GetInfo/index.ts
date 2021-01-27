import getMakefileInfo from './getCubeMakefileInfo';
import * as vscode from 'vscode';
import {fsPathToPosix} from '../Helpers';
// import {MakeInfo} from '../types/MakeInfo';
import getFiles from './getFiles';
import {getExtensionSettings} from './getSettings';

export default async function getInfo(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if(!workspaceFolders) {return Promise.resolve();}
  const currentWorkspaceFolder = fsPathToPosix(workspaceFolders[0].uri.fsPath);
  const makefileInfo = await getMakefileInfo(currentWorkspaceFolder);
  const filesInfo = await getFiles(currentWorkspaceFolder);
  const extensionSettings = await getExtensionSettings();
  // TODO: add the configuration file over here
  return Promise.resolve();
}