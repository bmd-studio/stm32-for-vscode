import * as vscode from 'vscode';
import CommandMenuProvider from './CommandMenu';

export default function addCommandMenu(context: vscode.ExtensionContext): CommandMenuProvider {
  const commandMenuProvider = new CommandMenuProvider(context);

  vscode.window.registerTreeDataProvider(
    'stm32ForVSCodeCommands',
    commandMenuProvider,
  );
  return commandMenuProvider;
}
