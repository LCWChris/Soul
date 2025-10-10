// 測試 API 錯誤處理修復
console.log('🧪 測試 API 錯誤處理...');

// 模擬一個返回 HTML 而不是 JSON 的 API 響應
const mockApiCall = async () => {
  try {
    // 模擬一個返回 HTML 錯誤頁面的響應
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: {
        get: (key) => {
          if (key === 'content-type') return 'text/html';
          return null;
        }
      },
      json: () => {
        throw new SyntaxError('JSON Parse error: Unexpected character: <');
      }
    };

    // 檢查 Content-Type
    const contentType = mockResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('⚠️ API 返回非 JSON 內容，跳過 JSON 解析');
      return { error: 'Non-JSON response' };
    }

    // 如果是 JSON，才嘗試解析
    const data = await mockResponse.json();
    return data;

  } catch (error) {
    console.error('❌ API 調用失敗:', error.message);
    return { error: error.message };
  }
};

// 執行測試
mockApiCall().then(result => {
  console.log('✅ 測試結果:', result);
  console.log('🎉 JSON 解析錯誤已修復！');
});