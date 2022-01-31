import * as cp from 'child_process';
import * as path from 'path';
import * as process from 'process';
import * as shelljs from 'shelljs';

import {
  downloadAndUnzipVSCode,
  resolveCliPathFromVSCodeExecutablePath,
  runTests
} from '@vscode/test-electron';

async function main(): Promise<void> {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    // console.log(process);
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const vscodeExecutablePath = await downloadAndUnzipVSCode('stable');
    const cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);
    console.log({ vscodeExecutablePath, cliPath });
    const testExtensionPath = path.resolve(__dirname, '.vscode-test/extensions');
    const testPaths = {
      all: path.resolve(__dirname, './suite/index'),
      unit: path.resolve(__dirname, './unit/index'),
      build: path.resolve(__dirname, './integration/build'),
      emptyWorkspace: path.resolve(__dirname, './integration/emptyBuildTask.test'),
      buildTools: path.resolve(__dirname, './integration/buildToolsTest'),
      importAndBuild: path.resolve(__dirname, './integration/importAndBuild'),
      cxximportConvertBuild: path.resolve(__dirname, './integration/cxxBuildAndImport'),
    };

    const testWorkspaces = {
      makefileH7: path.resolve(__dirname, '../../src/test/workspaces/H753ZI'),
      empty: path.resolve(__dirname, '../../src/test/workspaces/empty'),
      cubeIDEExample: path.resolve(
        __dirname,
        '../../src/test/workspaces/CubeIdeExample/Projects/NUCLEO-G071RB/Applications/FreeRTOS/FreeRTOS_Mail'
      ),
      l5CxxProject: path.resolve(
        __dirname,
        '../../src/test/workspaces/l5_cpp_test_project/Secure'
      ),
    };

    cp.spawnSync(cliPath, [
      '--extensions-dir',
      testExtensionPath,
      '--install-extension',
      'marus25.cortex-debug'
    ], {
      encoding: 'utf-8',
      stdio: 'inherit'
    });


    // default unit test, should not matter where it runs
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath: testPaths.unit,
      launchArgs: [
        testWorkspaces.empty,
        '--extensions-dir',
        testExtensionPath
      ]
    });

    // install build tools
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath: testPaths.buildTools,
      launchArgs: [
        testWorkspaces.makefileH7,
        '--extensions-dir',
        testExtensionPath
      ]
    });

    // // default build integration test
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath: testPaths.build,
      launchArgs: [
        testWorkspaces.makefileH7,
        '--extensions-dir',
        testExtensionPath
      ]
    });
    // import and build integration test
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath: testPaths.importAndBuild,
      launchArgs: [
        testWorkspaces.cubeIDEExample,
        '--extensions-dir',
        testExtensionPath
      ]
    });
    // import and build l5 import and convert to CPP test
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath: testPaths.cxximportConvertBuild,
      launchArgs: [
        testWorkspaces.l5CxxProject,
        '--extensions-dir',
        testExtensionPath
      ]
    });


    // TODO: implement tooling clean-up.
  } catch (err) {
    // console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
