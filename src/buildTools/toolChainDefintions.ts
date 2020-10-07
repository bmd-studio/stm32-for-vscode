// import { ToolChain } from '../types/MakeInfo';

import * as process from 'process';

// const path pre
export const INSTALLATION_PATH = process.platform === 'win32' ? '%HOMEPATH%' : '~/';
export const STANDARD_XPM_PATH = './content/bin';
export const TOOL_FOLDER_PATH = 'stm32-for-vscode/packs/@xpack-dev-tools';// is installed as ~/stm32-for-vscode/packs/@xpack-dev-tools/PACKNAME/x.x.x-x.x/.content/bin


export interface BuildToolDefinition {
  name: string;
  standardCmd: string;
  otherCmds: string[];
  folder: boolean;
  requiredByCortexDebug: boolean;
  installation: {
    xpm?: string;
    url?: string;
    windows?: string;
    darwin?: string;
    linux?: string;
  };
  xpmPath?: string;
  xpmName?: string;
}


export const openocdDefinition: BuildToolDefinition = {
  name: 'openOCD',
  standardCmd: 'openocd',
  otherCmds: ['open-ocd'],
  folder: false,
  requiredByCortexDebug: true,
  installation: {
    xpm: '@xpack-dev-tools/openocd@latest',
  },
  xpmPath: './content/bin',
  xpmName: 'openocd',
};

// TODO: figure out how to best install make on all relevant platforms
// WIndows: The xPack Windows Build Tools
export const makeDefinition: BuildToolDefinition = {
  name: 'make',
  standardCmd: 'make',
  otherCmds: ['gmake'],
  folder: false,
  requiredByCortexDebug: false,
  installation: {
    windows: 'npx xpm install --global @xpack-dev-tools/windows-build-tools@latest',
    darwin: 'xcode-select --install',
    linux: 'sudo apt-get install build-essential',
  },
  xpmPath: './content/bin'
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
    xpm: '@xpack-dev-tools/cmake@latest',
    url: "https://cmake.org/download/",
  }
};

export const armNoneEabiDefinition: BuildToolDefinition = {
  name: 'Arm toolchain',
  standardCmd: 'arm-none-eabi-gcc',
  otherCmds: [],
  folder: true,
  installation: {
    xpm: '@xpack-dev-tools/arm-none-eabi-gcc@latest',
  },
  requiredByCortexDebug: true,
};