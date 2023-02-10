import { workspace, Uri, window } from 'vscode';
import stripComments from 'strip-comments';
import { join } from 'path';
/**
 * Gets NAME=VALUE pairs from a file and ignores comments.
 * @param file input include file, which is a DEFINITION=VALUE file separated by new lines. Can have # comments
 * @returns the include name value pairs in an array
 */
export function getDefinitionsFromFile(file: string): string[] {
  const expression = /^.+/gm;
  const whiteSpaceBefore = /^\W+/gm;
  const fileWithoutComments = stripComments(file);
  const fileWithSpacesBeforeStripped = fileWithoutComments.replace(whiteSpaceBefore, '');
  const resultingList = fileWithSpacesBeforeStripped.match(expression);
  if (!resultingList) {
    return [];
  }
  return resultingList;
}

export default async function getDefinitionsFromFiles(
  workspaceLocation: string, files?: string[] | string
): Promise<string[]> {
  let output: string[] = [];
  if (!files) {
    return output;
  }
  const fileArray = typeof files === 'string' ? [files] : files;
  const filePromises = fileArray.map((file) => {
    const absoluteFilePath = join(workspaceLocation, file);
    return workspace.fs.readFile(Uri.file(absoluteFilePath));
  });
  try {
    const definitionFiles = await Promise.all(filePromises);
    const includesFromFiles = definitionFiles.map((file) => {
      return getDefinitionsFromFile(Buffer.from(file).toString('utf8'));
    });
    includesFromFiles.forEach((defs) => {
      output = output.concat(defs);
    });

  } catch (err) {
    window.showErrorMessage(
      `An error occurred while reading the provided .include files, please make sure the file is present. Error: ${err}`
    );
  }
  return output;

}


