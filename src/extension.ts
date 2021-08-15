/**
 * MIT License
 *
 * Copyright (c) 2020 Bureau Moeilijke Dingen
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as OpenOCDConfig from './configuration/openOCDConfig';
import * as vscode from 'vscode';

import addCommandMenu from './menu';
import CommandMenu from './menu/CommandMenu';
import buildSTM from './BuildTask';
import { checkBuildTools } from './buildTools';
import { installAllTools } from './buildTools/installTools';
import { parseString } from 'xml2js';
import * as path from 'path';
import * as util from 'util';
import * as CubeIDEImport from './getInfo/STM32CubeIDE';
import { fsPathToPosix } from './Helpers';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
  // This line of code will only be executed once when your extension is
  // activated
  let commandMenu: CommandMenu | undefined = undefined;
  checkBuildTools(context).then((hasBuildTools) => {
    if (hasBuildTools) {
      // should continue with 
    }
    commandMenu = addCommandMenu(context);
    vscode.commands.executeCommand('setContext', 'stm32ForVSCodeReady', true);
  });
  vscode.commands.registerCommand(
    'stm32-for-vscode.testXMLParsing',
    () => {
      if (vscode.workspace.workspaceFolders?.[0]) {
        vscode.workspace.fs.readFile(
          vscode.Uri.file(
            path.join(
              vscode.workspace.workspaceFolders[0].uri.fsPath, 'LwIP_UDP_Echo_Server\\STM32CubeIDE\\.project'))
        ).then((response) => {
          const file = Buffer.from(response).toString('utf8');
          // console.log('raw file', file);
          parseString(file, (err, result) => {
            console.log(err);
            console.log('result project');
            console.log(result);
            if (!vscode.workspace.workspaceFolders?.[0]) {
              return;
            }
            vscode.workspace.fs.writeFile(
              vscode.Uri.file(
                path.join(
                  vscode.workspace.workspaceFolders[0].uri.fsPath, 'testXMLToJSONProject.json')
              ),
              Buffer.from(JSON.stringify(result, null, 2), 'utf8')
            );
          });
        });
        vscode.workspace.fs.readFile(
          vscode.Uri.file(
            path.join(
              vscode.workspace.workspaceFolders[0].uri.fsPath, 'LwIP_UDP_Echo_Server\\STM32CubeIDE\\.cproject'))
        ).then((response) => {
          const file = Buffer.from(response).toString('utf8');
          // console.log('raw file', file);
          parseString(file, (err, result) => {
            console.log(err);
            console.log('result cproject');
            console.log(result);
            if (!vscode.workspace.workspaceFolders?.[0]) {
              return;
            }
            vscode.workspace.fs.writeFile(
              vscode.Uri.file(
                path.join(
                  vscode.workspace.workspaceFolders[0].uri.fsPath, 'testXMLToJSONcProject.json')
              ),
              Buffer.from(JSON.stringify(result, null, 2), 'utf8')
            );
            console.log(JSON.stringify(result, null, 2));
            console.log(util.inspect(result, false, null));
          });
        });
      }

    }
  );
  vscode.commands.registerCommand('stm32-for-vscode.importCubeIDEProject',
    async () => {
      try {
        await CubeIDEImport.getCubeIDEProjectFileInfo();
        const cProjectFile = await CubeIDEImport.getCProjectFile();
        if (!vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath) {
          return;
        }
        vscode.workspace.fs.writeFile(
          vscode.Uri.file(
            path.join(
              vscode.workspace.workspaceFolders[0].uri.fsPath, 'cProjectJson.json')
          ),
          Buffer.from(JSON.stringify(cProjectFile, null, 2))
        );
        console.log('project file');
        console.log(cProjectFile);
        if (cProjectFile) {
          const projectInfo = CubeIDEImport.getInfoFromCProjectFile(cProjectFile);
          console.log({ projectInfo });
        }
      } catch (error) {
        console.error(error);
      }
    }
  );
  const setProgrammerCommand = vscode.commands.registerCommand(
    'stm32-for-vscode.setProgrammer',
    (programmer?: string
    ) => {
      OpenOCDConfig.changeProgrammerDialogue(programmer);
    });
  context.subscriptions.push(setProgrammerCommand);
  const openSettingsCommand = vscode.commands.registerCommand('stm32-for-vscode.openSettings', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', `@ext:bmd.stm32-for-vscode`);
  });
  context.subscriptions.push(openSettingsCommand);
  const openExtension = vscode.commands.registerCommand('stm32-for-vscode.openExtension', async () => {
    await checkBuildTools(context);
  });
  context.subscriptions.push(openExtension);
  const installBuildTools = vscode.commands.registerCommand('stm32-for-vscode.installBuildTools', async () => {
    try {
      await installAllTools(context);
      const hasBuildTools = await checkBuildTools(context);
      if (hasBuildTools && commandMenu) {
        commandMenu.refresh();
      }

    } catch (error) {
      vscode.window.showErrorMessage(`Something went wrong with installing the build tools. Error:${error}`);
    }
  });
  context.subscriptions.push(installBuildTools);

  const buildToolsCommand = vscode.commands.registerCommand("stm32-for-vscode.checkBuildTools", async () => {
    await checkBuildTools(context);
  });
  context.subscriptions.push(buildToolsCommand);
  const buildCmd = vscode.commands.registerCommand(
    'stm32-for-vscode.build',
    async () => {
      await buildSTM({});

    }
  );
  context.subscriptions.push(buildCmd);
  const flashCmd = vscode.commands.registerCommand(
    'stm32-for-vscode.flash',
    async () => {
      await buildSTM({
        flash: true,
      });
    }
  );
  context.subscriptions.push(flashCmd);

  const cleanBuildCmd = vscode.commands.registerCommand(
    'stm32-for-vscode.cleanBuild',
    async () => {
      await buildSTM({
        cleanBuild: true,
      });
    }
  );
  context.subscriptions.push(cleanBuildCmd);

}

// // this method is called when your extension is deactivated
// export function deactivate(): void { }
