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
  return new Promise(async (resolve, reject) => {
    try {
      const currentWorkspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const info = await getInfo(currentWorkspaceFolder);
      await updateMakefile(currentWorkspaceFolder, info);
      updateConfiguration(currentWorkspaceFolder, info);

      if (!extensionTerminal) {
        extensionTerminal = vscode.window.createTerminal({ name: 'STM32 for VSCode' });
      }
      extensionTerminal.show();
      if (cleanBuild) {
        extensionTerminal.sendText(`make -f ${makefileName} clean`);
      }
      extensionTerminal.sendText(`make -f ${makefileName}${flash ? ' flash' : ''}`);
    } catch (err) {
      vscode.window.showErrorMessage('Something went wrong during the build process', err);
      // console.error(err);
      reject(err);
    }
    resolve();
  });
}
