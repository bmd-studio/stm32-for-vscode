import getCubeProjectInfo from './getInfo/STM32CubeIDE';
import setDefaults from './getInfo/defaultInfo';
import { ExtensionConfiguration } from './types';
import { writeConfigFile } from './configuration/stm32Config';
import * as vscode from 'vscode';
// FIXME: when converting file paths there seems to be an issue with the deepness of the file paths.
export default async function importAndSetupCubeIDEProject(): Promise<void> {
  try {
    const cubeProjectInfo = await getCubeProjectInfo();
    const withDefaults = setDefaults(cubeProjectInfo);
    const configFile = new ExtensionConfiguration();
    configFile.importRelevantInfoFromMakefile(withDefaults);
    await writeConfigFile(configFile);
  } catch (error) {
    vscode.window.showErrorMessage(`Something went wrong with importing the project. Error: ${error}`);
  }
}