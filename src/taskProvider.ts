import { tasks, Task, workspace, ShellExecution, CancellationToken, ProviderResult, TaskScope } from 'vscode';

const testTask = new Task(
  {
    type: 'stm32-for-vscode',
    task: "test"
  },
  workspace?.workspaceFolders?.[0] || TaskScope.Workspace,
  'test',
  'stm32-for-vscode',
  new ShellExecution('echo test'),
);
const buildTask = new Task(
  { type: 'stm32-for-vscode', task: "build" },
  workspace?.workspaceFolders?.[0] || TaskScope.Workspace,
  'compile',
  'stm32-for-vscode',
  new ShellExecution('echo test')
);

tasks.registerTaskProvider('stm32-for-vscode', {
  provideTasks: () => {
    return [testTask];
  },
  resolveTask: function (task: Task, _token: CancellationToken): ProviderResult<Task> {
    throw new Error(`unknown task: ${JSON.stringify(task, null, 2)}`);
    return buildTask;
  }
});
