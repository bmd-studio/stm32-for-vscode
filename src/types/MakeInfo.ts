export interface ToolChain {
  openOCD: string | boolean,
  make: string | boolean,
  cMake: string | boolean,
  armToolchain: string | boolean,
}

export default interface MakeInfo {
  cDefs: string[],
  cxxDefs: string[],
  asDefs: string[],
  cIncludes: string[],
  cxxIncludes: string[],
  asIncludes: string[],
  cSources: string[],
  cxxSources: string[],
  asmSources: string[],
  tools: ToolChain,
  target: string,
  cpu: string,
  fpu: string,
  floatAbi: string,
  mcu: string,
  ldscript: string,
  targetMCU: string,
};