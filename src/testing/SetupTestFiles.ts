// import * as _ from 'lodash';

import * as cppInclude from 'cpp-include';
import * as fs from 'fs';
import * as path from 'path';

import { Uri, window, workspace } from 'vscode';

import executeTask from '../HandleTasks';
import { writeFileInWorkspace, fsPathToPosix } from '../Helpers';

// import { getCmakeTestFile } from './cmakeTestTemplate';


const mainCPPFile = '#include "gtest/gtest.h"\n\
\n\
int main(int argc, char **argv) {\n\
  ::testing::InitGoogleTest(&argc, argv);\n\
  return RUN_ALL_TESTS();\n\
}\n\
';

const googletestRepo = 'https://github.com/google/googletest';

export default async function setupTestFiles(workspacePathUri: Uri): Promise<void> {
  // should check te requirements: googletest and main.cpp
  const foundMainFiles = await workspace.findFiles('**/Test/main.cpp');
  const foundGoogleTestFolder =
    fs.existsSync(path.resolve(fsPathToPosix(workspacePathUri.fsPath), 'Test/googletest'));

  if (foundMainFiles.length === 0) {
    // no main files found. Should add the main file
    try {
      await writeFileInWorkspace(
        workspacePathUri, './Test/main.cpp', mainCPPFile);
    } catch (err) {
      window.showWarningMessage(err);
    }
  }
  if (!foundGoogleTestFolder) {
    // not found should clone the googletest folder
    executeTask(
      'get requirements', 'cloning googletest', [`git clone ${googletestRepo}`],
      { cwd: path.resolve(fsPathToPosix(workspacePathUri.fsPath), './Test') });
  }
  // after this the required includes need to be found
  const testCxxFiles = await workspace.findFiles('**/Test/*.c*');
  let includes: string[] = [];
  const fileReadPromises =
    testCxxFiles.map((fileUri) => { return workspace.fs.readFile(fileUri); });

  const files = await Promise.all(fileReadPromises);
  files.map((file) => {
    const fileString = file.toString();
    const fileIncludes = cppInclude.getIncludeFilesFromString(fileString);
    const rawIncludes = fileIncludes.map(inc => inc.path);
    includes = includes.concat(rawIncludes);
  });

  return new Promise((resolve) => { resolve(); });
}
