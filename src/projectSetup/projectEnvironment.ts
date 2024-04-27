/**
 * Handles the environment file used by STM32 for VSCode's makefile for setting up things like the compiler
 */
import { EXTENSION_NAME, STM32_ENVIRONMENT_FILE_NAME, makefileName } from '../Definitions';
import { ToolChain } from '../types/MakeInfo';
import { writeFileInWorkspace, getWorkspaceUri } from '../Helpers';
import { workspace, Uri } from 'vscode';



export async function createProjectEnvironmentFile(tools: ToolChain): Promise<void> {
  const workspaceUri = getWorkspaceUri();
  if (!workspaceUri || !tools.armToolchainPath || !tools.openOCDPath) {
    return;
  }
  const envFile = `# environment variable file used by ${EXTENSION_NAME} and the ${makefileName} makefile
# Other environment variables can be added here. If wanting to use the generated makefile in CI/CD context please
# configure the following variables: GCC_PATH, OPENOCD

ARM_GCC_PATH = ${tools.armToolchainPath}
OPENOCD = ${tools.openOCDPath}
 `;

  await writeFileInWorkspace(workspaceUri, STM32_ENVIRONMENT_FILE_NAME, envFile);
}

export async function hasProjectEnvironmentFile(): Promise<boolean> {
  const workspaceUri = getWorkspaceUri();
  if (!workspaceUri) {
    throw new Error('No current workspace selected');
  }
  try {
    const currentEnvFile = await workspace.fs.readFile(Uri.file(STM32_ENVIRONMENT_FILE_NAME));
    if (currentEnvFile.length > 0) {
      return true;
    }
  } catch (err) {
    return false;
  }
  return false;
}
