import {TaskDefinition} from 'vscode';

export const buildSTMTask: TaskDefinition = {
  label: 'Build STM',
  type: 'process',
  command: '${command:stm32-for-vscode.build}',
  options: {
    cwd: '${workspaceRoot}',
  },
  group: {
    kind: 'build',
    isDefault: true,
  },
  problemMatcher: [
    '$gcc',
  ],
};
export const buildCleanSTMTask: TaskDefinition = {
  label: 'Build Clean STM',
  type: 'process',
  command: '${command:stm32-for-vscode.cleanBuild}',
  options: {
    cwd: '${workspaceRoot}',
  },
  group: {
    kind: 'build',
    isDefault: true,
  },
  problemMatcher: [
    '$gcc',
  ],
};
export const flashSTMTask: TaskDefinition = {
  label: 'Flash STM',
  type: 'process',
  // eslint-disable-next-line no-template-curly-in-string
  command: '${command:stm32-for-vscode.flash}',
  options: {
    // eslint-disable-next-line no-template-curly-in-string
    cwd: '${workspaceRoot}',
  },
  group: {
    kind: 'build',
    isDefault: true,
  },
  problemMatcher: [
    '$gcc',
  ],
};

const STMTasks: TaskDefinition[] = [buildSTMTask, buildCleanSTMTask, flashSTMTask];
export default STMTasks;