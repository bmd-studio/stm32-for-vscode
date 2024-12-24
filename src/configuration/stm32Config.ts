import * as Helpers from '../Helpers';
import * as YAML from 'yaml';
import * as path from 'path';
import * as vscode from 'vscode';

import { ExtensionConfiguration, ExtensionConfigurationInterface } from '../types/MakeInfo';

import { EXTENSION_CONFIG_NAME } from '../Definitions';

const DEFAULT_SOURCES = ['Src/**', 'Core/Src/**', 'Core/Lib/**'];
const DEFAULT_INCLUDES = ['Inc/**', 'Core/Inc/**', 'Core/Lib/**'].concat(DEFAULT_SOURCES);

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

  info.forEach((entry) => {
    let entryToWrite = entry;
    // check for * icons at the start this is reserved in yaml
    if (entry.indexOf('*') === 0) {
      entryToWrite = `"${entry}"`;
    }
    output += `${prepend}${entryToWrite}\n`;
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
cpu: ${config.cpu} # type of cpu e.g. cortex-m4
fpu: ${config.fpu} # Defines how floating points are defined. Can be left empty.
floatAbi: ${config.floatAbi}
ldscript: ${config.ldscript} # linker script

# Compiler definitions. The -D prefix for the compiler will be automatically added.
cDefinitions: ${createYamlArray(config.cDefinitions)}
cxxDefinitions: ${createYamlArray(config.cxxDefinitions)}
asDefinitions: ${createYamlArray(config.asDefinitions)}

# Compiler definition files. you can add a single files or an array of files for different definitions.
# The file is expected to have a definition each new line.
# This allows to include for example a .definition file which can be ignored in git and can contain
# This can be convenient for passing along secrets at compile time, or generating a file for per device setup.
cDefinitionsFile:
cxxDefinitionsFile:
asDefinitionsFile:

# Compiler flags
cFlags: ${createYamlArray(config.cFlags)}
cxxFlags: ${createYamlArray(config.cxxFlags)}
assemblyFlags: ${createYamlArray(config.assemblyFlags)}
linkerFlags: ${createYamlArray(config.linkerFlags)}

# libraries to be included. The -l prefix to the library will be automatically added.
libraries: ${createYamlArray(config.libraries)}
# Library directories. Folders can be added here that contain custom libraries.
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

# Custom makefile rules
# Here custom makefile rules can be added to the STM32Make.make file
# an example of how this can be used is commented out below.
customMakefileRules:
# - command: sayhello
#   rule: echo "hello"
#   dependsOn: $(BUILD_DIR)/$(TARGET).elf # can be left out    

# Additional flags which will be used when invoking the make command
makeFlags:
# - -O  # use this option when the output of make is mixed up only works for make version 4.0 and upwards
# - --silent # use this option to silence the output of the build
    `
  );
}



export async function writeConfigFile(config: ExtensionConfiguration): Promise<void> {
  const configFile = createConfigFile(config);
  const workspaceFolderUri = Helpers.getWorkspaceUri();
  if (!workspaceFolderUri) { throw new Error('No workspace folder selected'); }
  await Helpers.writeFileInWorkspace(workspaceFolderUri, EXTENSION_CONFIG_NAME, configFile);
}

/**
 * 
 * @param config The STM32 for VScode Extension configuration
 */
export async function writeDefaultConfigFile(config: ExtensionConfiguration): Promise<ExtensionConfiguration> {
  // default configFiles.
  const configFileWithAddedDefaults = Object.assign(new ExtensionConfiguration(), config);
  configFileWithAddedDefaults.sourceFiles = [...configFileWithAddedDefaults.sourceFiles, ...DEFAULT_SOURCES];
  configFileWithAddedDefaults.includeDirectories = [
    ...configFileWithAddedDefaults.includeDirectories,
    ...DEFAULT_INCLUDES
  ];
  await writeConfigFile(configFileWithAddedDefaults);
  return configFileWithAddedDefaults;
}

/**
 * read the stm32-for-vscode.config.yaml from disk
 * @returns return the stm32-for-vscode.config.yaml in string format
 */
export async function getConfigFileFromWorkspace(): Promise<string> {
  const workspaceFolderUri = Helpers.getWorkspaceUri();
  if (!workspaceFolderUri) { return Promise.reject(new Error('No workspace folder selected')); }
  const configurationPath = path.resolve(workspaceFolderUri.fsPath, EXTENSION_CONFIG_NAME);
  const file = await vscode.workspace.fs.readFile(vscode.Uri.file(configurationPath));
  if (!file) { throw new Error('No configuration file found'); }
  return Buffer.from(file).toString('utf-8');
}

/**
 * reads and parses the stm32-for-vscode.config.yaml file
 * @returns The configuration of the current project
 */
export async function readConfigFile(): Promise<string> {
  try {
    const file = await getConfigFileFromWorkspace();
    return file;
  } catch (err) {
    throw err;
  }
}

/**
 * Parses the STM32 for VSCode configuration file.
 * @param configurationFile The configuration file in string format which will be parsed
 * @returns ExtensionConfiguration or throws an error when it cannot parse it.
 */
export function parseConfigfile(configurationFile: string): ExtensionConfiguration {
  const configuration = new ExtensionConfiguration();
  try {
    const yamlConfig: ExtensionConfigurationInterface = YAML.parse(configurationFile);
    if (!yamlConfig) { new Error('Could not parse yaml configuration');}
    console.log({yamlConfig});
    Object.keys(yamlConfig).forEach(
      (key) => {
        const entry = yamlConfig[key as keyof ExtensionConfigurationInterface];
        if ( entry && entry !== null ) {
          configuration[key as keyof ExtensionConfigurationInterface] = entry as never; 
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
  let configFile: string = '';
  try {
    configFile = await readConfigFile();
  } catch (error) {
  // if no config file is present. Create a new one.
    try {
      const newConfig = await writeDefaultConfigFile(config);
      return newConfig;
    } catch (error) {
      vscode.window.showErrorMessage(`Something went wrong with writing the configuration file: ${error}`);
      throw error;
    }
  }

  try {
    const configuration = parseConfigfile(configFile);
    return configuration;
  } catch (error) {
    vscode.window.showErrorMessage(
      `Could not parse: ${EXTENSION_CONFIG_NAME}, it generated the following error messages: ${error}`
    );
    throw error;
  }
}