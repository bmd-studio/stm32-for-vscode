import { Uri, workspace } from 'vscode';
import * as path from 'path';
import { scanForFiles } from "../getFiles";
import { parseStringPromise } from "xml2js";
import { deepFind } from './helpers';
import MakeInfo from "../../types/MakeInfo";

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

interface CProjectInfoDefinition {
  name: string;
  superClass: string;
  type: CprojectValueType;
}

const infoFromCProjectDefinition: CProjectInfoDefinition[] = [
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