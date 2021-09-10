/*
  Information to gather:
  targetMCU: "superClass": "com.st.stm32cube.ide.mcu.gnu.managedbuild.option.target_mcu",
                                  "value": "STM32H723ZGTx",

  cpu type: USER INPUT
  fpu - 
    .cproject
    "superClass": "com.st.stm32cube.ide.mcu.gnu.managedbuild.option.fpu",
    "value": "com.st.stm32cube.ide.mcu.gnu.managedbuild.option.fpu.value.fpv5-d16",
  floatABI - 
    .cproject 
    "superClass": "com.st.stm32cube.ide.mcu.gnu.managedbuild.option.floatabi",
    "value": "com.st.stm32cube.ide.mcu.gnu.managedbuild.option.floatabi.value.hard",

  projectName: 
    .cproject in 
    {
        "$": {
          "moduleId": "cdtBuildSystem",
          "version": "4.0.0"
        },
        "project": [
          {
            "$": {
              "id": "LwIP_UDP_Echo_Server.null.654772735",
              "name": "LwIP_UDP_Echo_Server"
            }
          }
        ]
      },
cDefines:
  .cproject
  {
    "$": {
      "IS_BUILTIN_EMPTY": "false",
      "IS_VALUE_EMPTY": "false",
      "id": "com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.definedsymbols.93416079",
      "superClass": "com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.definedsymbols",
      "valueType": "definedSymbols"
    },
    "listOptionValue": [
      {
        "$": {
          "builtIn": "false",
          "value": "USE_HAL_DRIVER"
        }
      },
      {
        "$": {
          "builtIn": "false",
          "value": "STM32H723xx"
        }
      },
      {
        "$": {
          "builtIn": "false",
          "value": "DEBUG"
        }
      }
    ]
  }

  includePaths
    .cproject
    {
      "$": {
        "IS_BUILTIN_EMPTY": "false",
        "IS_VALUE_EMPTY": "false",
        "id": "com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.includepaths.2019891835",
        "superClass": "com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.includepaths",
        "valueType": "includePath"
      },
      "listOptionValue": [
        {
          "$": {
            "builtIn": "false",
            "value": "../../Src"
          }
        },
        {
          "$": {
            "builtIn": "false",
            "value": "../../../../../../../Middlewares/Third_Party/LwIP/system"
          }
        },
        {
          "$": {
            "builtIn": "false",
            "value": "../../../../../../../Drivers/BSP/STM32H7xx_Nucleo"
          }
        },
        {
          "$": {
            "builtIn": "false",
            "value": "../../../../../../../Drivers/CMSIS/Device/ST/STM32H7xx/Include"
          }
        },
        {
          "$": {
            "builtIn": "false",
            "value": "../../../../../../../Drivers/BSP/Components"
          }
        },
        {
          "$": {
            "builtIn": "false",
            "value": "../../Inc"
          }
        },
        {
          "$": {
            "builtIn": "false",
            "value": "../../../../../../../Middlewares/Third_Party/LwIP/src/include"
          }
        },
        {
          "$": {
            "builtIn": "false",
            "value": "../../../../../../../Drivers/STM32H7xx_HAL_Driver/Inc"
          }
        },
        {
          "$": {
            "builtIn": "false",
            "value": "../../../../../../../Drivers/BSP/Components/Common"
          }
        },
        {
          "$": {
            "builtIn": "false",
            "value": "../../../../../../../Drivers/CMSIS/Include"
          }
        }
      ]
    }

    asmFiles
    in project startup seems to be a default startup folder. e.g. root/STM32CubeIDE/Application/Startup/startup_stm32H723zgtx.s

    additional c files
    some system memory operation for what seems semi-hosting. is in root/STM32CubeIDE/Application/User/*

*/

/* NOTES
need to add prefixes to fpu and float abi e.g.
fpu: -mfpu=fpv5-d16
floatAbi: -mfloat-abi=hard
Will have to add startup file manually.
*/

import { workspace, Uri } from "vscode";
import { parseStringPromise } from "xml2js";
import { scanForFiles } from "../getFiles";
import * as path from 'path';
export { getCProjectFile, getInfoFromCProjectFile } from './cProject';

interface CubeIDEProjectLink {
  name: string;
  type: string;
  locationURI: string;
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
    name?: string[],
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
        path.join(currentWorkspaceFolder.uri.fsPath, projectFile[0])
      )
    );
    const projectJSON: CubeIDEProject = await parseStringPromise(
      projectXML,
      { ignoreAttrs: false, mergeAttrs: true, explicitArray: false }
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
  console.log('project JSON', projectJSON);
  if (projectJSON && projectJSON?.projectDescription?.linkedResources?.link) {
    const linkFiles: CubeIDEProjectLink[] = projectJSON?.projectDescription?.linkedResources?.link;

    // Loop to retrieve the relative location to the parent.
    return linkFiles.map((entry => {
      let location = entry.locationURI;
      const nestingRegex = /^\$%7BPARENT-(\d)-PROJECT_LOC%7D\//;
      const numberSearch = nestingRegex.exec(entry.locationURI);

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
  }
  return [];
}

/**
 * gets project information from  the Cube IDE .project file.
 * @returns the target and sourcefiles of a CubeIDE project
 */
export async function getCubeIDEProjectFileInfo(): Promise<CubeIDEProjectFileInfo> {
  const cubeIDEProjectFile = await getProjectFile();
  if (!cubeIDEProjectFile) {
    throw new Error('Could not find CubeIDEProject');
  }
  const sourceFiles = getSourceFilesFromCubeProjectJSON(cubeIDEProjectFile);
  const name = cubeIDEProjectFile.projectDescription?.name?.[0] ? cubeIDEProjectFile.projectDescription.name[0] : '';
  console.log({ sourceFiles });
  return {
    sourceFiles,
    target: name,
  };
}


export function projectFilePathsToWorkspacePaths(
  workspacePath: string,
  projectFilePath: string,
  projectFilePaths: string
): string[] {

}