import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import ScanScreen from 'src/screens/ScanScreen';
import ResultScreen from 'src/screens/ResultScreen';
import HistoryScreen from 'src/screens/HistoryScreen';
import EducationScreen from 'src/screens/EducationScreen';
import { colors, fontSizes, radii, spacing } from 'src/constants/theme';

// ─── Route Param Types ───────────────────────────────────────────────────────

export type ScanStackParamList = {
  Scan: undefined;
  Result: undefined;
};

export type RootTabParamList = {
  ScanStack: undefined;
  History: undefined;
  Education: undefined;
};

// ─── Stack inside Scan Tab ───────────────────────────────────────────────────

const ScanStack = createNativeStackNavigator<ScanStackParamList>();

function ScanStackNavigator() {
  return (
    <ScanStack.Navigator screenOptions={{ headerShown: false }}>
      <ScanStack.Screen name="Scan" component={ScanScreen} />
      <ScanStack.Screen name="Result" component={ResultScreen} />
    </ScanStack.Navigator>
  );
}

// ─── Tab config ───────────────────────────────────────────────────────────────

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const TAB_CONFIG: Record<
  keyof RootTabParamList,
  { icon: MaterialIconName; label: string }
> = {
  ScanStack:  { icon: 'photo-camera', label: 'Scan' },
  History:    { icon: 'history',      label: 'History' },
  Education:  { icon: 'menu-book',    label: 'Education' },
};

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || spacing.base }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { icon, label } = TAB_CONFIG[route.name as keyof RootTabParamList];

        function onPress() {
          if (!focused) {
            navigation.navigate(route.name);
          }
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabTouchable}
          >
            <View style={[styles.tabItem, focused && styles.tabItemActive]}>
              <MaterialIcons
                name={icon}
                size={24}
                color={focused ? colors.tabActiveText : colors.tabInactiveText}
              />
              <Text
                style={[
                  styles.tabLabel,
                  focused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Root Tab Navigator ───────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="ScanStack" component={ScanStackNavigator} />
        <Tab.Screen name="History"   component={HistoryScreen} />
        <Tab.Screen name="Education" component={EducationScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.base,
    ...Platform.select({
      ios: {
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  tabTouchable: {
    flex: 1,
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: colors.tabActiveBg,
  },
  tabLabel: {
    fontSize: fontSizes.labelSm,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.tabActiveText,
  },
  tabLabelInactive: {
    color: colors.tabInactiveText,
  },
});
