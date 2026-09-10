module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json', '.svg'],
        alias: {
          '@': './src',
          '@theme': './src/theme',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@redux': './src/redux',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@constants': './src/constants',
          '@types': './src/types',
          '@gameEngine': './src/gameEngine',
          '@assets': './src/assets',
          '@localization': './src/localization',
          '@config': './src/config',
        },
      },
    ],
    'react-native-reanimated/plugin', // Must be last
  ],
};
