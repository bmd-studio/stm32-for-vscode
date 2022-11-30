import * as cp from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as process from 'process';

import {
  downloadAndUnzipVSCode,
  resolveCliArgsFromVSCodeExecutablePath,
  runTests
} from '@vscode/test-electron';

import { platform } from 'process';

async function main(): Promise<void> {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    let vscodeExecutablePath = undefined;
    if (platform === 'win32') {
      vscodeExecutablePath = await downloadAndUnzipVSCode('stable', 'win32-x64-archive');
    } else {
      vscodeExecutablePath = await downloadAndUnzipVSCode('stable');
    }
    const [cli, ...args] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
    const testExtensionPath = path.resolve(__dirname, '.vscode-test/extensions');
    const testPaths = {
      all: path.resolve(__dirname, './suite/index'),
      unit: path.resolve(__dirname, './unit/index'),
      build: path.resolve(__dirname, './integration/build'),
      emptyWorkspace: path.resolve(__dirname, './integration/emptyBuildTask.test'),
      buildTools: path.resolve(__dirname, './integration/buildToolsTest'),
      importAndBuild: path.resolve(__dirname, './integration/importAndBuild'),
      cxximportConvertBuild: path.resolve(__dirname, './integration/cxxBuildAndImport'),
      customMakefileRules: path.resolve(__dirname, './integration/customMakefileRulesTest'),
      l0Test: path.resolve(__dirname, './integration/l0'),
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
      l0Project: path.resolve(
        __dirname,
        '../../src/test/workspaces/l0_project'
      ),
    };
    const defaultLaunchArguments = [
      '--extensions-dir',
      testExtensionPath,
      '--user-data-dir',
      `${os.tmpdir()}`
    ];

    cp.spawnSync(cli, [
      ...args,
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
        ...defaultLaunchArguments,
      ]
    });

    // only run unit tests.
    if (process.env.TEST_ENVIRONMENT === 'unit') {
      return;
    }

    // install build tools
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath: testPaths.buildTools,
      launchArgs: [
        testWorkspaces.makefileH7,
        ...defaultLaunchArguments,
      ]
    });

    // // default build integration test
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath: testPaths.build,
      launchArgs: [
        testWorkspaces.makefileH7,
        ...defaultLaunchArguments
      ]
    });
    // import and build integration test
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath: testPaths.importAndBuild,
      launchArgs: [
        testWorkspaces.cubeIDEExample,
        ...defaultLaunchArguments,
      ]
    });
    // import and build l5 import and convert to CPP test
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath: testPaths.cxximportConvertBuild,
      launchArgs: [
        testWorkspaces.l5CxxProject,
        ...defaultLaunchArguments,
      ]
    });

    // testing custom rules for the makefile
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath: testPaths.customMakefileRules,
      launchArgs: [
        testWorkspaces.makefileH7,
        ...defaultLaunchArguments,
      ]
    });

    // test for l0 and openocd configuration
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath: testPaths.l0Test,
      launchArgs: [
        testWorkspaces.l0Project,
        ...defaultLaunchArguments,
      ]
    });

    // TODO: implement tooling clean-up.
  } catch (err) {
    // console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
