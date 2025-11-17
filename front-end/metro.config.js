const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 忽略不應該作為路由的文件
config.resolver.blockList = [
  // API 和 UI 組件目錄（不是路由）
  /\/api\//,
  /\/ui\//,
  // 配置文件
  /\.config\.[jt]s$/,
  // 文檔文件
  /\.md$/,
  /\.txt$/,
  // expo-router 內部文件
  /\.expo-router$/,
  /\.expo-router-ignore$/,
];

module.exports = config;
