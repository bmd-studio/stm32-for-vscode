import * as _ from 'lodash';

import MakeInfo, { ToolChain } from '../../types/MakeInfo';

export function newMakeInfo(info: Partial<MakeInfo>): MakeInfo {
  const standard: MakeInfo = {
    cDefs: [],
    cxxDefs: [],
    asDefs: [],
    cIncludes: [],
    cSources: [],
    cxxSources: [],
    asmSources: [],
    target: '',
    cpu: '',
    fpu: '',
    floatAbi: '',
    mcu: '',
    ldscript: '',
    targetMCU: '',
    tools: new ToolChain(),
    libs: [],
    libdir: [],
    language: 'C',
    optimization: 'Og',
    cFlags: [],
    assemblyFlags: [],
    ldFlags: [],
    cxxFlags: [],
    customMakefileRules: undefined,
    makeFlags: [],
  };
  return _.assign(standard, info);
}