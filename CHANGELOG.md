# Changelog

## [Unreleased]
### Added
	- Add support for unit testing.
	- Create a way to embed these types of projects into a CI/CD environment
	- Full support for CubeIDE imports.
	- Add option to select installation location for the tooling.

## [3.2.9] - 2024-09-27
### Added
 - Issue #206: Did not build anything else than elf files due to the all recipe not being correct.
 - Issue #212: On Windows threw an error because the build folder was already there. Now checks before using the md command. Thanks to: qwertym88 

## [3.2.8] - 2024-09-05
### Added
 - Issue #197: Added CONTRIBUTING.md files thanks to DeflateAwning
 - Issue #201: Dissambly was added to the build output. This was thanks to DeucalionMK. 

### Fixed
- Issue #199: Deleted docs folder, as it was not updated regularly and did not add anything. DeflateAwning fixed this and put in a merge request.
- Issue #204: Hash symbol within library name breaks compilation. Has symbol is now escaped. Merge request by DeflateAwning.

## [3.2.7] - 2024-04-28
### Added
- Issue #84 Add -fno-rtti and -fno-exceptions as default for C++ builds.
- Added an .stm32env file which set-up the paths to openocd and the ARM toolchain. This can also be used to change other things in the build in a local setup.
- Issue #144 Added a way to change the build folder using the .stm32env file.

### Fixed
- Issue #181 added a way to extract the asmm part of files from the ST Makefile. 
- Issue #179 now create a prompt to save cortex debug info to the global space, so is should not create a local workspace setting each time.
- Issue #176 Added a project name field for the blank setup wizard so the project has a default name.

## [3.2.6] - 2024-01-09
### Fixed
- Issue #81: The extension would add settings to random projects for which it did not need to add settings. Cvanbeek13 fixed this issue and created a pull request.
### Added
- Issue #168: added -Wl,--print-memory-usage as a default flag for initial project generation.

## [3.2.5] - 2023-03-25
### Fixed
- Issue #150: hot fix for makefile generation issues due to feature added by #143.
## [3.2.4] - 2023-03-24 
### Fixed
 - Issue #139: Fixed issue where after generation something went wrong with getting new information from the makefile.
 - Better SVD file finding using Levenstein distance.
 - Issue #147: Fixed issue where build tools were not installing due to pre-installed node.
### Added
 - Issue #143: Added support for capitalized assembly file extensions (.S) as it is required for AzureRTOS.

## [3.2.3] - 2022-11-14 
### Addded
	- Issue #101 & #119: Added make flags to the configuration file. This allows to add the --silent flag to the build and to prevent output mixing on parallel compilation.
### Fixed
	- Issue #116: Fixed issue where the STM32 configuration file would silently delete if there was something wrong while parsing the yaml file.
	- c_cpp_properties.json would have reflect the current configuration. Changed it so it is regenerated upon each new build.
	- Issues #125: Issue with the openocd configuration for the STM32l0 line. With thanks to: signorettae.
	- Issue #91: LIBS variabel in the cube generated makefile was not read correctly.
## [3.2.2] - 2022-06-29
### Fixed
 - Fixed Issue #96: Fixed issue where debugging for C++ gave no source file error due to missing debugging flags.
 - Fix: SVD was added as a configuration file to the debugging configuration. Is now added to the specific SVDFile key.
 - Issue #108 Fix: clean build failed when already cleaned. Now check for this and throws an error when cleaning fails, but continuous to build.
### Added
 - Issue #94: Extension will try and find the SVD file for the specific MCU, add it to the workspace folder and add it to the cortex-debug launch configuration.
 - Added attach debug configuration
 - Issue #109: Added custom makefile rule option to the STM32-for-VSCode.config.yaml file which allows for custom makefile rules to be included.
	
## [3.2.1] - 2022-03-08
### Fixed
 - Issue #97: Fixed issue where the default values of fpu and float-abi were not correct. These are now left empty and will not be included as compiler flags when not set.

## [3.2.0] - 2022-02-21
### Added
 - Added importer for STM32CubeIDE projects and example projects.

### Fixed
 - Issue #94: Switched from stlink to the MCU device type in the device field when configuring cortex-debug.
 - Issue #88: Not mixing C++ flags and C flags anymore while compiling. They are now separate in the makefile.
## [3.1.5] - 2021-11-18
### Added
- Issue #89: Added automatic main.cpp generation with a main.c file, if the language is set to .cpp
### Fixed
 - Issue #81: added extra check to see if the openocd paths are correctly setup, however the settings should not be added anyhow when the extension does not start.
 - Issue #88: separated c and cpp flags, however upon getting information from the makefile it does add the c Definitions to the cpp definitions.
