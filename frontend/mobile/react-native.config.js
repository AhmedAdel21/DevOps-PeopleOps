  /**                                                                                        
   * React Native CLI config. Used by `npx react-native-asset` to                          
   * automatically register fonts into:                                                      
   *   - iOS:     ios/mobile/Info.plist (UIAppFonts array)                                   
   *   - Android: android/app/src/main/assets/fonts/                                         
   *                                                                                         
   * Re-run `npx react-native-asset` whenever a new font file is added.                      
   */                                                                                        
  module.exports = {
    project: {                                                                               
      ios: {},                                                                               
      android: {},
    },                                                                                       
    assets: ['./src/assets/fonts/'],                                                       
  };   