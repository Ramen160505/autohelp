import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import MapScreen from '../screens/MapScreen';
import CreateRequestScreen from '../screens/CreateRequestScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#334155',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tab.Screen 
        name="MapTab" 
        component={MapScreen} 
        options={{
          tabBarLabel: 'Карта',
          tabBarIcon: ({ color, focused }) => <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>📍</Text>,
        }}
      />
      <Tab.Screen 
        name="CreateTab" 
        component={CreateRequestScreen} 
        options={{
          tabBarLabel: 'Допомога',
          tabBarIcon: ({ color, focused }) => <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>🆘</Text>,
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Профіль',
          tabBarIcon: ({ color, focused }) => <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
