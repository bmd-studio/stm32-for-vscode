/*
 * Created by Jort Band - Bureau Moeilijke Dingen
*/

import vscode from 'vscode';
import { makefileName } from './Definitions';
import { getInfo } from './Info';
import updateMakefile from './UpdateMakefile';
import updateConfiguration from './Configuration';


let extensionTerminal;


export default async function buildSTM(options) {
  const { flash, cleanBuild } = options || {};
  return new Promise(async (resolve) => {
    let currentWorkspaceFolder;
    let info;
    try {
      currentWorkspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
      info = await getInfo(currentWorkspaceFolder);
      await updateMakefile(currentWorkspaceFolder, info);
      if (!extensionTerminal) {
        extensionTerminal = vscode.window.createTerminal({ name: 'STM32 for VSCode' });
      }
      extensionTerminal.show();
      if (cleanBuild) {
        extensionTerminal.sendText(`make -f ${makefileName} clean`);
      }
      extensionTerminal.sendText(`make -f ${makefileName}${flash ? ' flash' : ''}`);
    } catch (err) {
      vscode.window.showErrorMessage(`Something went wrong during the build process: ${err.message}`);
    }

    try {
      await updateConfiguration(currentWorkspaceFolder, info);
    } catch (err) {
      vscode.window.showErrorMessage(`Something went wrong with configuring the workspace. ERROR: ${err}`);
    }
    resolve();
  });
}
