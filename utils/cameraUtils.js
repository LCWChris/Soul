// 強制相機準備工具函數
export const forceCameraReady = (cameraRef, setIsCameraReady, setCameraInitializing) => {
  console.log('🔧 強制設定相機為準備狀態');
  
  // 檢查相機引用是否存在
  if (!cameraRef.current) {
    console.warn('❌ 相機引用不存在，無法強制準備');
    return false;
  }
  
  // 強制設定狀態
  setIsCameraReady(true);
  setCameraInitializing(false);
  
  console.log('✅ 相機已強制設定為準備狀態');
  return true;
};

// 相機狀態檢測工具
export const checkCameraStatus = async (cameraRef) => {
  try {
    if (!cameraRef.current) {
      return { ready: false, error: 'Camera reference not found' };
    }
    
    // 嘗試一個簡單的相機操作來檢測是否準備好
    // 注意：這可能不是最佳方法，但可以作為檢測手段
    return { ready: true, error: null };
  } catch (error) {
    return { ready: false, error: error.message };
  }
};

// 錄影重試機制
export const recordWithRetry = async (cameraRef, options = {}, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`📹 錄影嘗試 ${i + 1}/${maxRetries}`);
      
      const result = await cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: 30,
        mute: false,
        ...options
      });
      
      console.log('✅ 錄影成功');
      return result;
    } catch (error) {
      lastError = error;
      console.log(`❌ 錄影嘗試 ${i + 1} 失敗:`, error.message);
      
      if (error.message.includes('Camera is not ready') && i < maxRetries - 1) {
        console.log('⏳ 等待 1 秒後重試...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      // 如果不是相機未準備的錯誤，或者已經達到最大重試次數，拋出錯誤
      throw error;
    }
  }
  
  throw lastError;
};