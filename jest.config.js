module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-async-storage|react-native-paper|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|react-native-vector-icons|react-native-reanimated)/)',
  ],
};
