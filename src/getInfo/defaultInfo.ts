
import MakeInfo from '../types/MakeInfo';

const defaults: Partial<MakeInfo> = {
  libs: ['c', 'm', 'nosys'],
  cxxFlags: ['-feliminate-unused-debug-types'],
  assemblyFlags: [],
  ldFlags: ['-specs=nosys.specs']
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
  if (defaults.ldFlags === undefined) {
    defaults.ldFlags = [];
  }


  info.libs = info.libs.concat(defaults.libs);
  info.assemblyFlags = info.assemblyFlags.concat(defaults.assemblyFlags);
  info.cxxFlags = info.cxxFlags.concat(defaults.cxxFlags);
  if (info.ldFlags.findIndex(
    (value) => value.includes('specs=')
  ) < 0) {
    info.ldFlags = info.ldFlags.concat(defaults.ldFlags);
  }
  return info;
}

export default function addDefaults(info: MakeInfo): MakeInfo {
  return addDefaultLibsAndFlagsInfo(info);
}