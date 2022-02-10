import * as _ from 'lodash';

import MakeInfo, { ToolChain } from '../../types/MakeInfo';

export function newMakeInfo(info: Partial<MakeInfo>): MakeInfo {
  const standard: MakeInfo = {
    cDefinitions: [],
    cxxDefinitions: [],
    assemblyDefinitions: [],
    cIncludeDirectories: [],
    cSources: [],
    cxxSources: [],
    assemblySources: [],
    target: '',
    cpu: '',
    fpu: '',
    floatAbi: '',
    mcu: '',
    linkerScript: '',
    openocdTarget: '',
    tools: new ToolChain(),
    libraries: [],
    libraryDirectories: [],
    language: 'C',
    optimization: 'Og',
    cFlags: [],
    assemblyFlags: [],
    linkerFlags: [],
    cxxFlags: [],
  };
  return _.assign(standard, info);
}