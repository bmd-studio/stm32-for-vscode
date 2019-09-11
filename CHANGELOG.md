# Changelog

## [Unreleased]
### Added
  - Added support for CMake.
  - Download link to openOCD in check pop-up
  - Download link to STM utilities in check pop-up.
  - Add extension settings in VSCode settings.
  - Add ability to add Path to tools (openocd, gdb, etc.) within check for tools pop-up.
  - Add support to use different project types (EWARM, STM32CubeIDE, etc.).
  - Add support for compilation without generation of the .c/.h peripheral files.
  - Add ability to introduce generated changes from the main.c file into the main.cpp file.
  - Add better support for intellisense.
  - Add to tasks, so no support for the separate CLI is needed.
  - Package for better performance
  - Create include branch from main.cpp or main.c file so unnecessary includes are not included.
  - Add a separate file for config options, like compiler flags.
  - Remove dependency for st-flash and focus on uploading through openOCD see: https://www.hackster.io/yusefkarim/upload-code-to-stm32l4-using-linux-gnu-make-and-openocd-a3d4de
  - Stricter adherence to Src, Inc, Lib, Test directories.
  - Add support for unit testing.

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
