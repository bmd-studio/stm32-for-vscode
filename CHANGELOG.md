# Changelog

## [Unreleased]

## [1.1.0] - 2017-07-04
### Added
 - Added support for Cortex-Debug configuration file for debugging.
 - Added support for main.cpp file in conjunction with a main.c file, it will auto compile for the main.cpp

### Changed
 - Stopped overwriting makefile and created stm32make file instead.
 - Stopped checking for requirements in the build CLI.

### Fixed
 - Stopped adding .h files
 - Stopped unnecessary remake of makefile
