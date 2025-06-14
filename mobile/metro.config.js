const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enable CSS support for Tamagui
  isCSSEnabled: true,
});

// Add support for mjs files
config.resolver.sourceExts.push('mjs');

module.exports = config;
