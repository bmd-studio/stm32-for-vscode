import { TaskDefinition } from 'vscode';

const expectedResult: TaskDefinition = {
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
export default expectedResult;

export const expectedResultWithSVD = {
  ...expectedResult,
  configFiles: [...expectedResult.configFiles, 'STM32H743x.svd']
};