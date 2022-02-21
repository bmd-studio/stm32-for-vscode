
import { TaskDefinition } from 'vscode';

const expectedResult: TaskDefinition = {
  showDevDebugOutput: true,
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