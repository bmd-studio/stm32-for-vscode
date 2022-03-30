import MakefileInfo from '../types/MakeInfo';
import { TaskDefinition } from 'vscode';

export default function getLaunchTask(info: MakefileInfo): TaskDefinition {
  const config = {
    showDevDebugOutput: true,
    // eslint-disable-next-line no-template-curly-in-string
    cwd: '${workspaceRoot}',
    executable: `./build/${info.projectName}.elf`,
    name: 'Debug STM32',
    request: 'launch',
    type: 'cortex-debug',
    servertype: 'openocd',
    preLaunchTask: 'Build STM',
    device: 'stlink',
    configFiles: [
      'openocd.cfg',
    ],
  };
  return config;
}