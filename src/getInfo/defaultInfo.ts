
import MakeInfo from '../types/MakeInfo';

const defaults: Partial<MakeInfo> = {
  libraries: ['c', 'm', 'nosys'],
  cxxFlags: ['-feliminate-unused-debug-types'],
  assemblyFlags: [],
  linkerFlags: ['-specs=nosys.specs']
};

/**
 * Adds default library and flags to the MakeInfo.
 * @param info makeInfo to add default libraries and flags to
 * @returns 
 */
export function addDefaultlibrariesAndFlagsInfo(info: MakeInfo): MakeInfo {
  if (info.libraries === undefined) {
    info.libraries = [];
  }
  if (defaults.libraries === undefined) {
    defaults.libraries = [];
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
  if (defaults.linkerFlags === undefined) {
    defaults.linkerFlags = [];
  }


  info.libraries = info.libraries.concat(defaults.libraries);
  info.assemblyFlags = info.assemblyFlags.concat(defaults.assemblyFlags);
  info.cxxFlags = info.cxxFlags.concat(defaults.cxxFlags);
  if (info.linkerFlags.findIndex(
    (value) => value.includes('specs=')
  ) < 0) {
    info.linkerFlags = info.linkerFlags.concat(defaults.linkerFlags);
  }
  return info;
}

export default function addDefaults(info: MakeInfo): MakeInfo {
  return addDefaultlibrariesAndFlagsInfo(info);
}