
import { get } from 'lodash';

export function makeFSOverWritable(vscode: any): void {
  const fsOg = { ...vscode.workspace.fs };
  const fsKeys = Object.keys(vscode.workspace.fs);

  const fsProperties: { [key: string]: any } = {};
  fsKeys.forEach((key) => {
    fsProperties[key] = {
      value: get(vscode.workspace.fs, key),
      writeable: true,
      configurable: true,
    };
  });
  Object.defineProperty(vscode.workspace, 'fs', {
    value: fsOg,
    configurable: true,
  });
  Object.defineProperties(vscode.workspace.fs, fsProperties);
}