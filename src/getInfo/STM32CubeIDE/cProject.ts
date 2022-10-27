import * as path from 'path';

import { Uri, workspace } from 'vscode';
import { deepFind, projectFilePathsToWorkspacePaths } from './helpers';

import MakeInfo from '../../types/MakeInfo';
import { parseStringPromise } from 'xml2js';
import { scanForFiles } from '../getFiles';

// TODO: add linker definitions
// TODO: add the cDefinitions to the CXX definitions.

/**
 *
 * @returns a json object from parsing the .cproject file
 */
export async function getCProjectFile(): Promise<never | undefined> {
  const currentWorkspaceFolder = workspace.workspaceFolders?.[0];
  if (!currentWorkspaceFolder) {
    return undefined;
  }
  const projectFile = await scanForFiles(['**/.cproject']);
  if (projectFile[0]) {
    // get the .project XML file
    const cProjectXML = await workspace.fs.readFile(
      Uri.file(
        path.join(currentWorkspaceFolder.uri.fsPath, projectFile[0]),
      ),
    );
    const cProjectJSON = await parseStringPromise(cProjectXML, {
      ignoreAttrs: false, mergeAttrs: true, explicitArray: false, explicitChildren: true,
    });
    cProjectJSON.location = projectFile[0];
    return cProjectJSON;
  }
  return undefined;
}

type CprojectValueType = 'string' | 'dotNotation' | 'includes' | 'definitions' | 'path' | 'flags' | 'booleanFlag';

interface CProjectInfoDefinition {
  name: string;
  superClass: string;
  type: CprojectValueType;
}

const infoFromCProjectDefinition: CProjectInfoDefinition[] = [
  {
    name: 'targetMCU',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.target_mcu',
    type: 'string',
  },
  {
    name: 'cpuid',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.target_cpuid',
    type: 'string',
  },
  {
    name: 'coreid',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.target_coreid',
    type: 'string',
  },
  {
    name: 'fpu',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.fpu',
    type: 'dotNotation',
  },
  {
    name: 'floatAbi',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.floatabi',
    type: 'dotNotation',
  },
  {
    name: 'targetBoard',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.target_board',
    type: 'string',
  },
  {
    name: 'assemblyIncludePaths',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.assembler.option.includepaths',
    type: 'includes',
  },
  {
    name: 'cDefinitions',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.definedsymbols',
    type: 'definitions',
  },
  {
    name: 'cIncludePaths',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.includepaths',
    type: 'includes',
  },
  {
    name: 'ldscript',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.linker.option.script',
    type: 'path',
  },
  {
    name: 'ldFlags',
    superClass: 'gnu.c.link.option.ldflags',
    type: 'flags',
  },
  {
    name: 'secureModeFlag',
    superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.mcmse',
    type: 'booleanFlag',
  },
];
const infoFromCProjectac6Definition: CProjectInfoDefinition[] = [
  {
    name: 'targetMCU',
    superClass: 'fr.ac6.managedbuild.option.gnu.cross.mcu',
    type: 'string',
  },
  // {
  //   name: 'cpuid',
  //   superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.target_cpuid',
  //   type: 'string'
  // },
  // {
  //   name: 'coreid',
  //   superClass: 'com.st.stm32cube.ide.mcu.gnu.managedbuild.option.target_coreid',
  //   type: 'string'
  // },
  {
    name: 'fpu',
    superClass: 'fr.ac6.managedbuild.option.gnu.cross.fpu',
    type: 'dotNotation',
  },
  {
    name: 'floatAbi',
    superClass: 'fr.ac6.managedbuild.option.gnu.cross.floatabi',
    type: 'dotNotation',
  },
  {
    name: 'targetBoard',
    superClass: 'fr.ac6.managedbuild.option.gnu.cross.board',
    type: 'string',
  },
  {
    name: 'assemblyIncludePaths',
    superClass: 'gnu.both.asm.option.include.paths',
    type: 'includes',
  },
  {
    name: 'cDefinitions',
    superClass: 'gnu.c.compiler.option.preprocessor.def.symbols',
    type: 'definitions',
  },
  {
    name: 'cIncludePaths',
    superClass: 'gnu.c.compiler.option.include.paths',
    type: 'includes',
  },
  {
    name: 'ldscript',
    superClass: 'fr.ac6.managedbuild.tool.gnu.cross.c.linker.script',
    type: 'path',
  },
];


interface CProjectFileListOption {
  builtin?: boolean;
  value?: string;
}
interface CProjectFileParentValue {
  value?: string | string[];
  listOptionValue?: CProjectFileListOption[];
}

/**
 * converts the cProjectFile parent value into a single array or value with the appropriate type and value
 * @param value the parent value of the 'superClass' key
 * @param type the type of value to convert
 * @returns undefined or the appropriate value, can be string or an array of strings
 */
export function convertCProjectTypeToValue(
  parentValue: CProjectFileParentValue,
  type: CprojectValueType
): undefined | string | string[] {
  switch (type) {
    case 'string':
      return parentValue?.value;
      break;
    case 'dotNotation':
      if (typeof parentValue?.value === 'string') {
        return parentValue?.value?.split('.')?.pop();
      }
      break;
    case 'includes': {
      if (Array.isArray(parentValue?.listOptionValue)) {
        const paths = parentValue?.listOptionValue?.map(
          (entry: CProjectFileListOption) => entry?.value
        );
        const filteredPaths: string[] =
          paths.filter((entry) => (typeof entry === 'string')) as string[];
        return filteredPaths;
      }
      return [];
    }
      break;
    case 'definitions': {
      if (Array.isArray(parentValue?.listOptionValue)) {
        const definitions = parentValue?.listOptionValue?.map(
          (entry: CProjectFileListOption) => entry?.value
        );
        const filteredDefinitions: string[] =
          definitions.filter((entry) => (typeof entry === 'string')) as string[];
        return filteredDefinitions;
      }
      return [];
    }
      break;
    case 'path':
      return parentValue?.value;
      break;
    case 'flags':
      if (typeof parentValue?.value === 'string') {
        return parentValue?.value?.split(' ');
      }
      break;
    case 'booleanFlag':
      return parentValue?.value;
      break;
    default:
      return parentValue?.value;
  }
  return undefined;
}

