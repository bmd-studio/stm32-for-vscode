import * as _ from 'lodash';

import MakeInfo from '../../types/MakeInfo';

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
    tools: {
      armToolchain: '',
      openOCD: '',
      cMake: '',
      make: '',
    },
    libs: [],
    libDirs: [],
  };
  return _.assign(standard, info);
}