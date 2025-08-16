import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { API_CONFIG } from '../constants/api';

export default function ApiDebugger() {
  useEffect(() => {
    console.log('🔍 API Debug Info:');
    console.log('EXPO_PUBLIC_IP:', process.env.EXPO_PUBLIC_IP);
    console.log('API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
    console.log('Full API_CONFIG:', API_CONFIG);
    
    // 測試 API 調用
    const testApiCall = async () => {
      try {
        console.log('🚀 Testing API call to:', `${API_CONFIG.BASE_URL}/api/categories`);
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/categories`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', response.headers);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ API Response:', data);
        } else {
          console.log('❌ API Error:', response.status, response.statusText);
        }
      } catch (error) {
        console.log('💥 API Call Failed:', error);
        console.log('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    };
    
    testApiCall();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Debug Info</Text>
      <Text style={styles.text}>IP: {process.env.EXPO_PUBLIC_IP}</Text>
      <Text style={styles.text}>Base URL: {API_CONFIG.BASE_URL}</Text>
      <Text style={styles.note}>Check console for detailed logs</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  note: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
});
