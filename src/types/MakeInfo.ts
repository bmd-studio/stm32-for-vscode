

export interface Stm32SettingsInterface {
  armToolchainPath: string;
  openOCDPath: string;
  makePath: string;
  openOCDInterface: string;
}

export interface ToolChainInterface {
  openOCDPath: string | boolean;
  makePath: string | boolean;
  armToolchainPath: string | boolean;
}

export interface BuildFilesInterface {
  cIncludes: string[];
  cSources: string[];
  cxxSources: string[];
  asmSources: string[];
  libs: string[];
  libdir: string[];
}

export type STM32Languages = 'C' | 'C++';

export interface TargetInfoInterface {
  target: string;
  cpu: string;
  fpu: string;
  floatAbi: string;
  targetMCU: string;
  ldscript: string;
}

export class TargetInfo implements TargetInfoInterface {
  public target = '';
  public cpu = '';
  public fpu = '';
  public floatAbi = '';
  public targetMCU = '';
  public ldscript = '';
}

export interface CompileInfoInterface {
  language: STM32Languages;
  optimization: string;
  cFlags: string[];
  assemblyFlags: string[];
  ldFlags: string[];
  cxxFlags: string[];
  cDefinitions: string[];
  cxxDefinitions: string[];
  asDefinitions: string[];
}

export class CompileInfo implements CompileInfoInterface {
  public language = 'C' as STM32Languages;
  public optimization = 'Og';
  public cFlags: string[] = [];
  public assemblyFlags: string[] = [];
  public ldFlags: string[] = [];
  public cxxFlags: string[] = [];
  public cDefinitions: string[] = [];
  public cxxDefinitions: string[] = [];
  public asDefinitions: string[] = [];
}

export interface LibrariesInterface {
  libraries: string[];
  libraryDirectories: string[];
}

export class Libraries implements LibrariesInterface {
  public libraries: string[] = [];
  public libraryDirectories: string[] = [];
}

// NOTE: this differs from the configuration in the shortinening of the DEFS names
// This is maintained as this helps in parsing the makefile however should be noted
// when merging the two information sources.
export interface MakeInfoInterface extends BuildFilesInterface, TargetInfoInterface {
  language: STM32Languages;
  optimization: string;
  cFlags: string[];
  assemblyFlags: string[];
  ldFlags: string[];
  cxxFlags: string[];
  cDefs: string[];
  cxxDefs: string[];
  asDefs: string[];
  tools: ToolChain;
}

export class ToolChain implements ToolChainInterface {
  public openOCDPath: string | boolean = false;
  public makePath: string | boolean = false;
  public armToolchainPath: string | boolean = false;
}
export class BuildFiles implements BuildFilesInterface {
  public cIncludes: string[] = [];
  public cSources: string[] = [];
  public cxxSources: string[] = [];
  public asmSources: string[] = [];
  public libs: string[] = [];
  public libdir: string[] = [];
}

export interface ExtensionConfigurationInterface extends TargetInfoInterface, CompileInfoInterface, Libraries {
  excludes: string[];
  includeDirectories: string[];
  sourceFiles: string[];
  suppressMakefileWarning: boolean;
}

export class ExtensionConfiguration implements ExtensionConfigurationInterface {
  public excludes = [
    `"**/Examples/**"`,
    `"**/examples/**"`,
    `"**/Example/**"`,
    `"**/example/**"`,
    `"**_template.*"`,
  ];
  public cDefinitions: string[] = [];
  public cxxDefinitions: string[] = [];
  public asDefinitions: string[] = [];
  public includeDirectories: string[] = [];
  public target = '';
  public cpu = '';
  public fpu = '';
  public floatAbi = '';
  public ldscript = '';
  public targetMCU = '';
  public language = 'C' as STM32Languages;
  public optimization = 'Og';
  // be aware that more flags are present in the Makefile. However these seem to be mandatory
  public cFlags: string[] = [
    '-Wall', '-fdata-sections', '-ffunction-sections',
  ];
  public assemblyFlags: string[] = [
    '-Wall',
    '-fdata-sections',
    '-ffunction-sections'
  ];
  public ldFlags: string[] = [
    '-specs=nosys.specs',

  ];
  public cxxFlags: string[] = [];
  public sourceFiles: string[] = [];
  public libraries: string[] = ['c', 'm', 'nosys'];
  public libraryDirectories: string[] = [];
  public suppressMakefileWarning = false;

  public importRelevantInfoFromMakefile(makeInfo: MakeInfo): void {
    this.cDefinitions = makeInfo.cDefs;
    this.cxxDefinitions = makeInfo.cxxDefs;
    this.asDefinitions = makeInfo.asDefs;
    this.libraries = makeInfo.libs;
    this.target = makeInfo.target;
    this.cpu = makeInfo.cpu;
    this.fpu = makeInfo.fpu;
    this.floatAbi = makeInfo.floatAbi;
    this.ldscript = makeInfo.ldscript;
    this.targetMCU = makeInfo.targetMCU;
    this.cFlags = makeInfo.cFlags;
    this.assemblyFlags = makeInfo.assemblyFlags;
    this.ldFlags = makeInfo.ldFlags;
    this.cxxFlags = makeInfo.cxxFlags;
    this.libraryDirectories = makeInfo.libdir;
  }
}

export default class MakeInfo implements MakeInfoInterface {
  public cDefs: string[] = [];
  public cxxDefs: string[] = [];
  public asDefs: string[] = [];
  public cIncludes: string[] = [];
  public cSources: string[] = [];
  public cxxSources: string[] = [];
  public asmSources: string[] = [];
  public libdir: string[] = [];
  public libs: string[] = [];
  public tools: ToolChain = new ToolChain();
  public target = '';
  public cpu = '';
  public fpu = '';
  public floatAbi = '';
  public mcu = '';
  public ldscript = '';
  public targetMCU = '';
  public language = 'C' as STM32Languages;
  public optimization = 'Og';
  public cFlags: string[] = [];
  public assemblyFlags: string[] = [];
  public ldFlags: string[] = [];
  public cxxFlags: string[] = [];

}