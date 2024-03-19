/**
 * Create a gitignore file if none exists. If one exists it adds the entries in there
 */

import { STM32_ENVIRONMENT_FILE_NAME, GITIGNORE_FILE_NAME } from "../Definitions";
import { getWorkspaceUri, writeFileInWorkspace } from "../Helpers";
import { join } from 'path';
import { workspace, commands, Uri, window, Disposable } from 'vscode';

const GITIGNORE_ENTRIES = [
  {
    comment: 'OS specific',
    patterns: [
      '.DS_Store'
    ]
  },
  {
    comment: 'STM32 for VSCode Specific',
    patterns: [
      STM32_ENVIRONMENT_FILE_NAME,
      'build',
      '.vscode',
    ]
  },
  {
    comment: 'Dependency files',
    patterns: [
      '*.d'
    ]
  },
  {
    comment: 'Object files',
    patterns: [
      '*.o',
      '*.ko',
      '*.obj',
    ]
  },
  {
    comment: 'Linker output',
    patterns: [

      '*.map',
    ]
  },
  {
    comment: 'Executables',
    patterns: [

      '*.exe',
      '*.out',
      '*.app',
      '*.i*86',
      '*.x86_64',
      '*.hex',
      '*.bin',
      '*.elf',
    ]
  },
  {
    comment: 'Debug files',
    patterns: [
      '*.dSYM',
      '*.su',
      '*.idb',
      '*.pdb',
    ]
  }
];

//  generates the gitignore file
function generateGitignoreFile(): string {
  const gitignoreFile = GITIGNORE_ENTRIES.reduce((previousValue, currentValue) => {

    const gitignoreEntry = `
# ${currentValue.comment}
${currentValue.patterns.map((pattern) => `${pattern}\n`)}

`;
    return previousValue + gitignoreEntry;
  }, '');

  return gitignoreFile;
}

async function createGitignore(): Promise<void> {
  const workspaceUri = getWorkspaceUri();
  if (!workspaceUri) { return Promise.resolve(); }
  const gitignoreFile = generateGitignoreFile();
  return writeFileInWorkspace(workspaceUri, GITIGNORE_FILE_NAME, gitignoreFile);
}

async function checkIfGitignoreExists(): Promise<boolean> {
  const workspaceUri = getWorkspaceUri();
  if (!workspaceUri) { return false; }
  const gitignorePath = join(workspaceUri.fsPath, GITIGNORE_FILE_NAME);
  try {
    const fileStatus = await workspace.fs.stat(Uri.file(gitignorePath));
    if (!fileStatus) { return false; }
    return true;
  } catch (err) {
    return false;
  }
}

export function registerGitignoreCommand(): Disposable {
  return commands.registerCommand('stm32-for-vscode.createGitIgnoreFile',
    async () => {
      const gitignoreExists = await checkIfGitignoreExists();
      if (!gitignoreExists) {
        try {
          await createGitignore();
        } catch (error) {
          window.showErrorMessage(`Something went wrong with creating the .gitignore file. Error: ${error}`);
        }
      }
    }
  );
}