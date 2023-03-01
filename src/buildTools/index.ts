import { workspace, ConfigurationTarget, Uri, ExtensionContext } from 'vscode';
import { checkIfAllBuildToolsArePresent, getBuildTools } from './validateToolchain';
import { EXTENSION_NAME } from '../Definitions';
import { ToolChain } from '../types/MakeInfo';

/**
 * Sets up cortex debug to work with the paths STM32 for VSCode is given in the settings.
 * @param tools object containing toolchain paths
 */
export function setCortexDebugSettingsInWorkspace(tools: ToolChain): void {
  const cortexDebugSetting = workspace.getConfiguration('cortex-debug');
  if (
    cortexDebugSetting.get('armToolchainPath') &&
    cortexDebugSetting.get('armToolchainPath') !== tools.armToolchainPath
  ) {
    cortexDebugSetting.update('armToolchainPath', tools.armToolchainPath, ConfigurationTarget.Workspace);
  }
  if (cortexDebugSetting.get('openocdPath') && cortexDebugSetting.get('openocdPath') !== tools.openOCDPath) {
    cortexDebugSetting.update('openocdPath', tools.openOCDPath, ConfigurationTarget.Workspace);
  }
}

const GLOBAL_STATE_TOOLCHAIN_KEY = 'toolchain';

export function getToolChainFromGlobalState(context: ExtensionContext): ToolChain | undefined {
  const toolchain = context.globalState.get(GLOBAL_STATE_TOOLCHAIN_KEY);
  if (!toolchain) {
    return undefined;
  }
  return toolchain;
}

/**
 * Checks if the required build tools are present.
 * If so all is well in the world and it will update the global state of the extension with has relevant build tools
 * It will also add the build tools to the current workspace state for the extension for caching.
 * @param context vscode context which it uses to update state and check for the default installation location.
 * @returns true when all required build tools have been found
 */
export async function checkBuildTools(context: ExtensionContext): Promise<boolean> {
  // first get the configured installation location (default is the globalStorageUri path)
  // TODO: the globalState is persistent should be able to clear and check. might be nicer to do the workspaceState
  if (context.globalState.get('hasBuildTools', false)) {
    const storedToolchain = getToolChainFromGlobalState(context);
    if (storedToolchain) {
      console.log({ storedToolchain });
      return true;
    }
  }
  const workspaceConfiguration = workspace.getConfiguration(EXTENSION_NAME);
  const configurationInstallationPath = workspaceConfiguration.get('toolInstallationPath') || '';
  const installationPath = configurationInstallationPath === '' ?
    context.globalStorageUri : Uri.file(configurationInstallationPath as string);

  const buildToolchain = await getBuildTools(installationPath);
  const hasBuildTools = checkIfAllBuildToolsArePresent(buildToolchain);
  context.globalState.update('hasBuildTools', hasBuildTools);

  if (hasBuildTools) {
    setCortexDebugSettingsInWorkspace(buildToolchain);
    context.globalState.update(GLOBAL_STATE_TOOLCHAIN_KEY, buildToolchain);
  }
  return Promise.resolve(hasBuildTools);
}


