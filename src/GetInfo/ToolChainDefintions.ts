import { ToolChain } from '../types/MakeInfo';

// const path pre

interface BuildToolDefinition {
  name: string;
  standardCmd: string;
  otherCmds: string[];
  folder: boolean;
  requiredByCortexDebug: boolean;
  installation: {
    xpm?: string;
    url?: string;
  };
}


export const openocdDefinition: BuildToolDefinition = {
  name: 'openOCD',
  standardCmd: 'openocd',
  otherCmds: ['open-ocd'],
  folder: false,
  requiredByCortexDebug: true,
  installation: {
    xpm: '@xpack-dev-tools/openocd@latest',
  }
};

// TODO: figure out how to best install make on all relevant platforms
export const makeDefinition: BuildToolDefinition = {
  name: 'make',
  standardCmd: 'make',
  otherCmds: ['gmake'],
  folder: false,
  requiredByCortexDebug: false,
  installation: {},
};

//TODO: check if this is an easy install on linux and osx. 
//TODO: consider installing it anyway using a custom way.
const cmakeDefinition: BuildToolDefinition = {
  name: 'cmake',
  standardCmd: 'cmake',
  otherCmds: [],
  folder: false,
  requiredByCortexDebug: false,
  installation: {
    url: "https://cmake.org/download/"
  }
};

export const armNoneEabiDefinition: BuildToolDefinition = {
  name: 'Arm toolchain',
  standardCmd: 'arm-none-eabi-g++',
  otherCmds: ['arm-none-eabi-g++', 'arm-none-eabi-gcc', 'arm-none-eabi-objcopy', 'arm-none-eabi-size'],
  folder: true,
  installation: {
    xpm: '@xpack-dev-tools/arm-none-eabi-gcc@latest',
  },
  requiredByCortexDebug: true,
};