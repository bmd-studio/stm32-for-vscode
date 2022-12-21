import { workspace, Uri, FileType } from 'vscode';
import { join } from 'path';
import { scanForFiles, sortFiles, SOURCE_FILE_EXTENSIONS, HEADER_FILE_EXTENSIONS } from '../getInfo/getFiles';
export const TEST_FOLDER = 'tests';

export interface TestFiles {
  sourceFiles: string[];
  includeDirectories: string[];
}
type TestProjects = Record<string, TestFiles>;

/**
 * @param: uri workspace uri
 */
export default async function getTestFiles(workspaceUri: Uri): TestProjects {
  const testFolderPath = join(workspaceUri.fsPath, TEST_FOLDER);
  const testDirectory = await workspace.fs.readDirectory(Uri.file(testFolderPath));
  const testFolders = testDirectory.filter((entry) => entry[1] === FileType.Directory);
  const topLevelFiles = sortFiles(testDirectory.map(entry => entry[0]));
  let fileGlobs = SOURCE_FILE_EXTENSIONS.concat(HEADER_FILE_EXTENSIONS).reduce((previous, current) => {
    return `${previous} | ${current}`;
  }, "");
  fileGlobs = `**/*(${fileGlobs})`;

  const scanForFilePromises = testFolders.map(folder => {
    return scanForFiles([
      fileGlobs
    ]);
  });
  const files = await Promise.all(scanForFilePromises);

}