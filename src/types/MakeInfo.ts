import { standardOpenOCDInterface } from '../Definitions';

export interface Stm32SettingsInterface {
  armToolchainPath: string;
  openOCDPath: string;
  makePath: string;
  openOCDInterface: string;
}

export interface ToolChainInterface {
  openOCDPath: string | boolean;
  makePath: string | boolean;
  cMakePath: string | boolean;
  armToolchainPath: string | boolean;
  openOCDInterface: string;
}

export interface BuildFilesInterface {
  cIncludes: string[];
  cSources: string[];
  cxxSources: string[];
  asmSources: string[];
  libs: string[];
  libDirs: string[];
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
  public openOCDPath: string | boolean = false;
  public makePath: string | boolean = false;
  public cMakePath: string | boolean = false;
  public armToolchainPath: string | boolean = false;
  public openOCDInterface = standardOpenOCDInterface;
  // public constructor() { }
}
export class BuildFiles implements BuildFilesInterface {
  public cIncludes: string[] = [];
  public cSources: string[] = [];
  public cxxSources: string[] = [];
  public asmSources: string[] = [];
  public libs: string[] = [];
  public libDirs: string[] = [];
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
  public libDirs: string[] = [];
  public libs: string[] = [];
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