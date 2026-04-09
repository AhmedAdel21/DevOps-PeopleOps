import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, type AppTheme } from "@themes/index";

export const SplashScreen: React.FC = () => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <View style={styles.container}>
            <Text style={styles.text}>SplashScreen</Text>
        </View>
    );
};

const createStyles = (theme: AppTheme) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
        },
        text: {
            fontSize: theme.typography.sizes.display,
            fontWeight: theme.typography.weights.bold,
            color: theme.colors.primary,
        },
    });
};