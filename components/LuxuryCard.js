import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LuxuryTheme } from '../styles/luxuryTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

/**
 * Premium Card Component
 * Supports multiple luxury variants including glass morphism
 */
export const LuxuryCard = ({
  children,
  variant = 'elevated', // elevated, flat, glass, gradient
  onPress,
  disabled = false,
  style,
  darkMode = false,
  gradientColors = null,
  blurIntensity = 20,
  ...props
}) => {
  const { colors, spacing, borderRadius, shadows } = LuxuryTheme;

  const handlePress = () => {
    if (!disabled && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getVariantStyles = () => {
    const theme = darkMode ? 'dark' : 'light';
    
    const variants = {
      elevated: {
        backgroundColor: colors.background[theme].primary,
        borderWidth: 1,
        borderColor: darkMode ? colors.neutral[700] : colors.neutral[200],
        ...shadows.lg
      },
      flat: {
        backgroundColor: colors.background[theme].secondary,
        borderWidth: 1,
        borderColor: darkMode ? colors.neutral[600] : colors.neutral[200],
        ...shadows.none
      },
      glass: {
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.25)' : 'rgba(255, 255, 255, 0.25)',
        borderWidth: 1,
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.18)',
        ...shadows.glass
      },
      gradient: {
        borderWidth: 1,
        borderColor: darkMode ? colors.neutral[700] : colors.neutral[200],
        ...shadows.md
      }
    };

    return variants[variant] || variants.elevated;
  };

  const baseStyles = [
    styles.card,
    getVariantStyles(),
    style
  ];

  const CardContent = ({ children }) => (
    <View style={styles.content}>
      {children}
    </View>
  );

  // Glass morphism variant
  if (variant === 'glass') {
    return (
      <BlurView
        intensity={blurIntensity}
        tint={darkMode ? 'dark' : 'light'}
        style={baseStyles}
        {...props}
      >
        {onPress ? (
          <Pressable
            onPress={handlePress}
            disabled={disabled}
            style={({ pressed }) => [
              styles.pressable,
              pressed && !disabled && styles.pressed
            ]}
            accessibilityRole={onPress ? "button" : undefined}
          >
            <CardContent>{children}</CardContent>
          </Pressable>
        ) : (
          <CardContent>{children}</CardContent>
        )}
      </BlurView>
    );
  }

  // Gradient variant
  if (variant === 'gradient' && gradientColors) {
    return (
      <LinearGradient
        colors={gradientColors}
        style={baseStyles}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        {...props}
      >
        {onPress ? (
          <Pressable
            onPress={handlePress}
            disabled={disabled}
            style={({ pressed }) => [
              styles.pressable,
              pressed && !disabled && styles.pressed
            ]}
            accessibilityRole={onPress ? "button" : undefined}
          >
            <CardContent>{children}</CardContent>
          </Pressable>
        ) : (
          <CardContent>{children}</CardContent>
        )}
      </LinearGradient>
    );
  }

  // Standard variants (elevated, flat)
  return (
    <View style={baseStyles} {...props}>
      {onPress ? (
        <Pressable
          onPress={handlePress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.pressable,
            pressed && !disabled && styles.pressed
          ]}
          accessibilityRole={onPress ? "button" : undefined}
        >
          <CardContent>{children}</CardContent>
        </Pressable>
      ) : (
        <CardContent>{children}</CardContent>
      )}
    </View>
  );
};

// Specialized card variants
export const LuxuryFeatureCard = ({ 
  title, 
  description, 
  icon, 
  premium = false,
  darkMode = false,
  ...props 
}) => {
  const { colors, typography, spacing } = LuxuryTheme;
  const theme = darkMode ? 'dark' : 'light';

  return (
    <LuxuryCard
      variant={premium ? 'gradient' : 'elevated'}
      gradientColors={premium ? [colors.accent[500], colors.accent[600]] : null}
      darkMode={darkMode}
      {...props}
    >
      <View style={styles.featureHeader}>
        {icon && (
          <View style={[
            styles.iconContainer,
            { backgroundColor: premium ? 'rgba(255,255,255,0.2)' : colors.accent[100] }
          ]}>
            <Text style={[
              styles.icon,
              { color: premium ? colors.neutral[50] : colors.accent[600] }
            ]}>
              {icon}
            </Text>
          </View>
        )}
        {premium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}
      </View>
      
      <Text style={[
        styles.featureTitle,
        typography.textStyles.title.medium,
        { color: premium ? colors.neutral[50] : colors.neutral[900] }
      ]}>
        {title}
      </Text>
      
      <Text style={[
        styles.featureDescription,
        typography.textStyles.body.small,
        { color: premium ? colors.neutral[200] : colors.neutral[600] }
      ]}>
        {description}
      </Text>
    </LuxuryCard>
  );
};

export const LuxuryStatsCard = ({ 
  title, 
  value, 
  change,
  trend = 'neutral', // positive, negative, neutral
  darkMode = false,
  ...props 
}) => {
  const { colors, typography, spacing } = LuxuryTheme;

  const getTrendColor = () => {
    switch (trend) {
      case 'positive': return colors.success[500];
      case 'negative': return colors.error[500];
      default: return colors.neutral[500];
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'positive': return '↗';
      case 'negative': return '↘';
      default: return '→';
    }
  };

  return (
    <LuxuryCard variant="elevated" darkMode={darkMode} {...props}>
      <Text style={[
        styles.statsTitle,
        typography.textStyles.caption.medium,
        { color: darkMode ? colors.neutral[400] : colors.neutral[600] }
      ]}>
        {title}
      </Text>
      
      <Text style={[
        styles.statsValue,
        typography.textStyles.headline.medium,
        { color: darkMode ? colors.neutral[50] : colors.neutral[900] }
      ]}>
        {value}
      </Text>
      
      {change && (
        <View style={styles.statsChange}>
          <Text style={[
            styles.changeIcon,
            { color: getTrendColor() }
          ]}>
            {getTrendIcon()}
          </Text>
          <Text style={[
            styles.changeText,
            typography.textStyles.caption.small,
            { color: getTrendColor() }
          ]}>
            {change}
          </Text>
        </View>
      )}
    </LuxuryCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: LuxuryTheme.borderRadius.xl,
    overflow: 'hidden'
  },
  content: {
    padding: LuxuryTheme.spacing[4]
  },
  pressable: {
    flex: 1
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }]
  },
  
  // Feature Card Styles
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: LuxuryTheme.spacing[3]
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: LuxuryTheme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    fontSize: 24
  },
  premiumBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: LuxuryTheme.spacing[2],
    paddingVertical: LuxuryTheme.spacing[1],
    borderRadius: LuxuryTheme.borderRadius.base,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  premiumText: {
    fontSize: 10,
    fontWeight: LuxuryTheme.typography.fontWeight.bold,
    color: LuxuryTheme.colors.neutral[50],
    letterSpacing: 0.5
  },
  featureTitle: {
    marginBottom: LuxuryTheme.spacing[2]
  },
  featureDescription: {
    lineHeight: 20
  },
  
  // Stats Card Styles
  statsTitle: {
    marginBottom: LuxuryTheme.spacing[1]
  },
  statsValue: {
    marginBottom: LuxuryTheme.spacing[2]
  },
  statsChange: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  changeIcon: {
    fontSize: 14,
    marginRight: LuxuryTheme.spacing[1]
  },
  changeText: {
    fontWeight: LuxuryTheme.typography.fontWeight.medium
  }
});

export default LuxuryCard;