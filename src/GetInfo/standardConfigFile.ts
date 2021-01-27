import MakeInfo, {ExtensionConfiguration} from '../types/MakeInfo';
import * as YAML from 'yaml';
import * as vscode from 'vscode';
import * as path from 'path';
import {writeFileInWorkspace} from '../Helpers';
import { YAMLSeq } from 'yaml/types';

const configuration = new ExtensionConfiguration();
configuration.target = 'test_firmware';
configuration.cpu = '-mcpu=cortex-m7';
configuration.fpu  = '-mfpu=fpv5-d16';
configuration.floatAbi = '-mfloat-abi=hard';
configuration.mcu = '-mthumb';
configuration.ldscript = 'STM32F769IITx_FLASH.ld';
configuration.targetMCU = 'stm32f7x';
configuration.cDefinitions = configuration.cDefinitions.concat(['STM32F769xx', 'USE_HAL_DRIVER']);
configuration.sourceFiles.push('startup_stm32f769xx.s');
configuration.sourceFiles = configuration.sourceFiles.concat([
  'Src/main.c',
  'Src/stm32h7xx_it.c',
  'Src/stm32h7xx_hal_msp.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_cortex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_eth.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_eth_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_tim.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_tim_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_uart.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_uart_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pcd.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pcd_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_ll_usb.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_rcc.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_rcc_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_flash.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_flash_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_gpio.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_hsem.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_dma.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_dma_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_mdma.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pwr.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pwr_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_i2c.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_i2c_ex.c',
  'Src/system_stm32h7xx.c',
]);


/**
 * Converts arrays of string into indented - value\n lists to adhere to YAML formatting
 * @note If an empty array is padded, "[]" will be outputted. 
 * @param info the array of string to be converted
 */
export function createYamlArray(info: string[]): string {
  if(info.length === 0) {
    return '[]';
  }
  let output = '\n';
  const prepend = '  - ';

  info.map((entry) => {
    output += `${prepend}${entry}\n`;
  });
  return output;
}


export function createConfigFile(config: ExtensionConfiguration): string {
  return (
    `# Configuration file for the STM32 for VSCode extension
# Arrays can be inputted in two ways. One is: [entry_1, entry_2, ..., entry_final]
# or by adding an indented list below the variable name e.g.:
# VARIABLE:
# - entry_1
# - entry_2

# The project name
target: test_firmware
# Can be C or C++
language: ${config.language}

# MCU settings
targetMCU: ${config.targetMCU}
cpu: ${config.cpu}
fpu: ${config.fpu}
floatAbi: ${config.floatAbi}
mcu: ${config.mcu}
ldscript: ${config.ldscript}

# Compiler definitions. The -D prefix for the compiler will be automatically added.
cDefinitions: ${createYamlArray(config.cDefinitions)}
cxxDefinitions: ${createYamlArray(config.cxxDefinitions)}
asDefinitions: ${createYamlArray(config.asDefinitions)}

# Compiler flags
cFlags: ${createYamlArray(config.cFlags)}
cxxFlags: ${createYamlArray(config.cxxFlags)}
assemblyFlags: ${createYamlArray(config.assemblyFlags)}
ldFlags: ${createYamlArray(config.ldFlags)}

# libraries to be included. The -l prefix to the library will be automatically added.
# Mind that non standard libraries should have a path to their respective directory.
libraries: ${createYamlArray(config.libraries)}
libraryDirectories: ${createYamlArray(config.libraryDirectories)}

# Files or folders that will be excluded from compilation. Can be overwritten by including them in sourceFiles.
# Glob patterns (https://www.wikiwand.com/en/Glob_(programming)) can be used. Do mind that double stars are reserved in yaml
# these should be escaped with a: \\ or the name should be in double quotes e.g. "**.test.**"
excludes: ${createYamlArray(config.excludes)}

# Include directories (directories containing .h or .hpp files)
# If a CubeMX makefile is present it will automatically include the include directories from that makefile.
includeDirectories: ${createYamlArray(config.includeDirectories)}

# Files that should be included in the compilation.
# If a CubeMX makefile is present it will automatically include the  c and cpp/cxx files from that makefile.
# Glob patterns (https://www.wikiwand.com/en/Glob_(programming)) can be used. Do mind that double stars are reserved in yaml
# these should be escaped with a: \\ or the name should be in double quotes e.g. "HARDWARE_DRIVER*.c"
sourceFiles:  ${createYamlArray(config.sourceFiles)},

# When no makefile is present it will show a warning pop-up.
# However when compilation without the CubeMX Makefile is desired, this can be turned of.
suppressMakefileWarning: ${config.suppressMakefileWarning}
    `
  );
}
// configuration.

const yamlConfig = new YAML.Document();

// yamlConfig.add(otherConfig);
// yamlConfig.
// yamlConfig.add(configuration);
// yamlConfig.get('target').


const jsonConfig = JSON.stringify(configuration, null, 2);

export function writeConfigToLocation(location: string): void {
  // const yamlPath = path.join(location, 'STM32-for-VSCode.config.yml');
  // const jsonPath = path.join(location, 'STM32-for-VSCode.config.json');
  // if(!yamlConfig.contents) {return;}
  // yamlConfig.commentBefore = 'STM32 For VSCode configuration file';
  // yamlConfig.get('target').comment = 'Name of the project';
  console.log('yamlConfig', yamlConfig);
  
  // const doc =  new YAML.Document(YAML.defaultOptions).add(otherConfig);
  // console.log({doc});
  const otherConfig = YAML.createNode(configuration);
  console.log('yaml node', otherConfig);
  const configFile = createConfigFile(configuration);
  console.log({configFile});
  console.log('configuration', configuration);

  writeFileInWorkspace(vscode.Uri.file(location), 'STM32-for-VSCode.config.yaml', configFile);
  writeFileInWorkspace(vscode.Uri.file(location), 'STM32-for-VSCode.config.json', jsonConfig);
}


// TODO: split up the makeinfo type so it can be intergrated into this more easily
// export class StandardConfig {
//   public target = '';
//   public cpu = '';
//   public fpu = '';
//   public floatAbi = '';
//   public mcu = '';
//   public ldscript = '';
//   public targetMCU = '';
//   public language = 'C' as STM32Languages;
//   public libDirs: string[] = [];
//   public libs: string[] = [];
//   public cDefs: string[] = [];
//   public cxxDefs: string[] = [];
//   public asDefs: string[] = [];
//   public excludes: string[];
//   public compilerFlags: string[];
//   public constructor() {
//     // super();
//     this.excludes = [];
//     this.compilerFlags = [];
//   }
// }
