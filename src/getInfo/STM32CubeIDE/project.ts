import { workspace, Uri, window } from 'vscode';
import { parseStringPromise } from 'xml2js';
import * as path from 'path';
import { scanForFiles } from '../getFiles';
import { projectFilePathsToWorkspacePaths } from './helpers';

export { getCProjectFile, getInfoFromCProjectFile } from './cProject';

interface CubeIDEProjectLink {
  name: string;
  type: string;
  locationURI?: string;
  location?: string;
}

interface CubeIDEProject {
  location: string,
  projectDescription?: {
    buildSpec?: {
      buildCommand?: {
        name: string;
        arguments: string;
        triggers: string;
      }[]
    },
    comment?: string;
    linkedResources?: {
      link: CubeIDEProjectLink[];
    },
    name?: string,
    natures?: {
      nature: string[];
    };
    projects?: string[];
  }
}

export interface CubeIDEProjectFileInfo {
  target: string,
  sourceFiles: string[],

}

/**
 * Gets the CubeIDEProject file
 * @returns CubeIDEProject or undefined
 */
export async function getProjectFile(): Promise<CubeIDEProject | undefined> {
  const currentWorkspaceFolder = workspace.workspaceFolders?.[0];
  if (!currentWorkspaceFolder) {
    return undefined;
  }
  const projectFile = await scanForFiles(['**/.project']);
  if (projectFile[0]) {
    // get the .project XML file
    const projectXML = await workspace.fs.readFile(
      Uri.file(
        path.join(currentWorkspaceFolder.uri.fsPath, projectFile[0]),
      ),
    );
    const projectJSON: CubeIDEProject = await parseStringPromise(
      projectXML,
      { ignoreAttrs: false, mergeAttrs: true, explicitArray: false },
    );
    projectJSON.location = projectFile[0];
    return projectJSON;
  }
  return undefined;
}

/**
 * Get sources files from a CubeIDEProject file
 * @param projectJSON .project file converted from xml to json
 * @returns array of strings with all the source files, might include non c files
 */
export function getSourceFilesFromCubeProjectJSON(projectJSON: CubeIDEProject): string[] {
  if (projectJSON && projectJSON?.projectDescription?.linkedResources?.link) {
    const linkFiles: CubeIDEProjectLink[] = projectJSON?.projectDescription?.linkedResources?.link;
    // Loop to retrieve the relative location to the parent.
    const currentFiles = linkFiles.map(((entry) => {
      let location = entry.locationURI || entry.location || '';
      const nestingRegex = /^(?:\$%\dB)?PARENT-(\d)-PROJECT_LOC(?:%\dD)?\//;
      const numberSearch = nestingRegex.exec(location);

      if (numberSearch?.[0] && numberSearch?.[1] && !isNaN(parseInt(numberSearch[1]))) {
        location = location.replace(numberSearch[0], '');
        let nesting = '';
        for (let i = 0; i < parseInt(numberSearch[1]); i++) {
          nesting += '../';
        }
        location = `${nesting}${location}`;
      }
      return location;
    }));
    const filteredFiles = currentFiles.filter((entry) => !!entry);
    // need to do this  to get the appropriate  location
    const dirRoot = path.dirname(projectJSON.location);
    return projectFilePathsToWorkspacePaths(dirRoot, filteredFiles);
  }
  const errorMessage = 'no source files in .project file found';
  window.showErrorMessage(errorMessage);
  throw Error(errorMessage);
}

/**
 * gets project information from  the Cube IDE .project file.
 * @returns the target and sourcefiles of a CubeIDE project
 */
export default async function getCubeIDEProjectFileInfo(): Promise<CubeIDEProjectFileInfo> {
  const cubeIDEProjectFile = await getProjectFile();
  if (!cubeIDEProjectFile) {
    throw new Error('Could not find CubeIDEProject');
  }
  const sourceFiles = getSourceFilesFromCubeProjectJSON(cubeIDEProjectFile);
  return {
    sourceFiles,
    target: cubeIDEProjectFile.projectDescription?.name
      ? cubeIDEProjectFile.projectDescription?.name
      : 'firmware',
  };
}
