import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

export function useNotifications() {
    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log("📱 Expo Push Token:", token);
        //savePushTokenToSupabase(token);
      }
    });
  }, []);

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Device.isDevice) {
    Alert.alert('Error', 'Must use physical device for Push Notifications');
    return;
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Error', 'Permission not granted for notifications');
    return;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync();
  return token;

  }

}

async function savePushTokenToSupabase(token: string) {
  console.log('💾 Starting to save push token to Supabase...');
  console.log('Token to save:', token);
  try{
    const user = supabase.auth.getUser();

    const { data: userData, error: userError } = await user;
    if (userError || !userData?.user?.id) {
      console.error("Failed to get user session", userError);
      return;
    }
    console.log('✅ User authenticated, ID:', userData.user.id);

    const { data: profile, error: profileError } = await supabase
      .from('Profiles')
      .select('id, push_token')
      .eq('id', userData.user.id)
      .single();

    if (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        return;
    }

    console.log('📋 Current profile data:', profile);

    const { data, error } = await supabase
      .from('Profiles')
      .update({ push_token: token })
      .eq('id', userData.user.id)
      .select()

    if (error) {
      console.error('❌ Error saving token:', error.message);
    } else {
      console.log('✅ Expo push token saved to Supabase!');
    }
  } catch (error) {
    console.error('❌ Unexpected error in savePushTokenToSupabase:', error);
  }
}
