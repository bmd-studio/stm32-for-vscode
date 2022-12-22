import { workspace, Uri, FileType } from 'vscode';
import { join, basename } from 'path';
import { scanForFiles, sortFiles, SOURCE_FILE_EXTENSIONS, HEADER_FILE_EXTENSIONS } from '../getInfo/getFiles';
import { BuildFiles } from '../types';
export const TEST_FOLDER = 'tests';

export interface TestFiles {
  sourceFiles: string[];
  includeDirectories: string[];
}
export interface TestProjects {
  common: BuildFiles;
  tests: Record<string, BuildFiles>
}
/**
 * @param: uri workspace uri
 */
export default async function getTestFiles(workspaceUri: Uri): Promise<TestProjects> {
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
      join(folder[0], fileGlobs),
    ]);
  });
  const output: TestProjects = {
    common: topLevelFiles,
    tests: {},
  };
  const filesPerDirectory = await Promise.all(scanForFilePromises);
  filesPerDirectory.forEach((files, index) => {
    const name = basename(testFolders[index][0]);
    const sorted = sortFiles(files);
    output.tests[name] = sorted;
  });
  return output;
}