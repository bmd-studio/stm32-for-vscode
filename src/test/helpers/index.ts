import * as vscode from 'vscode';

export async function waitForWorkspaceFoldersChange(timeoutMs?: number): Promise<void> {
  let rejectTimeout = timeoutMs || 500;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Waiting for the workspace folder update timed out, at: ${rejectTimeout}ms`));
    }, rejectTimeout);
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      clearTimeout(timeout);
      resolve();
    });
  });
}