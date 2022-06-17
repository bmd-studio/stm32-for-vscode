import { TaskDefinition } from 'vscode';

export const debugFixture: TaskDefinition = {
  showDevDebugOutput: 'parsed',
  cwd: '${workspaceRoot}',
  executable: `./build/Clean_project_h7.elf`,
  name: 'Debug STM32',
  request: 'launch',
  type: 'cortex-debug',
  servertype: 'openocd',
  preLaunchTask: 'Build STM',
  device: 'stm32h743',
  configFiles: [
    'openocd.cfg',
  ],
};

export const attachFixture: TaskDefinition = {
  ...debugFixture,
  name: 'Attach STM32',
  request: 'attach',
};



export default ([debugFixture, attachFixture]);

export const debugFixtureWithSVD = {
  ...debugFixture,
  svdFile: 'STM32H743x.svd',
};

export const attachFixtureWithSVD = {
  ...attachFixture,
  svdFile: 'STM32H743x.svd',
};