## [3.1.4] - 2021-07-27
### Added
 - Issue #77: Added .cc extension inclusion for c++ build files.

## [3.1.3] - 2021-07-11
### Added
 - Issue #76: Added support for installation of tools on the Apple M1 macs
 - Default search paths for include directories in the source directories, as this is often standard practice to embed folders with additional code in there.

### Fixed
 - Fixed configuration not updating or generating when the build failed.
## [3.1.2] - 2021-06-23
### Changes
 - Reverted to standard node/npx cache, as this worked for powershell but not for command addressing.
 - Issue #74: Additional c/cxx/assembly flags from the configuration file were not included in the final makefile. This has been fixed.
## [3.1.1] - 2021-06-19
### Fixed
 - There was an issue with the npx/npm cache which did not have read/write permissions when no earlier version of node was installed. This has been fixed.
## [3.1.0] - 2021-06-16
### Added
	- Issue #73: Added support for a separate input definition file in the config file.
### Changes
 - Added the STM32: prefix to all the STM32 for VSCode commands.
## [3.0.7] - 2021-05-22
### Fixed
 - Issue #69: replaced space with underscore when spaces are present in a target.
 - Issue #70: Launch and tasks configurations are not overwritten anymore when present. 
## [3.0.6] - 2021-05-06
### Fixed
	- Issue #65: There were issue with building on linux due to pathing, sudo when installing make. This has been fixed with this update.
## [3.0.5] - 2021-22-04
### Fixed
 - Issue #55 persisted. Due to not implementing a fix besides the make command. The pathing issues were also present when using makefile commands like flash and clean.
 - Issue #64: Compile errors and warning were not added to the problem window. Fixed this using a problem matcher in the intermediate task.
 - Issue where the extension would not startup due to an internal error which originated from searching for available build tools.
## [3.0.4] - 2021-17-04
### Fixed
 - Issue #55 persisted. Now there is an explicit check on powershell and it adapts the command specifically for powershell.
 - Issue #62 and issue #63 Assembly flags were not passed along to the final makefile. They now are
 - There was an issue where some additional default values were not passed along when building for the first time.
 - Installation of node on Linux and darwin failed due to decompression issues. This has been fixed by using a different package.
 - Could not find npx after installation, due to windows having npx in the root folder of the node download and osx and linux have them in the bin folder.
## [3.0.3] - 2021-15-04
### Fixed
 - Issue #61 makefile was always required. Fix this so compilation is possible with only using the config file.
 - The config file did not take over the target name from the makefile. It now does.
 - Issue #59 commented that non restricted -j could freeze systems on compilation. Now set it to a max of 16.
## [3.0.2] - 2021-15-04
### Fixed
 - Issue #55 (revisited) powershell was still giving issue due to path escaping not working. Solved this by switching to CMD when available.
### Added
 - Issue #59 Added -j flag to make so it will compile in parallel and in turn compile faster.

## [3.0.1] - 2021-14-04
### Fixed
 - Issue #55 escaped path for make did not work. Fixed this on top of this the full path is always used with make.
 - Issue #56 Old versions of node gave issues upon installation. Now the newest version is always used.
 - Issue #57 There was an issue where it would not update the global settings, but instead update settings.json.