// eslint-disable-next-line max-len
export type CprojectInfo = Pick<MakeInfo, 'targetMCU' | 'cIncludes' | 'floatAbi' | 'fpu' | 'ldscript' | 'cDefs' | 'cxxDefs' | 'ldFlags' | 'cFlags' | 'cxxFlags'>;

/**
 * Extracts information from the .cproject file.
 * @param cProjectFile the cproject file string
 * @returns CprojecInfo, which contains information about the specific mcu used.
 */
export function getInfoFromCProjectFile(cProjectFile: Record<string, unknown>): CprojectInfo {
  // TODO: clean this function up. This now works however  should nicely return the

  const cProjectInfo: { [key: string]: string | string[] } = {};
  infoFromCProjectDefinition.forEach((definition) => {
    const parentValue = deepFind(cProjectFile, 'superClass', definition.superClass) as CProjectFileParentValue;
    const value = convertCProjectTypeToValue(parentValue, definition.type);
    cProjectInfo[definition.name] = value || '';
  });
  infoFromCProjectac6Definition.forEach((definition) => {
    const parentValue = deepFind(cProjectFile, 'superClass', definition.superClass) as CProjectFileParentValue;
    const value = convertCProjectTypeToValue(parentValue, definition.type);
    if (
      value !== undefined && cProjectInfo[definition.name].length === 0) {
      cProjectInfo[definition.name] = value || '';
    }
  });

  let includePaths: string[] = [];
  if (Array.isArray(cProjectInfo.cIncludePaths)) {
    includePaths = includePaths.concat(cProjectInfo.cIncludePaths);
  } else if (cProjectInfo.cIncludePaths) {
    includePaths.push(cProjectInfo.cIncludePaths);
  }
  if (typeof cProjectFile?.location === 'string') {
    includePaths = projectFilePathsToWorkspacePaths(cProjectFile.location, includePaths);
  }

  if (Array.isArray(cProjectInfo.assemblyIncludePaths)) {
    includePaths = includePaths.concat(cProjectInfo.assemblyIncludePaths);
  } else if (cProjectInfo.assemblyIncludePaths) {
    includePaths.push(cProjectInfo.assemblyIncludePaths);
  }

  const definitions = Array.isArray(cProjectInfo.cDefinitions)
    ? cProjectInfo.cDefinitions
    : [cProjectInfo.cDefinitions];

  const result: CprojectInfo = {
    targetMCU: Array.isArray(cProjectInfo.targetMCU) ? cProjectInfo.targetMCU[0] : cProjectInfo.targetMCU,
    cIncludes: includePaths,
    fpu: Array.isArray(cProjectInfo.fpu) ? cProjectInfo.fpu[0] : cProjectInfo.fpu,
    floatAbi: Array.isArray(cProjectInfo.floatAbi) ? cProjectInfo.floatAbi[0] : cProjectInfo.floatAbi,
    ldscript: Array.isArray(cProjectInfo.ldscript) ? cProjectInfo.ldscript[0] : cProjectInfo.ldscript,
    cDefs: definitions,
    cxxDefs: definitions,
    ldFlags: Array.isArray(cProjectInfo.ldFlags)
      ? cProjectInfo.ldFlags : [cProjectInfo.ldFlags],
    // for now only c projects are imported,
    // so if we want to use it for a c++ project to copy the c flags to the the c++ flags
    cFlags: cProjectInfo.secureModeFlag ? ['-mcmse'] : [],
    cxxFlags: cProjectInfo.secureModeFlag ? ['-mcmse'] : [],
  };
  if (result.fpu === undefined || result.fpu === 'no' || result.fpu === 'none') {
    result.fpu = '';
  }
  const resultKeys = Object.keys(result) as (keyof CprojectInfo)[];
  resultKeys.forEach((key) => {
    const currentInput = result[key];
    // eslint-disable-next-line max-len
    result[key] = (Array.isArray(currentInput) ? currentInput.filter((entry) => entry) : result[key]) as string & string[];
  });
  return result;
}

/**
 * Retrieves the linker script from the project
 * @param projectInfo the cproject file string
 * @returns the path to the linker script or undefined.
 */
async function getLDScriptPathFromCProjectEntry(projectInfo: CprojectInfo): Promise<string | undefined> {
  const ldRegex = /[\w\d_]+.ld/;
  const regexSearchResult = ldRegex.exec(projectInfo.ldscript);
  if (regexSearchResult) {
    const ldScriptName = regexSearchResult[0];
    const ldFiles = await scanForFiles([`**/${ldScriptName}`]);
    if (ldFiles[0]) {
      return ldFiles[0];
    }
  }
  return undefined;
}

export default async function getCubeIDECProjectFileInfo(): Promise<CprojectInfo> {
  const cProjectFile = await getCProjectFile();
  if (!cProjectFile) {
    throw new Error('Could not find cProjectFile');
  }
  const projectInfo = getInfoFromCProjectFile(cProjectFile);
  // search for the ld script
  const ldScriptPath = await getLDScriptPathFromCProjectEntry(projectInfo);
  if (ldScriptPath) {
    projectInfo.ldscript = ldScriptPath;
  }

  return projectInfo;
}