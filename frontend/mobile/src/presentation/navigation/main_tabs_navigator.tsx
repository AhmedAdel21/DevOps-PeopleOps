import React from 'react';
import { StyleSheet } from 'react-native';
import {
    createBottomTabNavigator,
    type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import {
    House,
    ScanLine,
    CalendarDays,
    Users,
    User,
    type LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '@themes/index';
import { hs, ws, fs } from '@/presentation/utils/scaling';
import { HomeScreen } from '@/presentation/screens/home';
import { AttendanceScreen } from '@/presentation/screens/attendance';
import { LeaveScreen } from '@/presentation/screens/leave';
import { TeamScreen } from '@/presentation/screens/team';
import { ProfileScreen } from '@/presentation/screens/profile';
import type { MainTabsParamList } from './types';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const buildIcon = (Icon: LucideIcon) =>
    function TabIcon({ color, size }: { color: string; size: number }) {
        return <Icon color={color} size={size} />;
    };

export const MainTabsNavigator: React.FC = () => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    const screenOptions: BottomTabNavigationOptions = {
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: hs(64),
            paddingTop: hs(8),
        },
        tabBarItemStyle: {
            paddingVertical: hs(4),
        },
        tabBarLabelStyle: {
            fontFamily: theme.typography.fontFamily.semibold,
            fontSize: fs(10),
            letterSpacing: 0.5,
            marginTop: hs(2),
        },
        tabBarIconStyle: {
            width: ws(20),
            height: ws(20),
        },
    };

    return (
        <Tab.Navigator screenOptions={screenOptions}>
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: t('tabs.home').toUpperCase(),
                    tabBarIcon: buildIcon(House),
                }}
            />
            <Tab.Screen
                name="Attendance"
                component={AttendanceScreen}
                options={{
                    tabBarLabel: t('tabs.attendance').toUpperCase(),
                    tabBarIcon: buildIcon(ScanLine),
                }}
            />
            <Tab.Screen
                name="Leave"
                component={LeaveScreen}
                options={{
                    tabBarLabel: t('tabs.vacations').toUpperCase(),
                    tabBarIcon: buildIcon(CalendarDays),
                }}
            />
            <Tab.Screen
                name="Team"
                component={TeamScreen}
                options={{
                    tabBarLabel: t('tabs.team').toUpperCase(),
                    tabBarIcon: buildIcon(Users),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: t('tabs.profile').toUpperCase(),
                    tabBarIcon: buildIcon(User),
                }}
            />
        </Tab.Navigator>
    );
};
