import * as vscode from "vscode";
import { forEach } from "lodash";
import { BUILD_CLEAN_TASK_NAME, BUILD_TASK_NAME } from "../configuration/BuildTasksConfig";

export interface BuildCommandDefinition {
  label: string;
  command: string;
  explanation: string;
  arguments?: string[];
}

const buildCommand: BuildCommandDefinition = {
  label: 'Build',
  command: 'workbench.action.tasks.runTask',
  arguments: [BUILD_TASK_NAME],
  explanation: 'Builds the firmware for te STM32 project',
};
const cleanBuildCommand: BuildCommandDefinition = {
  label: 'Clean build',
  command: 'workbench.action.tasks.runTask',
  arguments: [BUILD_CLEAN_TASK_NAME],
  explanation: 'Performs a clean build, by removing earlier build files and build from scratch.',
};
const flashCommand: BuildCommandDefinition = {
  label: 'Flash STM32',
  command: 'stm32-for-vscode.flash',
  explanation: 'Builds and subsequently flashes the firmware to the STM32 MCU',
};
const debugCommand: BuildCommandDefinition = {
  label: 'Debug STM32',
  command: 'workbench.action.debug.start',
  arguments: ['Debug STM32'],
  explanation: 'Starts a debugging session for the STM32 MCU',
};
const changeProgrammerCommand: BuildCommandDefinition = {
  label: 'Change programmer',
  command: 'stm32-for-vscode.setProgrammer',
  explanation: `Changes the programming interface in the openocd.cfg file. 
  A list with available programmers will be provided`,
};
const importCubeProject: BuildCommandDefinition = {
  label: "run CubeIDE importer",
  command: 'stm32-for-vscode.importCubeIDEProject',
  explanation: 'Will import a CubeIDE project or example project when present in the current workspace.'
};

const COMMANDS: { [key: string]: BuildCommandDefinition } = {
  buildCommand,
  cleanBuildCommand,
  flashCommand,
  debugCommand,
  changeProgrammerCommand,
  importCubeProject
};

class BuildCommand extends vscode.TreeItem {
  public constructor(
    label: string,
    explanation: string,
    command: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    args?: string[],
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}: ${explanation}`;
    this.description = '';
    this.command = {
      command,
      arguments: args,
      title: label,
    };
  }
}

export default class CommandMenuProvider implements vscode.TreeDataProvider<BuildCommand> {
  private context: vscode.ExtensionContext;
  public constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public getTreeItem(element: BuildCommand): vscode.TreeItem {
    return element;
  }
  public getChildren(): BuildCommand[] {
    const hasBuildTools = this.context.globalState.get('hasBuildTools');
    if (!hasBuildTools) {
      setTimeout(() => {
        this.refresh();
      }, 1000);
      return [];
    }

    const commands: BuildCommand[] = [];
    forEach(COMMANDS, (command: BuildCommandDefinition) => {
      commands.push(
        new BuildCommand(
          command.label,
          command.explanation,
          command.command,
          vscode.TreeItemCollapsibleState.None,
          command?.arguments
        )
      );
    });
    return commands;
  }
  // eslint-disable-next-line max-len
  private _onDidChangeTreeData: vscode.EventEmitter<BuildCommand | undefined> = new vscode.EventEmitter<BuildCommand | undefined>();
  public readonly onDidChangeTreeData: vscode.Event<BuildCommand | undefined> = this._onDidChangeTreeData.event;

  public refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
}

