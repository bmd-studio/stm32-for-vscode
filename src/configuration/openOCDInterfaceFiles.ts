export const standardInterfaceFiles: string[] = [
  "altera-usb-blaster",
  "dummy", "kitprog", "raspberrypi-native", "ti-icdi",
  "altera-usb-blaster2", "estick", "nds32-aice", "rlink", "ulink",
  "arm-jtag-ew", "flashlink", "nulink", "rshim", "usb-jtag",
  "at91rm9200", "ft232r", "opendous", "stlink", "usbprog",
  "buspirate", "ftdi", 'openjtag', "stlink-dap", "vsllink",
  "calao-usb-a9260", "imx-native", "osbdm", "stlink-v1", "xds110",
  "chameleon", "jlink", "parport", "stlink-v2",
  "cmsis-dap", "jtag_dpi", "parport_dlc5", "stlink-v2-1",
  "dln-2-gpiod", "jtag_vpi", "raspberrypi2-native", "sysfsgpio-raspberrypi",
];

export const ftdiInterfaceFiles: string[] = [
  "100ask-openjtag", "hilscher_nxhx10_etm", "luminary-lm3s811", "redbee-usb",
  "axm0432", "hilscher_nxhx50_etm", "m53evk", "rowley-cc-arm-swd",
  "c232hm", "hilscher_nxhx50_re", "mbftdi", "sheevaplug",
  "calao-usb-a9260-c01", "hilscher_nxhx500_etm", "minimodule", "signalyzer",
  "calao-usb-a9260-c02", "hilscher_nxhx500_re", "minimodule-swd", "signalyzer-lite",
  "cortino", "hitex_lpc1768stick", "minispartan6", "snps_sdp",
  "digilent_jtag_hs3", "hitex_str9-comstick", "neodb", "stm32-stick",
  "digilent_jtag_smt2", "icebear", "ngxtech", "swd-resistor-hack",
  "digilent_jtag_smt2_nc", "imx8mp-evk", "olimex-arm-jtag-swd", "ti-icdi",
  "digilent-hs1", "incircuit-icprog", "olimex-arm-usb-ocd", "tumpa",
  "digilent-hs2", "iotlab-usb", "olimex-arm-usb-ocd-h", "tumpa-lite",
  "dlp-usb1232h", "isodebug", "olimex-arm-usb-tiny-h", "turtelizer2-revB",
  "dp_busblaster", "jtagkey", "olimex-jtag-tiny", "turtelizer2-revC",
  "dp_busblaster_kt-link", "jtagkey2", "oocdlink", "um232h",
  "flossjtag", "jtagkey2p", "opendous_ftdi", "vpaclink",
  "flossjtag-noeeprom", "jtag-lock-pick_tiny_2", "openocd-usb", "xds100v2",
  "flyswatter", "kt-link", "openocd-usb-hs", "xds100v3",
  "flyswatter2", "lisa-l", "openrd",
  "ft232h-module-swd ", "luminary", "pipistrello",
  "gw16042", "luminary-icdi", "redbee-econotag",
];

export const openOCDInterfaces = standardInterfaceFiles.concat(ftdiInterfaceFiles);