## [3.0.0] - 2021-10-04
Major upgrade from the previous version. The major changes are that a config file is added, so a project does not need a Makefile to work.
On top of this a new menu is introduced, which has build, clean build, flash, debug and change programmer commands.
On top of this a lot of the internal structure has changes so it should be more robust.
### Added
 - Added a separate file for config options of the whole project
 - Added a way to install all the build tools at once for STM32 for VSCode (Issue #26)
 - Added an initial start-up check for Build tools
 - Added a way to switch programmer using a quick pick.
 - Added a side menu for STM32 for VSCode which activates when an .ioc file or an STM32-for-VSCode.config.yaml file is present.
 - Issue #21 Added optimization arguments to the project configuration file.
 - Issue #29 added support for static library inclusion in the config file.
 - Issue #39 custom file locations can be added using the project configuration file.

### Changes
 - Openocd is now configured using and openocd.cfg file, which gives the user more freedom to change settings. (Issue #37)

### Fixed
 - A lot of minor fixes that went a long with refactoring most of the code base
 - Added support for space escaping in the openocd and arm toolchain path in the makefile.
 - Issue where it did not include libraries from the makefile (Issue #29)
 - Fixed issue #41 by using a posix path in the makefile and adding space escaping.
 - Fixed Issue #44 where the build task could not be tracked. The cause seemed to be an unresolved Promise.
 - Fixed issue #47 compiler path was not added to c_cpp_properties.
 - Fixed and issue where non floating point MCUs would not compile.

## [2.2.4] - 2020-09-09
### Fixed
 - Issue #35 when adding the stdc++ library to the original makefile it did not take the ++ part

## [2.2.3] - 2020-09-08
### Fixed
 - Fixed issue where the makefile did not respond well to relative paths for the gcc compiler.

## [2.2.2] - 2020-09-07
### Fixed
 - Issue #25: Added absolute compiler path to c_cpp_properties.json

## [2.2.1] - 2020-09-07
### Added
 - Issue #11 & Issue #33 : Add support for different programmers.
	
## [2.2.0] - 2020-09-04
### Fixed
 - Issue #32: Switched to g++ linker when linking C++ project.
 - Issue with clean build on Windows where the remove command did not work
 - Issue #25: Buggy IntelliSense, removed compiler in the c_cpp_properties.json, intellisense works fine without it.
 - Issue #32: Did not use g++ linker when compiling library files. It now uses g++ linker when compiling C++

### Added
- Added support for new STM32 Devices in OpenOCD 0.10.0-20200310 (merge request #18 by seancsi)
- Issue #22: Added support for the advanced project structure.
- Support for libraries and automatic inclusion in libs directory (with support from seancsi)
- Merge #31: Added github actions for testing (thanks to klaygomes)
- Added testing to a lot of files to speed up feature implementation and stability.

## [2.1.5] - 2020-03-13
### Fixed
 - Issue #15: Fixed overwrite off c_cpp_properties and retained added folders.
 - Make exits before completion. This makes debugger not act on the new file.
 - Fixed issue where deeper inclusions in Src or Inc did not have forward slash in windows

### Added
- Issue #9: Add an .stmignore file for ignoring globs.
- Automatically ignore files in test and example in the lib folder (using default .stmignore file).

## [2.0.5] - 2019-11-25
### Fixed
 - Fixed issue where the launch, c_cpp_properties and task files would not be created.

## [2.0.4] - 2019-11-02
### Fixed
 - Fixed issue with clean build on linux (merged fix from Bonnee)
 - Fixed autogenerated debug configuration fail
 - Fixed Build terminal won't open again

## [2.0.3] - 2019-10-28
### Fixed
 - Fixed an issue where the extension would not startup on flash

## [2.0.2] - 2019-10-20
### Fixed
 - Fix addition of main.c on windows machines during a .cpp project
 - Fix compilation issues when using STM32L031

### Changed
 - Switch from regular fs to VSCode's workspace fs

## [2.0.1] - 2019-10-15
### Fixed
 - Fixed issue which could potentially crash the requirements check
 - Fixed bug for not writing launch and json files when the .vscode folder was not present.
 - Fixed issue with not showing pop-up for tools on Windows.
 - Fixed path seperators are different on windows, copied style of STM32Cube generated makefile
 - Fixed issue where sub directories of library files are not added on Windows, because of path seperators

## [2.0.0] - 2019-10-07
### Added
 - Added support for task compilation using the build in extension commands.
 - Added support for problem matching while compiling for STM.
 - Added download link in the tool missing pop-up.
 - Added brew install on OSX for the tool missing pop-up. 
 - Added apt-get for linux for the tool missing pop-up.
 - Added add path for the tool missing pop-up.
 - Added full support to add the tool path in the extension settings.
 - Added support to auto configure cortex-debug settings.
 - Added internal tests for the extension.
 - Added auto intellisense management for STM32 projects.

### Changed
- Stricter adherence to Src, Inc and Lib folders.
- Libraries are added through the definition in the makefile for faster compilation and to not include superfluous .c files
- Packaged the app.

### Removed
 - Removed dependency on the external STM32 for VSCode CLI.
 - Removed dependency on the external ST-Flash tool.

## [1.8.6] - 2017-07-30
### Added

### Changed

### Fixed
 - Because of packaging things went awry. Fixed through not using the package

## [1.8.1] - 2017-07-30
### Added

### Changed

### Fixed
 - Packaging needed entry point in package.json to be changed.

## [1.8.0] - 2017-07-23
### Added
 - Added support for Cortex-Debug configuration file for debugging.
 - Added support for main.cpp file in conjunction with a main.c file, it will auto compile for the main.cpp [EXPERIMENTAL]

### Changed
 - Stopped overwriting makefile and created stm32make file instead.
 - Stopped checking for requirements in the build CLI.

### Fixed
 - Stopped adding unnecessary .h files in includes.
 - Stopped unnecessary remake of makefile.
 - Fixed NPM package vulnerabilities.
