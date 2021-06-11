import { workspace, Uri, window } from 'vscode';
import * as stripComments from 'strip-comments';
import { join } from 'path';
/**
 * Separates definitions from files. If a define comes with a . at the beginning it is considered as a file
 * @param definitions unfiltered list of includes
 * @returns a filterd list of includes and .include files
 */
export function filterDotDefinitionFiles(definitions: string[]): { definitions: string[], dotDefinitions: string[] } {
  const filteredDefinitions = definitions.filter((def) => (def.charAt(0) !== '.'));
  const dotDefinitions = definitions.filter((def) => (def.charAt(0) === '.'));
  return {
    definitions: filteredDefinitions,
    dotDefinitions,
  };
}

/**
 * Gets NAME=VALUE pairs from a file and ignores comments.
 * @param file input include file, which is a DEFINTION=VALUE file separated by new lines. Can have # comments
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

/**
 * Gets the definitions and definitions from the files from the files indicated by a predicating dot
 * @param definitions list of definitions, which can contain files which are indicated by a preceding dot.
 */
export async function getDefinitionsandDefinitionsFromFile(
  definitions: string[],
  workspaceLocation: string
): Promise<string[]> {
  const filteredDefinitions = filterDotDefinitionFiles(definitions);
  const definitionFilePromises = filteredDefinitions.dotDefinitions.map((fileName) => {
    const absoluteFilePath = join(workspaceLocation, fileName);
    return workspace.fs.readFile(Uri.file(absoluteFilePath));
  });
  try {
    const definitionFiles = await Promise.all(definitionFilePromises);
    const includesFromFiles = definitionFiles.map((file) => {
      return getDefinitionsFromFile(Buffer.from(file).toString('utf8'));
    });
    includesFromFiles.forEach((defs) => {
      filteredDefinitions.definitions = filteredDefinitions.definitions.concat(defs);
    });

  } catch (err) {
    window.showErrorMessage(
      `An error occured while reading the provided .include files, please make sure the file is present. Error: ${err}`
    );
  }
  return filteredDefinitions.definitions;
}