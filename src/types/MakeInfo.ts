

export interface Stm32SettingsInterface {
  armToolchainPath: string;
  openOCDPath: string;
  makePath: string;
  openOCDInterface: string;
}


export interface CubeMXMakefileInfoInterface {
  cDefinitions: string[];
  assemblyDefinitions: string[];
  cIncludeDirectories: string[];
  cSources: string[]
  assemblySources: string[];
  libraryDirectories: string[];
  libraries: string[];
  projectName: string;
  cpu: string;
  fpu: string;
  floatAbi: string;
  linkerScript: string;
  optimization: string;
  linkerFlags: string[];
}

export class CubeMXMakefileInfo implements CubeMXMakefileInfoInterface {
  public cDefinitions = [] as string[];
  public assemblyDefinitions = [] as string[];
  public cIncludeDirectories = [] as string[];
  public cSources = [] as string[];
  public assemblySources = [] as string[];
  public libraryDirectories = [] as string[];
  public libraries = [] as string[];
  public projectName = '';
  public cpu = '';
  public fpu = '';
  public floatAbi = '';
  public linkerScript = '';
  public optimization = 'Og';
  public linkerFlags = ['-specs=nano.specs'];
  public openocdTarget = '';
}

export interface ToolChainInterface {
  openOCDPath: string | boolean;
  makePath: string | boolean;
  armToolchainPath: string | boolean;
}

export interface BuildFilesInterface {
  cIncludeDirectories: string[];
  cSources: string[];
  cxxSources: string[];
  assemblySources: string[];
  libraries: string[];
  libraryDirectories: string[];
}

export type STM32Languages = 'C' | 'C++';

export interface TargetInfoInterface {
  projectName: string;
  cpu: string;
  fpu: string;
  floatAbi: string;
  openocdTarget: string;
  linkerScript: string;
}

export class TargetInfo implements TargetInfoInterface {
  public projectName = '';
  public cpu = '';
  public fpu = '';
  public floatAbi = '';
  public openocdTarget = '';
  public linkerScript = '';
}

export interface CompileInfoInterface {
  language: STM32Languages;
  optimization: string;
  cFlags: string[];
  assemblyFlags: string[];
  cxxFlags: string[];
  linkerFlags: string[];
  cDefinitions: string[];
  cxxDefinitions: string[];
  asDefinitions: string[];
  cDefinitionsFile?: string | string[];
  cxxDefinitionsFile?: string | string[];
  asDefinitionsFile?: string | string[];
}

export class CompileInfo implements CompileInfoInterface {
  public language = 'C' as STM32Languages;
  public optimization = 'Og';
  public cFlags: string[] = [];
  public assemblyFlags: string[] = [];
  public cxxFlags: string[] = [];
  public linkerFlags: string[] = [];
  public cDefinitions: string[] = [];
  public cxxDefinitions: string[] = [];
  public asDefinitions: string[] = [];
  public cDefinitionsFile?: string | string[];
  public cxxDefinitionsFile?: string | string[];
  public asDefinitionsFile?: string | string[];
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
  cxxFlags: string[];
  cDefinitions: string[];
  cxxDefinitions: string[];
  assemblyDefinitions: string[];
  tools: ToolChain;
}

export class ToolChain implements ToolChainInterface {
  public openOCDPath: string | boolean = false;
  public makePath: string | boolean = false;
  public armToolchainPath: string | boolean = false;
}
export class BuildFiles implements BuildFilesInterface {
  public cIncludeDirectories: string[] = [];
  public cSources: string[] = [];
  public cxxSources: string[] = [];
  public assemblySources: string[] = [];
  public libraries: string[] = [];
  public libraryDirectories: string[] = [];
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
  public cDefinitionsFile?: string | string[] = [];
  public cxxDefinitionsFile?: string | string[] = [];
  public asDefinitionsFile?: string | string[] = [];
  public includeDirectories: string[] = [];
  public projectName = '';
  public cpu = '';
  public fpu = '';
  public floatAbi = 'soft';
  public linkerScript = '';
  public openocdTarget = '';
  public language = 'C' as STM32Languages;
  public optimization = 'Og';
  public linkerFlags: string[] = [];
  // be aware that more flags are present in the Makefile. However these seem to be mandatory
  public cFlags: string[] = [
    '-Wall', '-fdata-sections', '-ffunction-sections',
  ];
  public assemblyFlags: string[] = [
    '-Wall',
    '-fdata-sections',
    '-ffunction-sections'
  ];
  public cxxFlags: string[] = [];
  public sourceFiles: string[] = [];
  public libraries: string[] = ['c', 'm'];
  public libraryDirectories: string[] = [];
  public suppressMakefileWarning = false;

  public importRelevantInfoFromMakefile(makeInfo: CubeMXMakefileInfo): void {
    this.cDefinitions = makeInfo.cDefinitions;
    this.asDefinitions = makeInfo.assemblyDefinitions;
    this.libraries = makeInfo.libraries;
    this.projectName = makeInfo.projectName;
    this.cpu = makeInfo.cpu;
    this.fpu = makeInfo.fpu;
    this.floatAbi = makeInfo.floatAbi;
    this.linkerScript = makeInfo.linkerScript;
    this.linkerFlags = makeInfo.linkerFlags;
    this.openocdTarget = makeInfo.openocdTarget;
    this.optimization = makeInfo.optimization;
    this.libraryDirectories = makeInfo.libraryDirectories;
    this.sourceFiles = this.sourceFiles.concat(makeInfo.assemblySources, makeInfo.cSources);
    this.includeDirectories = this.includeDirectories.concat(makeInfo.cIncludeDirectories);
  }
}


export default class MakeInfo implements MakeInfoInterface {
  public cDefinitions: string[] = [];
  public cxxDefinitions: string[] = [];
  public assemblyDefinitions: string[] = [];
  public cIncludeDirectories: string[] = [];
  public cSources: string[] = [];
  public cxxSources: string[] = [];
  public assemblySources: string[] = [];
  public libraryDirectories: string[] = [];
  public libraries: string[] = [];
  public tools: ToolChain = new ToolChain();
  public projectName = 'project';
  public cpu = '';
  public fpu = 'soft';
  public floatAbi = '';
  public linkerScript = '';
  public openocdTarget = '';
  public language = 'C' as STM32Languages;
  public optimization = 'Og';
  public cFlags: string[] = [];
  public assemblyFlags: string[] = [];
  public linkerFlags: string[] = [];
  public cxxFlags: string[] = [];
}