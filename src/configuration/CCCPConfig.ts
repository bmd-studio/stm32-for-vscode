import * as path from 'path';
 

import { Uri, window, workspace } from 'vscode';
import {isEqual, isString, uniq} from 'lodash';

import MakeInfo from '../types/MakeInfo';
import { which, writeFileInWorkspace } from '../Helpers';

export interface CCppConfig {
  name: string;
  compilerPath?: string;
  cStandard?: string;
  cppStandard?: string;
  includePath: string[];
  defines: string[];
}

export interface CCppProperties {
  configurations: CCppConfig[];
  version: number;
}

/**
 * Extracts the definitions from te makefile and strips the -D
 * @param info MakeInfo containing all the info required for building the
 *     project
 */
export function getDefinitions(
  info: { cDefs: string[]; cxxDefs: string[]; asDefs: string[] }): string[] {
  const cDefs = info.cDefs.map(entry => entry.replace('-D', ''));
  const cxxDefs = info.cxxDefs.map(entry => entry.replace('-D', ''));
  const asDefs = info.asDefs.map( entry => entry.replace( '-D', ''));
  let defs = [...cDefs, ...cxxDefs, ...asDefs];
  defs = uniq(defs);
  defs = defs.sort();
  return defs;
}

/**
 * @description function for getting the absolute compiler path
 * @param info MakeInfo containing all the info required for building the
 *     project
 */
export function getAbsoluteCompilerPath(info: MakeInfo): string {
  const compiler = info.language === 'C' ? 'arm-none-eabi-gcc' : 'arm-none-eabi-g++';
  let armPath = info.tools.armToolchainPath;
  if (!isString(armPath)) {
    armPath = '';
  }
  const relativeCompilerPath = path.join(armPath, compiler);
  const compilerPath = which(relativeCompilerPath);
  if(!compilerPath) {
    throw new Error(
      // eslint-disable-next-line max-len
      "Getting the absolute compiler path failed. Please create an issue on the STM32 for VSCode GitHub if you encounter this."
    );
  }
  return compilerPath;
}

/**
 * Function for getting the basic configuration for STM32 for the
 * c_cpp_properties file
 * @param info MakeInfo containing all the info required for building the
 *     project
 */
export function getCPropertiesConfig(info: MakeInfo): CCppConfig {
  const config = {
    name: 'STM32',
    includePath: info.cIncludes,
    defines: getDefinitions(info),
    compilerPath: getAbsoluteCompilerPath(info),
  };
  return config;
}


/**
 * @description Gets the c_cpp_properties.json file from the current workspace.
 * @Note This cannot be done by workpace.getConfiguration as it is not a standard .vscode configuration.
 */
export async function getWorkspaceConfigFile(): Promise<null | CCppProperties> {
  const cCppWorkspaceConfigFiles =
    await workspace.findFiles('**/c_cpp_properties.json');
  if (cCppWorkspaceConfigFiles[0]) {
    try {
      const file = (await workspace.fs.readFile(cCppWorkspaceConfigFiles[0]));
      const parsedJSON = JSON.parse(Buffer.from(file).toString());
      return parsedJSON;
    } catch (err) {
      window.showErrorMessage(`Something went wrong with parsing the c_cpp_properties.json: ${err}`);
    }


  }
  return null;
}

/**
 * Updates the c_cpp_properties.json file if there are changes.Currently it
 * works additively so once an include path or definition is added it wil not
 * disappear
 * @param workspacePathUri Uri to the current workspace
 * @param info  MakeInfo containing all the info required for building the
 *     project
 */
export async function updateCProperties(workspacePathUri: Uri, info: MakeInfo): Promise<void> {
  let configFile: CCppProperties = { configurations: [], version: 4 };
  let stmConfiguration = getCPropertiesConfig(info);
  let stmConfigIndex = 0;
  let needsUpdating = false;
  // check for the stm32 configuration and if not there add it.
  const currentConfigFile = await getWorkspaceConfigFile();
  if (currentConfigFile) {
    // configFile = defaultCCPPProperties;
    configFile = currentConfigFile;
    const index = 
      currentConfigFile.configurations.findIndex((entry) => entry.name === stmConfiguration.name);

    if (index >= 0) {
      stmConfigIndex = index;
      stmConfiguration = currentConfigFile.configurations[index];
    } else {
      // no file has been found and should be added to the configurations
      configFile.configurations.push(stmConfiguration);  // push default
      // config
      stmConfigIndex = configFile.configurations.length - 1;
      needsUpdating = true;
    }
  } else {
    stmConfigIndex = 0;
    // pushes the default define in the upper scope
    configFile.configurations.push(stmConfiguration);
    needsUpdating = true;
  }
  const includes = info.cIncludes;
  const definitions = getDefinitions(info);
  const oldConfig = {...stmConfiguration};

  stmConfiguration.defines = uniq([...definitions]).sort();
  stmConfiguration.includePath = uniq([...includes]).sort();
  stmConfiguration.compilerPath = getAbsoluteCompilerPath(info);

  configFile.configurations[stmConfigIndex] = stmConfiguration;

  if (!isEqual(stmConfiguration.defines, oldConfig.defines) ||
    !isEqual(stmConfiguration.includePath, oldConfig.includePath)
    || !isEqual(stmConfiguration.compilerPath, oldConfig.compilerPath)) {
    needsUpdating = true;
  }
  if (!needsUpdating) {
    return;
  }
  await writeFileInWorkspace(
    workspacePathUri, '.vscode/c_cpp_properties.json',
    JSON.stringify(configFile, null, 2));
}


export default updateCProperties;