const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// 明確指定支援的檔案副檔名，避免打包混亂
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'mjs', 'cjs'];

module.exports = withNativeWind(config, { input: "./app/globals.css" });
