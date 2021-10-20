import { workspace, Uri } from 'vscode';
import { scanForFiles } from "../getFiles";
import * as path from 'path';
import { StringIterator } from 'lodash';



function extractSourceFilesFromMXProject(projectFile: string, workspacePath: string): string[] {
  const sourceFileRegex = /(?:SourceFiles#\d+=)([\w\\\/:]+(?:.c)|(?:.cpp)|(?:.cxx))/g;
  const sourceArray = [];
  let result = sourceFileRegex.exec(projectFile);
  for (let i = 0; i < 1000 && result; i++) {
    if (result && result[1]) {
      sourceArray.push(path.relative(workspacePath, result[1]).replaceAll(path.sep, '/'));
    }
    result = sourceFileRegex.exec(projectFile);
  }
  return sourceArray;
}

function extractHeaderPathsFromMXProject(projectFile: string, workspacePath: string): string[] {
  const headerPathRegex = /(?:HeaderPath#\d+=)([\w\\\/:]+)/g;
  const headerArray = [];
  let result = headerPathRegex.exec(projectFile);
  for (let i = 0; i < 1000 && result; i++) {
    if (result && result[1]) {
      headerArray.push(path.relative(workspacePath, result[1]).replaceAll(path.sep, '/'));
    }
    result = headerPathRegex.exec(projectFile);
  }
  return headerArray;
}

function extractCubEIDESourceFilesFromMXProject(projectFile: string): string[] {
  let resultArray: string[] = [];
  const cubeIdeFileRegex = /\[PreviousUsedCubeIDEFiles\]\s*[\r\n]SourceFiles=(([\w_\d\-\\\/]+.(?:(c)|(cpp)|(cxx)|a);+)+)$/gim;
  const cubeSourceFileRegex = /([\w_\d\-\\\/]+.(?:(c)|(cpp)|(cxx)|a);+)/g;
  // const result = cubeIdeFileRegex.exec(projectFile);
  const result = projectFile.match(cubeIdeFileRegex); //cubeIdeFileRegex.exec(projectFile);
  if (result && result[0]) {
    const fileResult = result[0].match(cubeSourceFileRegex);
    if (fileResult) {
      resultArray = fileResult?.map((value: string) => {
        return value.replaceAll(path.sep, '/').replace(';', '');
      });
    }
    console.log({ fileResult });
  }
  console.log({ result, projectFile, resultArray });

  return resultArray;
}
export async function getCubeIDEMXProjectInfo(): Promise<{ sourceFiles: string[], headerPaths: string[] }> {
  const defaultOutput = { sourceFiles: [], headerPaths: [] };
  const currentWorkspaceFolder = workspace.workspaceFolders?.[0];
  if (!currentWorkspaceFolder) {
    return defaultOutput;
  }
  const projectFilePath = await scanForFiles(['**/.mxproject']);
  if (projectFilePath && projectFilePath[0]) {
    const projectFileBuffer = await workspace.fs.readFile(
      Uri.file(
        path.join(currentWorkspaceFolder.uri.fsPath, projectFilePath[0])
      )
    );
    const projectFile = Buffer.from(projectFileBuffer).toString('utf8');
    const cubeFiles = extractCubEIDESourceFilesFromMXProject(projectFile);
    if (projectFile) {
      return {
        sourceFiles: extractSourceFilesFromMXProject(projectFile, currentWorkspaceFolder.uri.fsPath).concat(cubeFiles),
        headerPaths: extractHeaderPathsFromMXProject(projectFile, currentWorkspaceFolder.uri.fsPath),
      };
    }
  }
  return defaultOutput;
}