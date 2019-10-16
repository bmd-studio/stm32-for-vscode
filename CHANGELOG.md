# Changelog

## [Unreleased]
### Added
  - Add support to use different project types (EWARM, STM32CubeIDE, etc.).
  - Add support for compilation without generation of the .c/.h peripheral files.
  - Add ability to introduce generated changes from the main.c file into the main.cpp file.
  - Add a separate file for config options, like compiler flags.
  - Add support for unit testing using Google Test and Google Mock.
  - Add support for windows with xpm install.
### Fixed
 - Fix addition of main.c on windows machines during a .cpp project
 - Fix compilation issues when using STM32L031


## [2.0.1] - 2019-10-15
### Fixed
 - Fixed issue which could potentially crash the requirements check
 - Fixed bug for not writing launch and json files when the .vscode folder was not present.
 - Fixed issue with not showing pop-up for tools on Windows.
 - Fixed path seperators are different on windows, copied style of STM32Cube generated makefile

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
