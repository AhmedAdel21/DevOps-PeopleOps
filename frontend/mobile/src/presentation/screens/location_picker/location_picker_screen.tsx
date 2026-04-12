import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { ws, hs } from '@/presentation/utils/scaling';
import { AppText, AppBottomSheet } from '@/presentation/components/atoms';

export interface Location {
  id: string;
  name: string;
  address: string;
}

export interface LocationPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  locations?: Location[];
  onSelect?: (locationId: string) => void;
}

const DEFAULT_LOCATIONS: Location[] = [
  { id: '1', name: 'Head Office', address: '123 Business Bay, Dubai' },
  { id: '2', name: 'Tech Hub', address: '456 Silicon Oasis, Dubai' },
  { id: '3', name: 'Downtown Branch', address: '789 DIFC, Dubai' },
];

export const LocationPickerSheet: React.FC<LocationPickerSheetProps> = ({
  visible,
  onClose,
  userName = 'Ahmed',
  locations = DEFAULT_LOCATIONS,
  onSelect,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const greeting = getGreeting(t);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelect?.(id);
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} heightFraction={0.65}>
      <View style={styles.content}>
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <AppText variant="title" color={theme.colors.foreground}>
            {greeting} {userName}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedForeground}>
            {today}
          </AppText>
        </View>

        {/* Section label */}
        <AppText
          variant="label"
          color={theme.colors.mutedForeground}
          style={styles.sectionLabel}
        >
          {t('auth.locationPicker.selectLocation')}
        </AppText>

        {/* Location cards */}
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {locations.map((loc) => {
            const selected = selectedId === loc.id;
            return (
              <Pressable
                key={loc.id}
                onPress={() => handleSelect(loc.id)}
                style={[
                  styles.card,
                  selected && styles.cardSelected,
                ]}
              >
                {/* Icon */}
                <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
                  <MapPin
                    size={ws(20)}
                    color={selected ? theme.colors.primary : theme.colors.mutedForeground}
                  />
                </View>

                {/* Name + address */}
                <View style={styles.cardText}>
                  <AppText variant="label" color={theme.colors.foreground}>
                    {loc.name}
                  </AppText>
                  <AppText variant="small" color={theme.colors.mutedForeground}>
                    {loc.address}
                  </AppText>
                </View>

                {/* Radio */}
                <View
                  style={[
                    styles.radio,
                    selected && styles.radioSelected,
                  ]}
                >
                  {selected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </AppBottomSheet>
  );
};

// --- Helpers ---

const getGreeting = (t: (key: string) => string): string => {                                                      
  const hour = new Date().getHours();
  if (hour < 12) return t('auth.locationPicker.greetingMorning');                                                  
  if (hour < 18) return t('auth.locationPicker.greetingAfternoon');
  return t('auth.locationPicker.greetingEvening');                                                                 
};
                                                                                                                   
// --- Styles ---

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    content: {                                                                                                     
      flex: 1,
      paddingHorizontal: ws(24),                                                                                   
    },          
    greetingSection: {
      gap: hs(4),
      marginBottom: hs(4),
    },                                                                                                             
    sectionLabel: {
      marginTop: hs(16),                                                                                           
      marginBottom: hs(12),
    },
    listContent: {
      gap: hs(12),
      paddingBottom: hs(24),
    },                                                                                                             
 
    // Card                                                                                                        
    card: {     
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: theme.radius.l,
      borderWidth: 1,                                                                                              
      borderColor: theme.colors.border,
      padding: ws(16),                                                                                             
      gap: ws(14),
    },
    cardSelected: {
      borderColor: theme.colors.primary,
    },                                                                                                             
    cardText: {
      flex: 1,                                                                                                     
      gap: hs(2),
    },

    // Icon box
    iconBox: {
      width: ws(40),
      height: ws(40),
      borderRadius: ws(10),                                                                                        
      backgroundColor: theme.colors.muted,
      alignItems: 'center',                                                                                        
      justifyContent: 'center',
    },
    iconBoxSelected: {
      backgroundColor: theme.colors.primaryLight,
    },                                                                                                             
 
    // Radio                                                                                                       
    radio: {    
      width: ws(22),
      height: ws(22),
      borderRadius: ws(11),
      borderWidth: 2,
      borderColor: theme.colors.borderStrong,
      alignItems: 'center',                                                                                        
      justifyContent: 'center',
    },                                                                                                             
    radioSelected: {
      borderColor: theme.colors.primary,
    },
    radioDot: {
      width: ws(10),
      height: ws(10),                                                                                              
      borderRadius: ws(5),
      backgroundColor: theme.colors.primary,                                                                       
    },          
  });