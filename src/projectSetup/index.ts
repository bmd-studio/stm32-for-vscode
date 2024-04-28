import * as Helpers from '../Helpers';
import * as OpenOCDConfig from '../configuration/openOCDConfig';
import * as vscode from 'vscode';

import { ExtensionConfiguration, OpenOCDConfiguration } from '../types';

import { EXTENSION_CONFIG_NAME } from '../Definitions';
import checkProjectFiles from './checkProjectFiles';
import getMakefileInfo from '../getInfo/getCubeMakefileInfo';
import { readOrCreateConfigFile } from '../configuration/stm32Config';

/**
 * Displays a pop up dialogue which asks if the users wants to create
 * a custom configuration file.
 * @returns Promise resolving to true for a custom config file. False if no config file is generated.
 */
export function noMakefileAndConfigFileDialogue(): Promise<boolean> {
  return new Promise((resolve) => {
    vscode.window.showWarningMessage(
      'No Makefile is present, please initialize your project using CubeMX,' +
      'with the toolchain set to Makefile under the project manager'
      ,
      'Wil do',
      'Create custom setup')
      .then(
        (buttonMessage) => {
          if (buttonMessage === 'Create custom setup') {
            // should make an "empty config file"
            vscode.window.showInformationMessage(
              `Are you sure you want to create a custom project?\n
              This means that you will have to fill in all the MCU definitions ` +
              `and file locations in: ${EXTENSION_CONFIG_NAME} before the project ` +
              `will compile with the STM32 for VSCode extension`,
              "Yes", "Cancel"
            ).then((infoMessage) => {
              if (infoMessage === 'Yes') {
                const emptyConfig = new ExtensionConfiguration();
                emptyConfig.target = 'e.g. projectName';
                emptyConfig.targetMCU = 'e.g. stm32f7x';
                emptyConfig.cpu = "e.g. -mcpu=cortex-m7";
                emptyConfig.fpu = "e.g. -mfpu=fpv4-sp-d16";
                emptyConfig.floatAbi = "e.g. -mfloat-abi=hard";
                emptyConfig.ldscript = "e.g. STM32F769IITx_FLASH.ld";
                emptyConfig.suppressMakefileWarning = true;
                readOrCreateConfigFile(emptyConfig).then(() => {
                  vscode.window.showInformationMessage(
                    "Successfully created the config file," +
                    "please add the necessary information, otherwise it will not compile"
                  );
                });
                resolve(true);
                return;
              } else {
                resolve(false);
              }
            });
          } else {
            resolve(false);
          }
        });
  });
}

/**
 * Check if project files are present. If the makefile and config file are missing a dialogue
 * will be presented asking to create an STM32 for VSCode configuration file
 * @returns returns if required files are present and false when they need to be created or are not present
 */
export async function checkProjectFilesAndCreate(): Promise<boolean> {
  // workspace folder guard
  const workspaceFolder = Helpers.getWorkspaceUri();
  if (!workspaceFolder) { return false; }

  // check for project files with guard
  const projectFiles = await checkProjectFiles();
  if (!projectFiles) { return Promise.resolve(false); }
  if (!projectFiles.makefile && !projectFiles.config) {
    await noMakefileAndConfigFileDialogue();
    return Promise.resolve(false);
  }
  // config file is present but not the makefile. Check for mistake or if it is intentional
  if (!projectFiles.makefile && projectFiles.config) {
    // should get the information of the configuration file to check if we should issue a warning.
    const emptyConfig = new ExtensionConfiguration();
    const configFile = await readOrCreateConfigFile(emptyConfig);
    if (!configFile.suppressMakefileWarning) {
      vscode.window.showWarningMessage(
        // eslint-disable-next-line max-len
        "No CubeMX Makefile was found. Please configure your project to generate a Makefile project under Project Manager > Toolchain/IDE"
      );
      // return Promise.resolve(true); // should continue despite this, worst case scenario the compilation fails.
    }
  }

  if (projectFiles.makefile && !projectFiles.config) {
    // a new configuration file should be created based on the info from the makefile.
    const newProjectFile = new ExtensionConfiguration();
    const makeInfo = await getMakefileInfo(workspaceFolder.fsPath);
    newProjectFile.importRelevantInfoFromMakefile(makeInfo);
    await readOrCreateConfigFile(newProjectFile);
    projectFiles.config = true;
  }
  // create openocd when none is present
  if (!projectFiles.openocd && projectFiles.config) {
    const emptyConfig = new ExtensionConfiguration();
    const configFile = await readOrCreateConfigFile(emptyConfig);
    const openocdConfig = new OpenOCDConfiguration(configFile.targetMCU);
    await OpenOCDConfig.readOrCreateConfigFile(openocdConfig);
    OpenOCDConfig.changeProgrammerDialogue();
  }

  return true;
}
