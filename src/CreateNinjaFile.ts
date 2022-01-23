/* eslint-disable max-len */
import MakeInfo from './types/MakeInfo';
import { fsPathToPosix } from './Helpers';
import { makefileName } from './Definitions';

import { platform } from 'process';
import * as path from 'path';
import { Uri, workspace } from 'vscode';



// TODO: think about what kind of flags need to be added.
// TODO: add bin, and hex file generation
// TODO: add size information
// TODO: checkout the inline inconsistency where inline function does work with the makefile but not for the ninja makefile. 
function convertPathToPathFromBuildFile(pathString: string): string {
  return path.isAbsolute(pathString) ? pathString : path.join('../', pathString)
}

function createCompilerInfo(makeInfo: MakeInfo): string {
  return `
# COMPILER INFO
rule c_COMPILER
 command = "${makeInfo.tools.armToolchainPath}/arm-none-eabi-gcc" -c $mcu $libs $c_definitions $optimization $build_flags $include_files -MMD -MP -MF"$DEPENDENCY_FILE" -Wa,-a,-ad,-alms=$LIST_FILE $in -o $out
 deps = gcc
 depfile = $DEPENDENCY_FILE
 description = Compiling C object $out
rule cxx_COMPILER
 command = "${makeInfo.tools.armToolchainPath}/arm-none-eabi-g++" -c $mcu $libs $cxx_definitions $optimization $build_flags $include_files -MMD -MP -MF"$DEPENDENCY_FILE" -Wa,-a,-ad,-alms=$LIST_FILE $in -o $out
 deps = gcc
 depfile = $DEPENDENCY_FILE
 description = Compiling C object $out
# Rules for linking.
rule c_LINKER
 command = "${makeInfo.tools.armToolchainPath}/arm-none-eabi-${makeInfo.language === 'C++' ? 'g++' : 'gcc'}" $in $mcu $libs $linker_flags -Wl,-Map=$\{MAP_FILE},--cref -Wl,--gc-sections -o $out
 description = Linking target $out
  `;
}


function createTargetOptions(makeInfo: MakeInfo): string {
  return `mcu = ${makeInfo.floatAbi} ${makeInfo.fpu} ${makeInfo.cpu} -mthumb`;
}

function createLibraries(makeInfo: MakeInfo): string {
  const libraries = makeInfo.libs.map(entry => `"-l${entry}"`).join(" ");
  const libraryDirectories = makeInfo.libdir.map(entry => `"-L${convertPathToPathFromBuildFile(entry)}"`).join(" ");
  // eslint-disable-next-line max-len
  return `libs = ${libraries} ${libraryDirectories}`;
}
function createIncludes(makeInfo: MakeInfo): string {
  const includes = makeInfo.cIncludes.map(entry => `-I"${convertPathToPathFromBuildFile(entry)}"`).join(" ");
  return `include_files=${includes}`;
}
function createDefinitions(makeInfo: MakeInfo): string {
  const cDefinitions = makeInfo.cDefs.map(entry => `"-D${entry}"`).join(" ");
  const cxxDefinition = makeInfo.cxxDefs.map(entry => `"-D${entry}"`).join(" ");
  return `
c_definitions = ${cDefinitions}
cxx_definitions = ${cxxDefinition}
  `;
}

function createOptimization(makeInfo: MakeInfo): string {
  return `optimisation = ${makeInfo.optimization}`;
}

function creatAdditionalBuildFlags(): string {
  return `build_flags = -fdata-sections -ffunction-sections -g -gdwarf-2`;
}
function createLinkerFlags(makeInfo: MakeInfo): string {
  let linkerFlags = makeInfo.ldFlags.join(" ");
  linkerFlags += ` -T"${convertPathToPathFromBuildFile(makeInfo.ldscript)}"`;
  return `linker_flags = ${linkerFlags}`;
}




function createBuildRulesForSources(makeInfo: MakeInfo): string {
  const includeDirectories = makeInfo.cIncludes.map((entry) => {
    return `-I${path.isAbsolute(entry) ? entry : path.join('../', entry)}`;
  }).join(" ");
  const cFlags = makeInfo.cFlags.map(entry => `"${entry}"`).join(" ");
  const cxxFlags = makeInfo.cxxFlags.map(entry => `"${entry}"`).join(" ");


  const cDefinitions = makeInfo.cDefs.map(entry => `"-D${entry}"`).join(" ");
  const cxxDefinition = makeInfo.cxxDefs.map(entry => `"-D${entry}"`).join(" ");



  const cBuilds = makeInfo.cSources.map(entry => {
    return (
      // eslint-disable-next-line max-len
      `
build build/${path.basename(entry)}.o: c_COMPILER ${convertPathToPathFromBuildFile(entry)}
  DEPENDENCY_FILE = build/${path.basename(entry)}.d
  LIST_FILE = build/${path.basename(entry)}.lst
    `);
  });

  const asmBuilds = makeInfo.asmSources.map(entry => {
    return (
      // eslint-disable-next-line max-len
      `
build build/${path.basename(entry)}.o: c_COMPILER ${convertPathToPathFromBuildFile(entry)}
  DEPENDENCY_FILE = build/${path.basename(entry)}.d
  LIST_FILE = build/${path.basename(entry)}.lst
    `);
  });

  let cxxBuilds: string[] = [];
  if (makeInfo.language === 'C++') {
    cxxBuilds = makeInfo.cSources.map(entry => {
      return (
        // eslint-disable-next-line max-len
        `
build build/${path.basename(entry)}.o: cxx_COMPILER ${convertPathToPathFromBuildFile(entry)}
  DEPENDENCY_FILE = build/${path.basename(entry)}.d
  LIST_FILE = build/${path.basename(entry)}.lst
      `);
    });
  }

  let buildLines = cBuilds.join("\n");
  buildLines += asmBuilds.join('\n');
  buildLines += cxxBuilds.join("\n");

  return buildLines;
}

function createBuildRulesForLinker(makeInfo: MakeInfo): string {
  let sourcesLinked = makeInfo.cSources.map(entry => `build/${path.basename(entry)}.o`);
  sourcesLinked = sourcesLinked.concat(makeInfo.asmSources.map(entry => `build/${entry}.o`));
  if (makeInfo.language === 'C++') {
    sourcesLinked =
      sourcesLinked.concat(makeInfo.cxxSources.map(entry => `build/${entry}.o`));
  }

  return `
build ${makeInfo.target}.elf: c_LINKER ${sourcesLinked.join(" ")}
  MAP_FILE = build/${makeInfo.target}.map
  `;
}

function createBuildCommand(makeInfo: MakeInfo): string {
  return `build all: ${makeInfo.target}.elf`;
}


export function createNinjaBuildFile(makeInfo: MakeInfo): string {
  return (
    `
# Global variables
${createOptimization(makeInfo)}
${createTargetOptions(makeInfo)}
${createLibraries(makeInfo)}
${createDefinitions(makeInfo)} 
${createIncludes(makeInfo)}
${creatAdditionalBuildFlags()}
${createLinkerFlags(makeInfo)}
${createCompilerInfo(makeInfo)}
# Rules for building sources
${createBuildRulesForSources(makeInfo)}
# Linking rule
${createBuildRulesForLinker(makeInfo)}
`);
}

export async function writeNinjaFile(makeInfo: MakeInfo, workspacePath: Uri): Promise<void> {
  const ninjaBuildFilePath = path.join(workspacePath.fsPath, 'build', 'build.ninja');
  const file = createNinjaBuildFile(makeInfo);
  await workspace.fs.writeFile(Uri.file(ninjaBuildFilePath), Buffer.from(file, 'utf8'));
}