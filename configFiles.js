const _ = require('lodash');

const launchConfiguration = {
  showDevDebugOutput: true,
  cwd: '${workspaceRoot}',
  executable: './build/Firmware.elf',
  name: 'Debug STM32',
  request: 'launch',
  type: 'cortex-debug',
  servertype: 'openocd',
  preLaunchTask: 'Build STM',
  device: 'stlink',
  configFiles: [
    'interface/stlink-v2-1.cfg',
    'target/stm32wbx.cfg',
  ],
};

const buildTask = {
  label: 'Build STM',
  type: 'shell',
  command: 'make',
  options: {
    cwd: '${workspaceRoot}',
  },
  group: {
    kind: 'build',
    isDefault: true,
  },
  problemMatcher: [],
};

const uploadTask = {
  label: 'Load STM Firmware',
  type: 'shell',
  command: 'st-flash write ./build/Firmware.bin 0x08000000',
  options: {
    cwd: '${workspaceRoot}',
  },
  group: {
    kind: 'build',
    isDefault: true,
  },
  problemMatcher: [],
  dependsOn: [buildTask.label],
};

function getConfigFile(type, firmwareName, targetName, workspacePath, armPath) {
  let file = {};
  switch (type) {
    case 'build':
      file = _.cloneDeep(buildTask);
      file.command = `node ${__dirname}/STM32Cli build ${workspacePath.replace(/(\s+)/g, '\\$1')}`;
      if (armPath) {
        file.command += ` --armPath=${armPath}`;
      }
      break;
    case 'upload':
      file = _.cloneDeep(uploadTask);
      file.command = file.command.replace('Firmware', firmwareName);
      break;
    case 'debug':
      file = _.cloneDeep(launchConfiguration);
      file.executable = file.executable.replace('Firmware', firmwareName);
      file.configFiles = [
        'interface/stlink-v2-1.cfg',
        `target/${targetName}.cfg`,
      ];
      break;
    default:
  }
  return file;
}


module.exports = getConfigFile;
