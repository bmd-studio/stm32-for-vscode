import * as _ from 'lodash';

import { BuildFiles, MakeInfo, ToolChain } from '../types/MakeInfo';

import { combineArraysIntoObject } from './infoHelpers';
import getMakefileInfo from './getCubeMakefileInfo';

/**
 * @description Combines the information from the Makefile and the FileList
 * @param {object} makefileInfo
 * @param {object} fileList
 */
export function combineInfo(cubeMakefileInfo: MakeInfo, fileList: BuildFiles, requirementInfo: ToolChain): MakeInfo {
  const bundledInfo = new MakeInfo();
  // TODO: check if this works.
  _.merge(bundledInfo, cubeMakefileInfo, fileList, requirementInfo);
  bundledInfo.forEach((entry: string | string[], key: string) => {
    bundledInfo[key] = _.uniq(entry).sort();
  });


  // TODO: check if cxxIncludes are actually a thing. For now this could be left out as far as I can tell.
  // TODO: check if asIncludes are actually a thing. For now this could be left out as far as I can tell.
  // Bundling info which both the makeFile and the File list have
  // combineArraysIntoObject(makefileInfo.cSources, fileList.cSources, 'cSources', bundledInfo);
  // combineArraysIntoObject(makefileInfo.cxxSources, fileList.cxxSources, 'cxxSources', bundledInfo);
  // combineArraysIntoObject(makefileInfo.asmSources, fileList.asmSources, 'asmSources', bundledInfo);
  // combineArraysIntoObject(makefileInfo.libs, fileList.libs, 'libs', bundledInfo);
  // combineArraysIntoObject(makefileInfo.libDirs, fileList.libDirs, 'libDirs', bundledInfo);
  // combineArraysIntoObject(makefileInfo.cIncludes, fileList.cIncludes, 'cIncludes', bundledInfo);
  // // combineArraysIntoObject(makefileInfo.cxxIncludes, [], 'cxxIncludes', bundledInfo);
  // combineArraysIntoObject(makefileInfo.asIncludes, [], 'asIncludes', bundledInfo);

  // now assign make list values
  _.set(bundledInfo, 'target', _.replace(makefileInfo.target, /\s/g, '_'));
  _.set(bundledInfo, 'cpu', makefileInfo.cpu);
  _.set(bundledInfo, 'fpu', makefileInfo.fpu);
  _.set(bundledInfo, 'floatAbi', makefileInfo.floatAbi);
  _.set(bundledInfo, 'mcu', makefileInfo.mcu);
  _.set(bundledInfo, 'ldscript', makefileInfo.ldscript);
  _.set(bundledInfo, 'cDefs', makefileInfo.cDefs);
  _.set(bundledInfo, 'cxxDefs', makefileInfo.cxxDefs);
  _.set(bundledInfo, 'asDefs', makefileInfo.asDefs);
  _.set(bundledInfo, 'targetMCU', makefileInfo.targetMCU);
  if (requirementInfo) {
    _.set(bundledInfo, 'tools', requirementInfo); // extra check to not break tests, if this is not provided.
  }
  if (!_.isEmpty(bundledInfo.cxxSources)) { bundledInfo.language = 'C++'; }

  return bundledInfo;
}

// FIXME: do I really want to use a global info variable for this?
/**
 * @description function for getting all the info combined. After this
 * the info is accessible at the default exported info.
 * Combines the makefile info and files in workspace info, also checks
 * if a project is a C or C++ project and converts accordingly.
 * @param {string} location location of the workspace
 */
export async function getInfo(location: string): Promise<MakeInfo> {
  return new Promise((resolve, reject) => {
    const makefileInfoPromise = getMakefileInfo(location);
    const listFilesInfoPromise = getFileList(location);
    const requirementsInfoPromise = getRequirements();

    // TODO: also add a get config in here
    Promise.all([makefileInfoPromise, listFilesInfoPromise, requirementsInfoPromise]).then((values) => {
      const [makefileInfo, fileInfo, requirementInfo] = values;
      let combinedInfo = combineInfo(makefileInfo, fileInfo, requirementInfo);
      combinedInfo = checkAndConvertCpp(combinedInfo);
      _.assignIn(info, combinedInfo);
      if (!vscode.workspace.workspaceFolders) { throw Error('No workspace folder was selected'); }
      getIgnores(vscode.workspace.workspaceFolders[0].uri).then((ignores: string[]) => {
        info.cSources = stripIgnoredFiles(info.cSources, ignores);
        info.cxxSources = stripIgnoredFiles(info.cxxSources, ignores);
        info.asmSources = stripIgnoredFiles(info.asmSources, ignores);
        resolve(info);
      });
    }).catch((err) => {
      vscode.window.showErrorMessage('Something went wrong with scanning directories and reading files', err);
      reject(err);
    });
  });
}
