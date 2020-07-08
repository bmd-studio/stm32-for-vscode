export interface ToolChainInterface {
  openOCD: string | boolean;
  make: string | boolean;
  cMake: string | boolean;
  armToolchain: string | boolean;
}

export interface BuildFilesInterface {
  cIncludes: string[];
  cSources: string[];
  cxxSources: string[];
  asmSources: string[];
}
export interface MakeInfoInterface extends BuildFilesInterface {
  cDefs: string[];
  cxxDefs: string[];
  asDefs: string[];
  tools: ToolChain;
  target: string;
  cpu: string;
  fpu: string;
  floatAbi: string;
  mcu: string;
  ldscript: string;
  targetMCU: string;
}

export class ToolChain implements ToolChainInterface {
  public openOCD: string | boolean = false;
  public make: string | boolean = false;
  public cMake: string | boolean = false;
  public armToolchain: string | boolean = false;
  // public constructor() { }
}
export class BuildFiles implements BuildFilesInterface {
  public cIncludes: string[] = [];
  public cSources: string[] = [];
  public cxxSources: string[] = [];
  public asmSources: string[] = [];
  // public constructor() { }
}

export default class MakeInfo implements MakeInfoInterface {
  public cDefs: string[] = [];
  public cxxDefs: string[] = [];
  public asDefs: string[] = [];
  public cIncludes: string[] = [];
  public cSources: string[] = [];
  public cxxSources: string[] = [];
  public asmSources: string[] = [];
  public tools: ToolChain = new ToolChain();
  public target = '';
  public cpu = '';
  public fpu = '';
  public floatAbi = '';
  public mcu = '';
  public ldscript = '';
  public targetMCU = '';
  // public constructor() { }
}