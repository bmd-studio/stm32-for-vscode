// import * as _ from 'lodash';

import * as cppInclude from 'cpp-include';
import * as fs from 'fs';
import * as path from 'path';

import { Uri, window, workspace } from 'vscode';

import executeTask from '../HandleTasks';
import { writeFileInWorkspace } from '../Helpers';

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
  // console.log('starting test setup');
  const foundMainFiles = await workspace.findFiles('**/Test/main.cpp');
  const foundGoogleTestFolder =
    fs.existsSync(path.resolve(workspacePathUri.fsPath, 'Test/googletest'));
  // console.log(foundMainFiles);
  // console.log(foundGoogleTestFolder);

  if (foundMainFiles.length === 0) {
    // no main files found. Should add the main file
    // console.log('writing main.cpp to Test/main.cpp');
    try {
      await writeFileInWorkspace(
        workspacePathUri, './Test/main.cpp', mainCPPFile);
    } catch (err) {
      // console.error(err);
      window.showWarningMessage(err);
    }
    // console.log('done writing main.cpp');
  }
  if (!foundGoogleTestFolder) {
    // not found should clone the googletest folder
    // console.log('trying to clone googletest repo');
    executeTask(
      'get requirements', 'cloning googletest', `git clone ${googletestRepo}`,
      path.resolve(workspacePathUri.fsPath, './Test'));
  }

  // console.log('finding .c* files');
  // after this the required includes need to be found
  const testCxxFiles = await workspace.findFiles('**/Test/*.c*');
  // console.log('test c files', testCxxFiles);
  let includes: string[] = [];
  const fileReadPromises =
    testCxxFiles.map((fileUri) => { return workspace.fs.readFile(fileUri); });

  const files = await Promise.all(fileReadPromises);
  // console.log(files);
  files.map((file) => {
    const fileString = file.toString();
    const fileIncludes = cppInclude.getIncludeFilesFromString(fileString);
    const rawIncludes = fileIncludes.map(inc => inc.path);
    includes = includes.concat(rawIncludes);
  });
  // console.log(_.uniq(includes));


  return new Promise((resolve) => { resolve(); });
}
