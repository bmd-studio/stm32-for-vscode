/* eslint-disable max-len */
import MakeInfo from './types/MakeInfo';
import { fsPathToPosix } from './Helpers';
import { makefileName } from './Definitions';

import { platform } from 'process';
import * as path from 'path';
import { Uri, workspace } from 'vscode';

function createCompilerInfo(makeInfo: MakeInfo): string {
  return `
# COMPILER INFO
rule c_COMPILER_FOR_BUILD
  command = "gcc" $ARGS -MD -MQ $out -MF $DEPFILE -o $out "-c" $in
  deps = gcc
  depfile = $DEPFILE_UNQUOTED
  description = Compiling C object $out

rule c_COMPILER
 command = "${makeInfo.tools.armToolchainPath}/arm-none-eabi-gcc" $ARGS -MD -MQ $out -MF $DEPFILE -o $out "-c" $in
 deps = gcc
 depfile = $DEPFILE_UNQUOTED
 description = Compiling C object $out
rule cxx_COMPILER
 command = "${makeInfo.tools.armToolchainPath}/arm-none-eabi-g++" $ARGS -MD -MQ $out -MF $DEPFILE -o $out "-c" $in
 deps = gcc
 depfile = $DEPFILE_UNQUOTED
 description = Compiling C object $out

# Rules for linking.
rule c_LINKER
 command = "${makeInfo.tools.armToolchainPath}/arm-none-eabi-${makeInfo.language === 'C++' ? 'g++' : 'gcc'}" $ARGS -o $out $in $LINK_ARGS
 description = Linking target $out
  `;
}


function createTargetOptions(makeInfo: MakeInfo): string {
  return `mcu = ${makeInfo.floatAbi} ${makeInfo.fpu} ${makeInfo.cpu} -mthumb`;
}

function createLibraries(makeInfo: MakeInfo): string {
  const libraries = makeInfo.libs.map(entry => `"-l${entry}"`).join(" ");
  const libraryDirectories = makeInfo.libdir.map(entry => `"-L${path.isAbsolute(entry) ? entry : path.join('../', entry)}"`).join(" ");
  // eslint-disable-next-line max-len
  return `libs = ${libraries} ${libraryDirectories}`;
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
build ${makeInfo.target}.elf.p/${path.basename(entry)}.o: c_COMPILER ${path.isAbsolute(entry) ? entry : path.join('../', entry,)}
 DEPFILE = "${makeInfo.target}.elf.p/${path.basename(entry)}.o.d"
 DEPFILE_UNQUOTED = ${makeInfo.target}.elf.p/${path.basename(entry)}.o.d
 ARGS = "-I${makeInfo.target}.elf.p" ${cFlags} ${cDefinitions} $libs $mcu ${includeDirectories} 
    `);
  });

  const asmBuilds = makeInfo.asmSources.map(entry => {
    return (
      // eslint-disable-next-line max-len
      `
build ${makeInfo.target}.elf.p/${path.basename(entry)}.o: c_COMPILER ${path.isAbsolute(entry) ? entry : path.join('../', entry,)}
 DEPFILE = "${makeInfo.target}.elf.p/${path.basename(entry)}.o.d"
 DEPFILE_UNQUOTED = ${makeInfo.target}.elf.p/${path.basename(entry)}.o.d
 ARGS = "-I${makeInfo.target}.elf.p" ${cFlags}  $libs $mcu ${cDefinitions} ${includeDirectories} $mcu
    `);
  });

  let cxxBuilds: string[] = [];
  if (makeInfo.language === 'C++') {
    cxxBuilds = makeInfo.cSources.map(entry => {
      return (
        // eslint-disable-next-line max-len
        `
build ${makeInfo.target}.elf.p/${path.basename(entry)}.o: cxx_COMPILER ${path.isAbsolute(entry) ? entry : path.join('../', entry)}
 DEPFILE = "${makeInfo.target}.elf.p/${path.basename(entry)}.o.d"
 DEPFILE_UNQUOTED = ${makeInfo.target}.elf.p/${path.basename(entry)}.o.d
 ARGS = "-I${makeInfo.target}.elf.p" ${cxxFlags}  $libs $mcu ${cxxDefinition} ${includeDirectories} $mcu
      `);
    });
  }

  let buildLines = cBuilds.join("\n");
  buildLines += asmBuilds.join('\n');
  buildLines += cxxBuilds.join("\n");

  return buildLines;
}

function createBuildRulesForLinker(makeInfo: MakeInfo): string {
  let sourcesLinked = makeInfo.cSources.map(entry => `${makeInfo.target}.elf.p/${path.basename(entry)}.o`);
  sourcesLinked = sourcesLinked.concat(makeInfo.asmSources.map(entry => `${makeInfo.target}.elf.p/${entry}.o`));
  if (makeInfo.language === 'C++') {
    sourcesLinked =
      sourcesLinked.concat(makeInfo.cxxSources.map(entry => `${makeInfo.target}.elf.p/${entry}.cpp.o`));
  }

  return `
build ${makeInfo.target}.elf: c_LINKER ${sourcesLinked.join(" ")}
  LINK_ARGS = $libs $mcu ${makeInfo.ldFlags.join(" ")} -T${makeInfo.ldscript}  -Wl,-Map=${makeInfo.target}.elf.p/${makeInfo.target}.map,--cref -Wl,--gc-sections"
  `;
}

function createBuildCommand(makeInfo: MakeInfo): string {
  return `build all: ${makeInfo.target}.elf`;
}


export function createNinjaBuildFile(makeInfo: MakeInfo): string {
  return (
    `
# Global variables
${createTargetOptions(makeInfo)}
${createLibraries(makeInfo)} 
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