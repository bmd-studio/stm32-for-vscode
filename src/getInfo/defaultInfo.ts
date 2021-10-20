
import _ = require('lodash');
import MakeInfo from '../types/MakeInfo';

const defaults: Partial<MakeInfo> = {
  libs: ['c', 'm'],
  cxxFlags: ['-feliminate-unused-debug-types']
};

/**
 * Adds default library and flags to the MakeInfo.
 * @param info makeInfo to add default libs and flags to
 * @returns 
 */
export function addDefaultLibsAndFlagsInfo(info: MakeInfo): MakeInfo {
  if (info.libs === undefined) {
    info.libs = [];
  }
  if (defaults.libs === undefined) {
    defaults.libs = [];
  }
  if (info.assemblyFlags === undefined) {
    info.assemblyFlags = [];
  }
  if (defaults.assemblyFlags === undefined) {
    defaults.assemblyFlags = [];
  }
  if (defaults.cxxFlags === undefined) {
    defaults.cxxFlags = [];
  }


  info.libs = info.libs.concat(defaults.libs);
  info.assemblyFlags = info.assemblyFlags.concat(defaults.assemblyFlags);
  info.cxxFlags = info.cxxFlags.concat(defaults.cxxFlags);
  return info;
}

export default function addDefaults(info: MakeInfo): MakeInfo {
  return addDefaultLibsAndFlagsInfo(info);
}