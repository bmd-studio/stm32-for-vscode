import MakefileInfo from '../types/MakeInfo';
import { TaskDefinition } from 'vscode';

export function getCortexDevice(info: MakefileInfo): string {
  const device = info.asmSources.find((entry) => entry.indexOf('startup_') >= 0);
  if (device) {
    return device.replace('startup_', '').replace('xx.s', '');
  }
  return '';
}



export default function getLaunchTask(info: MakefileInfo): TaskDefinition {
  const config = {
    showDevDebugOutput: 'parsed',
    // eslint-disable-next-line no-template-curly-in-string
    cwd: '${workspaceRoot}',
    executable: `./build/${info.target}.elf`,
    name: 'Debug STM32',
    request: 'launch',
    type: 'cortex-debug',
    servertype: 'openocd',
    preLaunchTask: 'Build STM',
    device: getCortexDevice(info),
    configFiles: [
      'openocd.cfg',
    ],
  };
  return config;
}

export function getAttachTask(info: MakefileInfo): TaskDefinition {
  const attachTask = getLaunchTask(info);
  attachTask.name = 'Attach STM32';
  attachTask.request = 'attach';
  return attachTask;
}