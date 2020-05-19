export interface ToolChainInterface {
  openOCD: string | boolean,
  make: string | boolean,
  cMake: string | boolean,
  armToolchain: string | boolean,
}

export interface BuildFilesInterface {
  cIncludes: string[],
  cSources: string[],
  cxxSources: string[],
  asmSources: string[],
}
export interface MakeInfoInterface extends BuildFilesInterface {
  cDefs: string[],
  cxxDefs: string[],
  asDefs: string[],
  tools: ToolChain,
  target: string,
  cpu: string,
  fpu: string,
  floatAbi: string,
  mcu: string,
  ldscript: string,
  targetMCU: string,
};

export class ToolChain implements ToolChainInterface {
  openOCD: string | boolean = false;
  make: string | boolean = false;
  cMake: string | boolean = false;
  armToolchain: string | boolean = false;
  constructor() {}
}
export class BuildFiles implements BuildFilesInterface {
  cIncludes: string[] = [];
  cSources: string[] = [];
  cxxSources: string[] = [];
  asmSources: string[] = [];
  constructor() {}
}

export default class MakeInfo implements MakeInfoInterface {
  cDefs: string[] = [];
  cxxDefs: string[] = [];
  asDefs: string[] = [];
  cIncludes:string[] =  [];
  cSources:string[] = [];
  cxxSources:string[] = [];
  asmSources:string[] = [];
  tools:ToolChain = new ToolChain();
  target: string = '';
  cpu: string  = '';
  fpu: string = '' ;
  floatAbi: string = '';
  mcu: string = '';
  ldscript: string = '';
  targetMCU: string = '';
  constructor() {}
}