import getOpenOCDTarget from './OpenOcdTargetFiles';

export default function getLaunchTask(
    info: {targetMCU: string, target: string}) {
  const config = {
    showDevDebugOutput: true,
    // eslint-disable-next-line no-template-curly-in-string
    cwd: '${workspaceRoot}',
    executable: `./build/${info.target}.elf`,
    name: 'Debug STM32',
    request: 'launch',
    type: 'cortex-debug',
    servertype: 'openocd',
    preLaunchTask: 'Build STM',
    device: 'stlink',
    configFiles: [
      'interface/stlink.cfg',
      `target/${getOpenOCDTarget(info.targetMCU)}`,
    ],
  };
  return config;
}