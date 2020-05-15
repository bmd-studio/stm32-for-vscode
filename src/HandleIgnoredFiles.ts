import { workspace } from 'vscode'
import ignore from 'ignore';
import { writeFileInWorkspace, splitStringLines } from './Helpers';
import * as stripComments from 'strip-comments';
import { Uri } from 'vscode';
import { ignoreFileName } from './Definitions'

export function getIgnores(workspacePathUri: Uri) {
  return new Promise((resolve, reject) => {
    workspace.findFiles('.stmignore').then(async (files) => {
      if (files.length > 0) {
        console.log('found .stmignore files', files);
        workspace.fs.readFile(files[0]).then((file) => {
          const ignorePaths =
            splitStringLines(stripComments(file.toString(), {}));
          resolve(ignorePaths);
        });
      } else {
        // should add the file
        // TODO: remove this and use native vscode implementation
        await writeFileInWorkspace(
          workspacePathUri, ignoreFileName,
          '#files that should be ignored by the STM32 For VSCode extension.\n#Use standard .ignore (e.g .gitignore) glob patters\nTest/*\ntest/*\nExamples/*\nexamples/*');
        resolve([]);
      }
    });
  });
}


export function stripIgnoredFiles(fileList: string[], ignoredFiles: string[]) {
  const ign = ignore().add(ignoredFiles);
  return ign.filter(fileList);
}