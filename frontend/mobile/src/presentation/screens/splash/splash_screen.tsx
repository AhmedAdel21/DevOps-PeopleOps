import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';                                                
import { useTranslation } from 'react-i18next';                                                                    
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';                                                             
import { AppText } from '@/presentation/components/atoms';                                                         
import { AppName } from '@/presentation/components/molecules';                                                     
                                                                                                                   
export interface SplashScreenProps {                                                                               
  /** Called when the splash is done (e.g. after branding delay or session restore). */                            
  onReady?: () => void;                                                                                            
}                                                                                                                  
                                                                                                                   
export const SplashScreen: React.FC<SplashScreenProps> = ({ onReady }) => {                                        
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
                                                                                                                   
  useEffect(() => {
    const timer = setTimeout(() => {                                                                               
      onReady?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onReady]);

  return (                                                                                                         
    <View style={styles.container}>
      {/* Top spacer to push content toward center */}                                                             
      <View style={styles.spacer} />                                                                               

      {/* Brand block — logo + name + tagline */}                                                                  
      <AppName />
                                                                                                                   
      {/* Spinner */}
      <ActivityIndicator
        size="small"
        color={theme.colors.primary}
        style={styles.spinner}                                                                                     
      />
                                                                                                                   
      {/* Bottom-aligned version */}
      <View style={styles.spacer} />
      <AppText
        variant="small"                                                                                            
        color={theme.colors.mutedForeground}
        align="center"                                                                                             
        style={styles.version}
      >
        {t('auth.splash.version')}
      </AppText>                                                                                                   
    </View>
  );                                                                                                               
};              

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',                                                                                        
      paddingHorizontal: ws(24),
      paddingVertical: hs(20),                                                                                     
    },                                                                                                             
    spacer: {
      flex: 1,                                                                                                     
    },          
    spinner: {
      marginTop: hs(32),
    },
    version: {
      marginBottom: hs(12),
    },                                                                                                             
  });