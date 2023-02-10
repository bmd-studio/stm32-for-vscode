import { Uri } from 'vscode';
import { join } from 'path';
import which from 'which';

import BUILD_TOOL_DEFINITIONS, {
  BuildToolDefinitionKey,
} from './toolChainDefinitions';
import {
  validateXPMToolchainPath
} from './extensionToolchainHelpers';

import { ToolChain } from '../types/MakeInfo';
import { getExtensionSettings } from '../getInfo/getSettings';

function appendDefaultCommandWhenNotPresent(path: string, defaultCommand: string): string {
  const indexIs = path.lastIndexOf(defaultCommand);
  // check if the command is present and if it is present it is at the end
  if (indexIs < 0 || indexIs < (path.length - 1 - defaultCommand.length)) {
    return join(path, defaultCommand);
  }
  return path;
}
interface ExecutableWhichCheckI {
  path?: string;
  defaultCommand: string;
}
type BuildToolPath = string | undefined;
type BuildToolsPath = Record<BuildToolDefinitionKey, BuildToolPath>;
/**
 *  Checks a list of key values pairs to see if they return a path for which.
 *  @param executablesToCheck: An object where the keys are paths to exectables e.g. {armNoneEabi: 'arm-none-eabi-gcc'}
 *  @returns  returns and object with the original keys 
 *  however the value is undefined when no path is found or the found path if found
 */
async function executablesWhichCheck(
  executablesToCheck: Record<BuildToolDefinitionKey, ExecutableWhichCheckI | undefined>
): Promise<BuildToolsPath> {
  const checks = Object.entries(executablesToCheck).map(async ([key, value]) => {
    // check if value is defined if so check with which otherwise return undefined
    if (value?.path) {
      const appendedCommand = appendDefaultCommandWhenNotPresent(value.path, value.defaultCommand);
      if (appendedCommand === value.path) {
        // returns the path or undefined
        const result = await which(value.path, { nothrow: true }) || undefined;
        return [key, result];
      } else {
        // should check both paths
        const resultAppended = await which(appendedCommand, { nothrow: true }) || undefined;
        const resultUnmodified = await which(value.path, { nothrow: true }) || undefined;
        return [key, resultAppended || resultUnmodified];
      }
    }
    return [key, undefined];
  });
  const checkResults = await Promise.all(checks);
  return Object.fromEntries(checkResults);
}

/**
 * Converts the setting value of boolean, string or undefined to a ExecutableWhichCheckI output.
 * @param key: the build tool which to convert the setting for.
 * @returns  undefined or an instance of ExecutableWhichCheckI
 */
function setBuildToolFromSetting(
  key: BuildToolDefinitionKey,
  input: string | boolean | undefined
): undefined | ExecutableWhichCheckI {
  if (!input || input === true || input === '') {
    return undefined;
  }
  const output = {
    path: input,
    defaultCommand: BUILD_TOOL_DEFINITIONS[key].standardCmd,
  };
  return output;
}

export function checkIfAllBuildToolsArePresent(
  buildTools: BuildToolsPath | ToolChain
): boolean {

  const checks = Object.values(buildTools)
    .reduce((previous: boolean, value) => {
      if (previous && !value) {
        previous = false;
      }
      return previous;
    }, true);
  return checks;
}

function assignBuildToolsToToolchainPaths(paths: BuildToolsPath): ToolChain {
  const translation: Record<BuildToolDefinitionKey, keyof ToolChain> = {
    'arm': 'armToolchainPath',
    'gcc': 'gccPath',
    'openOCD': 'openOCDPath',
    'make': 'makePath',
  };

  const output = new ToolChain();
  Object.entries(paths).forEach(([key, value]) => {
    const outputKey: keyof ToolChain = translation[key as BuildToolDefinitionKey];
    output[outputKey] = value;
  });
  return output;
}
/**
 * Checks if the setting is already there and if not tries to check pre installed locations
 * @param settingsToolchain 
 */
export async function checkAutomaticallyInstalledBuildTools(
  toolsStoragePath: Uri
): Promise<ToolChain> {

  const xpmValidationPromises = Object.entries(BUILD_TOOL_DEFINITIONS)
    .map(async ([key, value]) => {
      const pathResult = await validateXPMToolchainPath(value, toolsStoragePath.fsPath);
      return [key, pathResult];
    });

  const xpmPaths = Object.fromEntries(
    await Promise.all(xpmValidationPromises)
  );

  return assignBuildToolsToToolchainPaths(xpmPaths);
}
function mergeToolchainPaths(
  mainToolchain: ToolChain,
  additionalToolchain: ToolChain
): ToolChain {
  const result: ToolChain = Object.fromEntries(
    Object.entries(mainToolchain)
      .map(([key, value]) => {
        const toolchainKey = key as keyof ToolChain;
        if (!value && additionalToolchain?.[toolchainKey]) {
          return [key, additionalToolchain[toolchainKey]];
        }
        return [key, value];
      })
  );
  return result;
}
/*
 * The steps for validating the toolchain are as follows
 * 1. Check settings paths
 * 2. Check for automatically installed tools by STM32 for VSCode
 * 3. Check the pre-installed tool paths in PATH 
*/
export async function getBuildTools(toolInstallationLocation: Uri): Promise<ToolChain> {
  const settings = getExtensionSettings();

  // settings
  const settingsExecutables: Record<BuildToolDefinitionKey, undefined | ExecutableWhichCheckI> = {
    arm: setBuildToolFromSetting('arm', settings.armToolchainPath),
    openOCD: setBuildToolFromSetting('openOCD', settings.openOCDPath),
    make: setBuildToolFromSetting('make', settings.makePath),
    gcc: setBuildToolFromSetting('gcc', settings.gccPath),
  };
  const checkedSettingExecutables = await executablesWhichCheck(settingsExecutables);
  const settingsToolchain = assignBuildToolsToToolchainPaths(checkedSettingExecutables);

  if (checkIfAllBuildToolsArePresent(settingsToolchain)) {
    return settingsToolchain;
  }

  // automatically installed tools.
  const automaticallyInstalledBuildTools = await checkAutomaticallyInstalledBuildTools(toolInstallationLocation);
  // add them to the current ones
  let updatedToolchain = mergeToolchainPaths(settingsToolchain, automaticallyInstalledBuildTools);
  if (checkIfAllBuildToolsArePresent(updatedToolchain)) {
    return updatedToolchain;
  }

  // tools that are in path
  const preInstalledPaths: Record<BuildToolDefinitionKey, ExecutableWhichCheckI> =
    Object.fromEntries(
      Object.entries(BUILD_TOOL_DEFINITIONS)
        .map(([key, value]) => {
          const buildKey = key as BuildToolDefinitionKey;
          return [buildKey, {
            path: value.standardCmd,
            defaultCommand: value.standardCmd,
          }];
        })
    ) as Record<BuildToolDefinitionKey, ExecutableWhichCheckI>;

  const preInstalled = await executablesWhichCheck(preInstalledPaths);
  const preInstalledToolchain = assignBuildToolsToToolchainPaths(preInstalled);
  updatedToolchain = mergeToolchainPaths(updatedToolchain, preInstalledToolchain);
  return updatedToolchain;
}

export async function hasBuildTools(toolInstallationLocation: Uri): Promise<boolean> {
  return checkIfAllBuildToolsArePresent(await getBuildTools(toolInstallationLocation));
}

