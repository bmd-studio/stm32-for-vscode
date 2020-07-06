

import MakeInfo from '../../types/MakeInfo';
import * as _ from 'lodash';
export function newMakeInfo(info: Partial<MakeInfo>): MakeInfo {
  const standard: MakeInfo = {
    cDefs: [],
    cxxDefs: [],
    asDefs: [],
    includes: [],
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
    }
  };
  return _.assign(standard, info);
}