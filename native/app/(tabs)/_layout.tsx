import { useClerk, useUser } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';

const HeaderUserMenu = () => {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  if (!isSignedIn) return null;
  const avatarUrl = user?.imageUrl;

  const handlePress = () => {
    Alert.alert('Account', 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  return (
    <Pressable onPress={handlePress} style={styles.avatarWrap}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : null}
    </Pressable>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: () => (
          <MaterialCommunityIcons
            name="bird"
            size={28}
            color="#FF385C"
            accessibilityLabel="AI News Listening"
          />
        ),
        headerTitleAlign: 'left',
        headerTitleStyle: {
          fontFamily: 'Avenir Next',
          fontWeight: '600',
          fontSize: 18,
          color: '#111827',
        },
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerRight: () => <HeaderUserMenu />,
        headerRightContainerStyle: {
          paddingRight: 16,
        },
        tabBarActiveTintColor: '#FF385C',
        tabBarInactiveTintColor: '#8A8A8A',
        tabBarStyle: {
          borderTopColor: '#F3F4F6',
          height: 75,
          paddingBottom: 20,
          paddingTop: 6,
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: {
          fontFamily: 'Avenir Next',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="setting"
        options={{
          title: 'Setting',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
