import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
export default function TranslateScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);
  const [capturedUri, setCapturedUri] = useState(null);
console.log("Camera type:", typeof Camera, Camera);
  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(
        cameraStatus.status === 'granted' && mediaStatus.status === 'granted'
      );
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.5, base64: false };
      const photo = await cameraRef.current.takePictureAsync(options);
      setCapturedUri(photo.uri);
      await MediaLibrary.saveToLibraryAsync(photo.uri);
      Alert.alert('成功', '照片已儲存至相簿');
    }
  };

  if (hasPermission === null) {
    return <View style={styles.center}><Text>請求權限中…</Text></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.center}><Text>沒有相機或儲存權限</Text></View>;
  }

  // Camera.Constants 可能 undefined，需判斷
  const cameraType = Camera?.Constants?.Type?.back ?? undefined;

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        style={styles.camera}
        type={cameraType}
        ref={cameraRef}
      />
      <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
        <Text style={styles.captureText}>📸 拍照</Text>
      </TouchableOpacity>
      {capturedUri && (
        <View style={styles.preview}>
          <Text style={{ marginBottom: 10 }}>已拍攝照片：</Text>
          <Image source={{ uri: capturedUri }} style={styles.image} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  camera: { flex: 1 },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 50,
  },
  captureText: {
    color: '#fff', fontSize: 18,
  },
  preview: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  image: {
    width: 300,
    height: 400,
    borderRadius: 12,
  },
});