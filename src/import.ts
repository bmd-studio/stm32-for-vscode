import getCubeProjectInfo from './getInfo/STM32CubeIDE';
import setDefaults from './getInfo/defaultInfo';
import { ExtensionConfiguration } from './types';
import { writeDefaultConfigFile } from './configuration/stm32Config';
import * as vscode from 'vscode';

export default async function importAndSetupCubeIDEProject(): Promise<void> {
  try {
    const cubeProjectInfo = await getCubeProjectInfo();
    const withDefaults = setDefaults(cubeProjectInfo);
    const configFile = new ExtensionConfiguration();
    configFile.importRelevantInfoFromMakefile(withDefaults);
    if (configFile.cpu === undefined || configFile.cpu === 'undefined') {
      const core = await vscode.window.showQuickPick([
        'cortex-m0', 'cortex-m0+', 'cortex-m3', 'cortex-m4', 'cortex-m7', 'cortex-m33', 'cortex-m55'
      ], { title: 'please select a processor core type' });
      if (core) {
        configFile.cpu = core;
      }
    }
    await writeDefaultConfigFile(configFile);
  } catch (error) {
    vscode.window.showErrorMessage(`Something went wrong with importing the project. Error: ${error}`);
  }
}