import { workspace } from 'vscode';
import ignore from 'ignore';
import { writeFileInWorkspace, splitStringLines } from './Helpers';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const strip = require('strip-comments'); // did require here, because import seems to mess up default export
import { Uri } from 'vscode';
import { ignoreFileName } from './Definitions';
import * as _ from 'lodash';

export function getIgnores(workspacePathUri: Uri): Promise<string[]> {
  return new Promise((resolve) => {
    workspace.findFiles(ignoreFileName).then(async (files) => {
      if (files.length > 0) {
        workspace.fs.readFile(files[0]).then((file) => {
          const lines: string[] =
            splitStringLines(file.toString());
          const ignoredPaths: string[] = [];
          lines.map((entry: string) => {
            const trimmedEntry = _.trim(entry);
            const commentReg = /#.*/gm;
            const unCommented = _.trim(trimmedEntry.replace(commentReg, ''));
            if (!_.isEmpty(unCommented)) {
              ignoredPaths.push(unCommented);
            }
          });
          resolve(ignoredPaths);
        });
      } else {
        // should add the file
        await writeFileInWorkspace(
          workspacePathUri, ignoreFileName,
          '#files that should be ignored by the STM32 For VSCode extension.\n#Use standard .ignore (e.g .gitignore) glob patters\nTest/*\ntest/*\nExamples/*\nexamples/*');
        resolve([]);
      }
    });
  });
}


export function stripIgnoredFiles(fileList: string[], ignoredFiles: string[]): string[] {
  const ign = ignore().add(ignoredFiles);
  return ign.filter(fileList);
}