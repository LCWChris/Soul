import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { useCameraPermissions } from 'expo-camera';

const MaterialYouTheme = {
  primary: {
    primary40: '#5b0099',
    primary60: '#8b36d8',
    primary95: '#eab3ff',
  },
  neutral: {
    neutral10: '#1c1b1f',
    neutral40: '#605d62',
    neutral60: '#938f94',
    neutral90: '#e6e1e5',
    neutral100: '#ffffff',
  },
  surface: {
    surface: '#fffbfe',
    surfaceContainer: '#f1ecf4',
  }
};

export default function CameraDiagnostic({ onClose }) {
  const [permission] = useCameraPermissions();
  const [diagnosticData, setDiagnosticData] = useState(null);

  const runDiagnostic = async () => {
    try {
      const deviceInfo = {
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        platform: Device.osName,
        deviceType: Device.deviceType,
      };

      const appInfo = {
        applicationName: await Application.getApplicationNameAsync(),
        nativeApplicationVersion: await Application.getNativeApplicationVersionAsync(),
        applicationId: await Application.getApplicationIdAsync(),
      };

      const permissionInfo = {
        granted: permission?.granted || false,
        canAskAgain: permission?.canAskAgain || false,
        status: permission?.status || 'unknown',
      };

      const data = {
        device: deviceInfo,
        app: appInfo,
        permission: permissionInfo,
        timestamp: new Date().toISOString(),
      };

      setDiagnosticData(data);
      console.log('📊 診斷資料:', data);
    } catch (error) {
      console.error('診斷錯誤:', error);
      Alert.alert('錯誤', '無法執行診斷');
    }
  };

  const copyDiagnosticData = () => {
    if (diagnosticData) {
      const formattedData = JSON.stringify(diagnosticData, null, 2);
      // 在真實應用中，這裡會使用 Clipboard API
      console.log('複製診斷資料:', formattedData);
      Alert.alert('成功', '診斷資料已複製到控制台');
    }
  };

  const getSuggestions = () => {
    if (!diagnosticData) return [];

    const suggestions = [];

    if (!diagnosticData.permission.granted) {
      suggestions.push({
        icon: 'shield-checkmark-outline',
        title: '權限問題',
        description: '相機權限未授權',
        actions: ['前往設定 > 隱私權 > 相機 > 允許此應用使用相機']
      });
    }

    if (diagnosticData.device.osName === 'Android' && diagnosticData.device.osVersion < '6.0') {
      suggestions.push({
        icon: 'phone-portrait-outline',
        title: '系統版本',
        description: '系統版本過舊',
        actions: ['建議升級到 Android 6.0 或更高版本']
      });
    }

    if (diagnosticData.device.osName === 'iOS' && parseFloat(diagnosticData.device.osVersion) < 12.0) {
      suggestions.push({
        icon: 'phone-portrait-outline',
        title: '系統版本',
        description: '系統版本過舊',
        actions: ['建議升級到 iOS 12.0 或更高版本']
      });
    }

    // 通用建議
    suggestions.push({
      icon: 'refresh-outline',
      title: '重新啟動',
      description: '重新啟動應用程式',
      actions: ['完全關閉應用', '重新開啟應用', '重新授權權限']
    });

    suggestions.push({
      icon: 'settings-outline',
      title: '系統設定',
      description: '檢查系統設定',
      actions: [
        '確認相機硬體正常',
        '檢查其他相機應用是否正常',
        '重新啟動設備'
      ]
    });

    return suggestions;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>相機診斷</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={MaterialYouTheme.neutral.neutral60} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.diagnosticButton}
            onPress={runDiagnostic}
            activeOpacity={0.8}
          >
            <Ionicons name="play-outline" size={24} color={MaterialYouTheme.neutral.neutral100} />
            <Text style={styles.diagnosticButtonText}>開始診斷</Text>
          </TouchableOpacity>
        </View>

        {diagnosticData && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>設備資訊</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>設備: {diagnosticData.device.brand} {diagnosticData.device.modelName}</Text>
                <Text style={styles.infoText}>系統: {diagnosticData.device.osName} {diagnosticData.device.osVersion}</Text>
                <Text style={styles.infoText}>類型: {diagnosticData.device.deviceType}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>權限狀態</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>已授權: {diagnosticData.permission.granted ? '是' : '否'}</Text>
                <Text style={styles.infoText}>可重新請求: {diagnosticData.permission.canAskAgain ? '是' : '否'}</Text>
                <Text style={styles.infoText}>狀態: {diagnosticData.permission.status}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>建議解決方案</Text>
              {getSuggestions().map((suggestion, index) => (
                <View key={index} style={styles.suggestionCard}>
                  <View style={styles.suggestionHeader}>
                    <Ionicons name={suggestion.icon} size={20} color={MaterialYouTheme.primary.primary60} />
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  </View>
                  <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                  {suggestion.actions.map((action, actionIndex) => (
                    <Text key={actionIndex} style={styles.suggestionAction}>• {action}</Text>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={copyDiagnosticData}
                activeOpacity={0.8}
              >
                <Ionicons name="copy-outline" size={20} color={MaterialYouTheme.primary.primary60} />
                <Text style={styles.copyButtonText}>複製診斷資料</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MaterialYouTheme.surface.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: MaterialYouTheme.neutral.neutral90,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: MaterialYouTheme.neutral.neutral10,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MaterialYouTheme.neutral.neutral10,
    marginBottom: 12,
  },
  diagnosticButton: {
    flexDirection: 'row',
    backgroundColor: MaterialYouTheme.primary.primary40,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  diagnosticButtonText: {
    color: MaterialYouTheme.neutral.neutral100,
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: MaterialYouTheme.surface.surfaceContainer,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: MaterialYouTheme.neutral.neutral40,
  },
  suggestionCard: {
    backgroundColor: MaterialYouTheme.surface.surfaceContainer,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MaterialYouTheme.neutral.neutral10,
  },
  suggestionDescription: {
    fontSize: 14,
    color: MaterialYouTheme.neutral.neutral40,
    marginBottom: 8,
  },
  suggestionAction: {
    fontSize: 12,
    color: MaterialYouTheme.neutral.neutral60,
    marginLeft: 8,
    marginTop: 2,
  },
  copyButton: {
    flexDirection: 'row',
    backgroundColor: MaterialYouTheme.primary.primary95,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copyButtonText: {
    color: MaterialYouTheme.primary.primary60,
    fontSize: 14,
    fontWeight: '500',
  },
});