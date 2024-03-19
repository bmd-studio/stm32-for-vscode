import { window } from 'vscode';
import { ExtensionConfiguration } from '../types';
import { cpus, targetsMCUs } from '../configuration/ConfigInfo';
import { writeConfigFile } from '../configuration/stm32Config';

/**
 * User facing  dialog for creating an empty project setup
 * @returns true when project is setup, throws and error of false when it failed.
 */
export async function emptyProjectSetupPrompt(): Promise<boolean> {
  const response = await window.showInformationMessage(
    // eslint-disable-next-line max-len
    'Makefile was not found. If using CubeMX please select generate makefile under:Project Manager>Project/Toolchain IDE. Or do you want to generate a blank stm32-config-yaml file, so a custom project can be configured?',
    'Cancel',
    'Generate config file'
  );
  if (response === 'Generate config file') {
    const targetMCU = await window.showQuickPick(targetsMCUs, {
      title: 'Pick a target MCU',
    });
    const targetCPU = await window.showQuickPick(cpus, {
      title: 'pick a target cpu architecture',
    });
    const ldScript = await window.showInputBox({
      title: 'linker script',
      prompt: 'please enter the name/path to the linker script'
    });
    const standardConfig: ExtensionConfiguration = new ExtensionConfiguration();
    if (targetMCU) {
      standardConfig.targetMCU = targetMCU;
    }
    if (targetCPU) {
      standardConfig.cpu = targetCPU;
    }
    if (ldScript) {
      standardConfig.ldscript = ldScript;
    }
    await writeConfigFile(standardConfig);
  } else {
    return false;
  }
  return true;
}