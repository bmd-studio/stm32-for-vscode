import * as Helpers from '../Helpers';
import * as YAML from 'yaml';
import * as _ from 'lodash';
import * as path from 'path';
import * as vscode from 'vscode';

import { EXTENSION_CONFIG_NAME } from '../Definitions';
import { ExtensionConfiguration } from '../types/MakeInfo';

const DEFAULT_SOURCES = ['Src/**', 'Core/Src/**', 'Core/Lib/**'];
const DEFAULT_INCLUDES = ['Inc/**', 'Core/Inc/**', 'Core/Lib/**'];

/**
 * Converts arrays of string into indented - value\n lists to adhere to YAML formatting
 * @note If an empty array is padded, "[]" will be outputted. 
 * @param info the array of string to be converted
 */
export function createYamlArray(info: string[]): string {
  if (info.length === 0) {
    return '[]';
  }
  let output = '\n';
  const prepend = '  - ';

  info.map((entry) => {
    output += `${prepend}${entry}\n`;
  });
  return output;
}

/**
 * Creates a configuration file for STM32 For VSCode
 * @param config configuration to be created
 */
export function createConfigFile(config: ExtensionConfiguration): string {
  return (
    `# Configuration file for the STM32 for VSCode extension
# Arrays can be inputted in two ways. One is: [entry_1, entry_2, ..., entry_final]
# or by adding an indented list below the variable name e.g.:
# VARIABLE:
# - entry_1
# - entry_2

# The project name
target: ${config.target}
# Can be C or C++
language: ${config.language}

optimization: ${config.optimization}

# MCU settings
targetMCU: ${config.targetMCU}
cpu: ${config.cpu}
fpu: ${config.fpu}
floatAbi: ${config.floatAbi}
ldscript: ${config.ldscript} # linker script

# Compiler definitions. The -D prefix for the compiler will be automatically added.
cDefinitions: ${createYamlArray(config.cDefinitions)}
cxxDefinitions: ${createYamlArray(config.cxxDefinitions)}
asDefinitions: ${createYamlArray(config.asDefinitions)}

# Compiler flags
cFlags: ${createYamlArray(config.cFlags)}
cxxFlags: ${createYamlArray(config.cxxFlags)}
assemblyFlags: ${createYamlArray(config.assemblyFlags)}

# libraries to be included. The -l prefix to the library will be automatically added.
# Mind that non standard libraries should have a path to their respective directory.
libraries: ${createYamlArray(config.libraries)}
libraryDirectories: ${createYamlArray(config.libraryDirectories)}

# Files or folders that will be excluded from compilation.
# Glob patterns (https://www.wikiwand.com/en/Glob_(programming)) can be used.
# Do mind that double stars are reserved in yaml
# these should be escaped with a: \\ or the name should be in double quotes e.g. "**.test.**"
excludes: ${createYamlArray(config.excludes)}

# Include directories (directories containing .h or .hpp files)
# If a CubeMX makefile is present it will automatically include the include directories from that makefile.
includeDirectories: ${createYamlArray(config.includeDirectories)}

# Files that should be included in the compilation.
# If a CubeMX makefile is present it will automatically include the  c and cpp/cxx files from that makefile.
# Glob patterns (https://www.wikiwand.com/en/Glob_(programming)) can be used.
# Do mind that double stars are reserved in yaml
# these should be escaped with a: \\ or the name should be in double quotes e.g. "HARDWARE_DRIVER*.c"
sourceFiles:  ${createYamlArray(config.sourceFiles)}

# When no makefile is present it will show a warning pop-up.
# However when compilation without the CubeMX Makefile is desired, this can be turned of.
suppressMakefileWarning: ${config.suppressMakefileWarning}
    `
  );
}



export async function writeConfigFile(config: ExtensionConfiguration): Promise<void> {
  const configFile = createConfigFile(config);
  const workspaceFolderUri = Helpers.getWorkspaceUri();
  if (!workspaceFolderUri) { throw new Error('No workspace folder selected'); }
  try {
    await Helpers.writeFileInWorkspace(workspaceFolderUri, EXTENSION_CONFIG_NAME, configFile);
  } catch(err) {
    throw err;
  }
}

/**
 * 
 * @param config The STM32 for VScode Extension configuration
 */
export async function writeDefaultConfigFile(config: ExtensionConfiguration): Promise<ExtensionConfiguration> {
  // default configFiles.
  const configFileWithAddedDefaults = _.cloneDeep(config);
  configFileWithAddedDefaults.sourceFiles = _.concat(configFileWithAddedDefaults.sourceFiles, DEFAULT_SOURCES);
  configFileWithAddedDefaults.includeDirectories = _.concat(
    configFileWithAddedDefaults.includeDirectories,
    DEFAULT_INCLUDES
  );
  configFileWithAddedDefaults.assemblyFlags = _.concat(
    configFileWithAddedDefaults.assemblyFlags,
    ['-specs=nosys.specs']
  );

  try {
    await writeConfigFile(configFileWithAddedDefaults);
  } catch(error) {
    throw error;
  }
  return configFileWithAddedDefaults;
}

const PARSE_YAML_ERROR_MESSAGE = 'Could not parse yaml configuration';

export async function readConfigFile(): Promise<ExtensionConfiguration> {
  const workspaceFolderUri = Helpers.getWorkspaceUri();
  if (!workspaceFolderUri) { return Promise.reject(new Error('No workspace folder selected')); }
  const configuration = new ExtensionConfiguration();
  const configurationPath = path.resolve(workspaceFolderUri.fsPath, EXTENSION_CONFIG_NAME);
  try {
    const file = await vscode.workspace.fs.readFile(vscode.Uri.file(configurationPath));
    if (!file) { throw new Error('No configuration file found'); }
    const yamlConfig = YAML.parse(Buffer.from(file).toString('utf-8'));
    if (!yamlConfig) { return Promise.reject(new Error('Could not parse yaml configuration')); }
    _.forEach(yamlConfig, (entry, key) => {
      if (_.has(yamlConfig, key)) {
        _.set(configuration, key, entry);
      }
    });
  } catch (err) {
    if (err) {
      throw err;
    }
  }
  return configuration;
}

/**
 * Read the STM32 for VSCOde configuration file, creates one when none is present.
 * @note When a corrupt file is present it will return the passed configuration.
 * @param config: This should be a standard configuration file with information from the Makefile added 
 */
export async function readOrCreateConfigFile(config: ExtensionConfiguration): Promise<ExtensionConfiguration> {
  const workspaceFolderUri = Helpers.getWorkspaceUri();
  if (!workspaceFolderUri) { return config; }
  try {
    const configFile = await readConfigFile();
    return configFile;
  } catch (err) {
    // no config file present
    if (err.message === PARSE_YAML_ERROR_MESSAGE) {
      vscode.window.showErrorMessage(
        `Could not parse: ${EXTENSION_CONFIG_NAME}, please check for Errors or delete it so it can be regenerated`
      );
      return config; // returns the standard configuration
    }
  }

  // if no config file is present. Create a new one.
  try {
    const newConfig = await writeDefaultConfigFile(config);
    return newConfig;
  } catch (err) {
    vscode.window.showErrorMessage(`Something went wrong with writing the configuration file: ${err}`);
  }
  return config;

}