import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StandardHeaderProps {
    title: string;
    subtitle?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    rightComponent?: React.ReactNode;
    backgroundColor?: string;
    style?: ViewStyle;
}

export const StandardHeader: React.FC<StandardHeaderProps> = ({
    title,
    subtitle,
    icon,
    rightComponent,
    backgroundColor = '#6366f1',
    style
}) => {
    return (
        <View style={[styles.header, { backgroundColor }, style]}>
            <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                    <View style={styles.titleRow}>
                        {icon && (
                            <Ionicons 
                                name={icon} 
                                size={24} 
                                color="#fff" 
                                style={styles.titleIcon}
                            />
                        )}
                        <Text style={styles.headerTitle}>{title}</Text>
                    </View>
                    {subtitle && (
                        <Text style={styles.headerSubtitle}>{subtitle}</Text>
                    )}
                </View>
                
                {rightComponent && (
                    <View style={styles.headerRight}>
                        {rightComponent}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    titleIcon: {
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginTop: 2,
    },
    headerRight: {
        marginLeft: 16,
    },
});

export default StandardHeader;
