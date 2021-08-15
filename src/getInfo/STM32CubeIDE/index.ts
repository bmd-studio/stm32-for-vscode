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
import { map, split } from "lodash";
import { targetsMCUs } from "../../configuration/ConfigInfo";
import MakeInfo from "../../types/MakeInfo";


interface CubeIDEProjectLink {
  name: string[];
  type: string[];
  locationURI: string[];
}

interface CubeIDEProject {
  location: string,
  projectDescription?: {
    buildSpec?: {
      buildCommand?: {
        name: string[];
        arguments: string[];
        triggers: string[];
      }[]
    }[],
    comment?: string[];
    linkedResources?: {
      link: CubeIDEProjectLink[];
    }[],
    name?: string[],
    natures?: {
      nature: string[];
    }[];
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
    const projectJSON: CubeIDEProject = await parseStringPromise(projectXML, { explicitArray: false, mergeAttrs: true });
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
  if (projectJSON && projectJSON?.projectDescription?.linkedResources?.[0]?.link) {
    const linkFiles: CubeIDEProjectLink[] = projectJSON?.projectDescription?.linkedResources?.[0].link;

    // Loop to retrieve the relative location to the parent.
    return linkFiles.map((entry => {
      const nestingRegex = /\$%7BPARENT-(\d*)-PROJECT_LOC%7D\/(.*)/g;
      const numberSearch = nestingRegex.exec(entry.locationURI[0]);
      const nestingAmount = (numberSearch?.[1] ? parseInt(numberSearch?.[1], 10) : 0) + 1;
      const location = numberSearch?.[2] ? numberSearch?.[2] : '';
      let nestingString = '';
      for (let i = 0; i < nestingAmount; i++) {
        nestingString = `${nestingString}../`;
      }
      const totalPath = path.posix.join(projectJSON.location, nestingString, location);
      return totalPath;
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

  return {
    sourceFiles,
    target: name,
  };
}

// TODO: info from .cProject
// includes
// 
const projectInfoLocation = {
  targetMCU: {
    file: '.cproject',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.target_mcu',
    location: 'value',
  },
  fpu: {
    file: '.cproject',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.fpu',
    location: 'value',
    prepend: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.fpu.value.'
  },
  floatABI: {
    file: '.cproject',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.floatabi',
    location: 'value',
    prepend: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.floatabi.value.'
  },
  linkerScript: {
    file: '.cproject',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.linker.option.script',
    prepend: '${workspace_loc:/${ProjName}/',
    postString: '}',
  },
  cDefines: {
    file: '.cproject',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.definedsymbols',
    listValue: 'listOptionValue'
  },
  includePath: {
    file: 'cproject',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.includepaths',
    listValue: 'listOptionValue',
  }
};


/**
 * Finds a deeply nested key value pair inside an object or array and returns the parent
 * @param object The object to search in
 * @param key key to search for
 * @param value value to search for
 * @returns The parent when it has found the key/value pair, otherwise undefined
 */
export function deepFind(object: any, key: string, value: string): undefined | any {
  // the zero index array is included as the XML conversion 
  // can have an array with length 1 with the actual value inside.
  if (object.hasOwnProperty(key) && object[key] === value || object?.[key]?.[0] === value) {
    return object;
  }

  for (let objectKey of Object.keys(object)) {
    const typeOfObject = typeof object[objectKey];
    if (typeOfObject === "object") {
      let output: any = deepFind(object[objectKey], key, value);
      if (output !== undefined) { return output; }
    }
  }
  return undefined;
}

/**
 * 
 * @returns a json object from parsing the .cproject file
 */
export async function getCProjectFile(): Promise<any | undefined> {
  const currentWorkspaceFolder = workspace.workspaceFolders?.[0];
  if (!currentWorkspaceFolder) {
    return undefined;
  }
  const projectFile = await scanForFiles(['**/.cproject']);
  if (projectFile[0]) {
    // get the .project XML file
    const cProjectXML = await workspace.fs.readFile(
      Uri.file(
        path.join(currentWorkspaceFolder.uri.fsPath, projectFile[0])
      )
    );
    const cProjectJSON = await parseStringPromise(
      cProjectXML, { ignoreAttrs: false, mergeAttrs: true, explicitArray: false }
    );
    cProjectJSON.location = projectFile[0];
    console.log(cProjectJSON);

    return cProjectJSON;
  }
  return undefined;
}

type CprojectValueType = 'string' | 'dotNotation' | 'includes' | 'definitions' | 'path';

interface cProjectInfoDefinition {
  name: string;
  superClass: string;
  type: CprojectValueType;
}

const infoFromCProjectDefinition: cProjectInfoDefinition[] = [
  {
    name: 'targetMCU',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.target_mcu',
    type: 'string'
  },
  {
    name: 'cpuid',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.target_cpuid',
    type: 'string'
  },
  {
    name: 'coreid',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.target_coreid',
    type: 'string'
  },
  {
    name: 'fpu',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.fpu',
    type: 'dotNotation'
  },
  {
    name: 'floatAbi',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.floatabi',
    type: 'dotNotation'
  },
  {
    name: 'targetBoard',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.target_board',
    type: 'string'
  },
  {
    name: 'assemblyIncludePaths',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.assembler.option.includepaths',
    type: 'includes'
  },
  {
    name: 'cDefinitions',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.definedsymbols',
    type: 'definitions'
  },
  {
    name: 'cIncludePaths',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.includepaths',
    type: 'includes'
  },
  {
    name: 'ldscript',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.linker.option.script',
    type: 'path'
  }
];

/**
 * converts the cProjectFile parent value into a single array or value with the appropriate type and value
 * @param value the parent value of the 'superClass' key
 * @param type the type of value to convert
 * @returns undefined or the appropriate value, can be string or an array of strings
 */
export function convertCProjectTypeToValue(parentValue: any, type: CprojectValueType): undefined | string | string[] {
  switch (type) {
    case 'string':
      return parentValue?.value;
      break;
    case 'dotNotation':
      return parentValue?.value?.split('.')?.pop();
      break;
    case 'includes': {
      if (Array.isArray(parentValue?.listOptionValue)) {
        const paths = parentValue?.listOptionValue?.map((entry: { builtIn: boolean; value: string }) => {
          return entry?.value;
        });
        return paths;
      } else {
        return [parentValue?.listOptionValue?.value];
      }
    }
      break;
    case 'definitions': {
      if (Array.isArray(parentValue?.listOptionValue)) {
        const definitions = parentValue?.listOptionValue?.map((entry: { builtIn: boolean; value: string }) => {
          return entry?.value;
        });
        return definitions;
      } else {
        return [parentValue?.listOptionValue?.value];
      }
    }
      break;
    case 'path':
      return parentValue?.value;
      break;
    default:
      return parentValue?.value;
  }
}

type CprojectInfo = Pick<MakeInfo, 'targetMCU' | 'cIncludes' | 'floatAbi' | 'fpu' | 'ldscript' | 'cDefs'>;
export function getInfoFromCProjectFile(cProjectFile: any): CprojectInfo {
  // TODO: clean this function up. This now works however  should nicely return the 

  const cProjectInfo: { [key: string]: string | string[] } = {};
  infoFromCProjectDefinition.forEach((definition) => {
    const parentValue = deepFind(cProjectFile, 'superClass', definition.superClass);
    const value = convertCProjectTypeToValue(parentValue, definition.type);
    cProjectInfo[definition.name] = value || '';
  });
  console.log('cProject information', cProjectInfo);
  let includePaths: string[] = [];
  if (Array.isArray(cProjectInfo.cIncludePaths)) {
    includePaths = includePaths.concat(cProjectInfo.cIncludePaths);
  } else {
    includePaths.push(cProjectInfo.cIncludePaths);
  }

  if (Array.isArray(cProjectInfo.assemblyIncludePaths)) {
    includePaths = includePaths.concat(cProjectInfo.assemblyIncludePaths);
  } else {
    includePaths.push(cProjectInfo.assemblyIncludePaths);
  }

  const definitions = Array.isArray(cProjectInfo.cDefinitions) ?
    cProjectInfo.cDefinitions :
    [cProjectInfo.cDefinitions];

  // TODO: convert the path to something the extension can use. e.g. from the root of the project

  return {
    targetMCU: Array.isArray(cProjectInfo.targetMCU) ? cProjectInfo.targetMCU[0] : cProjectInfo.targetMCU,
    cIncludes: includePaths,
    fpu: Array.isArray(cProjectInfo.fpu) ? cProjectInfo.fpu[0] : cProjectInfo.fpu,
    floatAbi: Array.isArray(cProjectInfo.floatAbi) ? cProjectInfo.floatAbi[0] : cProjectInfo.floatAbi,
    ldscript: Array.isArray(cProjectInfo.ldscript) ? cProjectInfo.ldscript[0] : cProjectInfo.ldscript,
    cDefs: definitions
  } as CprojectInfo;
}