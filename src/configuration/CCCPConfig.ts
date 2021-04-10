import * as _ from 'lodash';
import * as shelljs from 'shelljs';

import { Uri, workspace, } from 'vscode';

import MakeInfo from '../types/MakeInfo';
import { writeFileInWorkspace } from '../Helpers';
import * as path from 'path';

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
 * Extracts the include paths from the MakeInfo and strips the -I
 * @param info MakeInfo containing all the info required for building the
 *     project
 */
export function getIncludePaths(info: MakeInfo): string[] {
  // TODO: rethink if -I should be included only in the makefile generation
  // process.
  const cIncludes = _.map(info.cIncludes, entry => _.replace(entry, '-I', ''));
  return cIncludes;
}

/**
 * Extracts the definitions from te makefile and strips the -D
 * @param info MakeInfo containing all the info required for building the
 *     project
 */
export function getDefinitions(
  info: { cDefs: string[]; cxxDefs: string[]; asDefs: string[] }): string[] {
  const cDefs = _.map(info.cDefs, entry => _.replace(entry, '-D', ''));
  const cxxDefs = _.map(info.cxxDefs, entry => _.replace(entry, '-D', ''));
  const asDefs = _.map(info.asDefs, entry => _.replace(entry, '-D', ''));
  let defs = _.concat(cDefs, cxxDefs, asDefs);
  defs = _.uniq(defs);
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
  if (!_.isString(armPath)) {
    armPath = '';
  }
  const relativeCompilerPath = path.join(armPath, compiler);
  const compilerPath = shelljs.which(relativeCompilerPath);
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
    includePath: getIncludePaths(info),
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
  return new Promise(async (resolve) => {
    const cCppWorkspaceConfigFiles =
      await workspace.findFiles('**/c_cpp_properties.json');
    if (cCppWorkspaceConfigFiles[0]) {
      const file = (await workspace.fs.readFile(cCppWorkspaceConfigFiles[0]));
      const parsedJSON = JSON.parse(Buffer.from(file).toString());
      resolve(parsedJSON);
      return;
    }
    resolve(null);
  });
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
  return new Promise(async (resolve) => {
    let configFile: CCppProperties = { configurations: [], version: 4 };
    let stmConfiguration = getCPropertiesConfig(info);
    let stmConfigIndex = 0;
    let needsUpdating = false;
    // check for the stm32 configuration and if not there add it.
    const currentConfigFile = await getWorkspaceConfigFile();
    if (currentConfigFile) {
      // configFile = defaultCCPPProperties;
      configFile = currentConfigFile;
      const index = _.findIndex(
        currentConfigFile.configurations, { name: stmConfiguration.name }
      );

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
    const includes = getIncludePaths(info);
    const definitions = getDefinitions(info);
    const oldConfig = _.cloneDeep(stmConfiguration);

    stmConfiguration.defines =
      _.uniq(stmConfiguration.defines.concat(definitions)).sort();
    stmConfiguration.includePath =
      _.uniq(stmConfiguration.includePath.concat(includes)).sort();
    stmConfiguration.compilerPath = getAbsoluteCompilerPath(info);
    configFile.configurations[stmConfigIndex] = stmConfiguration;

    if (!_.isEqual(stmConfiguration.defines, oldConfig.defines) ||
      !_.isEqual(stmConfiguration.includePath, oldConfig.includePath)
      || !_.isEqual(stmConfiguration.compilerPath, oldConfig.compilerPath)) {
      needsUpdating = true;
    }
    if (!needsUpdating) {
      resolve();
      return;
    }
    await writeFileInWorkspace(
      workspacePathUri, '.vscode/c_cpp_properties.json',
      JSON.stringify(configFile, null, 2));
    resolve();
  });
}


export default updateCProperties;