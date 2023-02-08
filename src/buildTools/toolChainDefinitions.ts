// import { ToolChain } from '../types/MakeInfo';

import * as process from 'process';

// const path pre
export const INSTALLATION_PATH = process.platform === 'win32' ? '%HOMEPATH%' : '~/';
export const STANDARD_XPM_PATH = './content/bin';
// is installed as %globalstoragepath%/stm32-for-vscode/@xpack-dev-tools/PACKNAME/x.x.x-x.x/.content/bin
export const TOOL_FOLDER_PATH = 'stm32-for-vscode/@xpack-dev-tools';
export const XPACKS_DEV_TOOL_PATH = '@xpack-dev-tools';

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
    linux?: string | string[];
  };
  xpmPath: string;
  xpmName: string;
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
  xpmPath: './.content/bin',
  xpmName: 'openocd',
};

// NOTE: only one which isx not installed through xpm on all platforms
export const makeDefinition: BuildToolDefinition = {
  name: 'make',
  standardCmd: 'make',
  otherCmds: ['gmake'],
  folder: false,
  requiredByCortexDebug: false,
  installation: {
    windows: '@xpack-dev-tools/windows-build-tools@latest',
    darwin: 'xcode-select --install',
    linux: ['sudo', '-S apt-get install build-essential'],
  },
  xpmPath: './.content/bin',
  xpmName: 'windows-build-tools'
};

export const cMakeDefinition: BuildToolDefinition = {
  name: 'cmake',
  standardCmd: 'cmake',
  otherCmds: [],
  folder: false,
  requiredByCortexDebug: false,
  installation: {
    xpm: '@xpack-dev-tools/cmake@latest',
    url: "https://cmake.org/download/",
  },
  xpmName: 'cmake',
  xpmPath: './.content/bin'
};

export const armNoneEabiDefinition: BuildToolDefinition = {
  name: 'Arm toolchain',
  standardCmd: 'arm-none-eabi-gcc',
  otherCmds: [],
  folder: true,
  installation: {
    xpm: '@xpack-dev-tools/arm-none-eabi-gcc@latest',
  },
  xpmPath: './.content/bin',
  requiredByCortexDebug: true,
  xpmName: 'arm-none-eabi-gcc',
};
export const gccDefinition: BuildToolDefinition = {
  name: 'GCC toolchain',
  standardCmd: 'gcc',
  otherCmds: [],
  folder: tru       e,
  installation: {
    xpm: '@xpack-dev-tools/gcc@latest',
  },
  xpmPath: './.content/bin',
  requiredByCortexDebug: true,
  xpmName: 'gcc',
}

const BUILD_TOOL_DEFINITIONS: Record<string, BuildToolDefinition> = {
  arm: armNoneEabiDefinition,
  make: makeDefinition,
  openOCD: openocdDefinition,
  gcc: gccDefinition,
}
export default BUILD_TOOL_DEFINITIONS;
