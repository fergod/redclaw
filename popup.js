// 全局变量存储分析结果
let analysisResults = [];

document.addEventListener('DOMContentLoaded', function() {
  const analyzeButton = document.getElementById('analyze');
  const exportButton = document.getElementById('export');
  const urlsTextarea = document.getElementById('urls');
  const loadingDiv = document.getElementById('loading');
  const resultDiv = document.getElementById('result');
  const countSpan = document.getElementById('count');

  // 开始分析按钮点击事件
  analyzeButton.addEventListener('click', async function() {
    const urls = urlsTextarea.value.trim().split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
      
    if (urls.length === 0) {
      alert('请输入至少一个小红书链接');
      return;
    }
    
    // 显示加载状态
    loadingDiv.style.display = 'block';
    analyzeButton.disabled = true;
    exportButton.disabled = true;
    
    try {
      analysisResults = [];
      
      // 逐个处理每个URL
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        // 更新进度提示
        loadingDiv.innerHTML = `
          <div class="spinner"></div>
          <p>正在分析第 ${i+1}/${urls.length} 个链接...</p>
          <p style="font-size: 12px; color: #666;">${url}</p>
        `;
        
        try {
          const data = await fetchXiaohongshuData(url);
          analysisResults.push(data);
        } catch (error) {
          console.error(`处理URL失败: ${url}`, error);
          analysisResults.push({
            url: url,
            author: '获取失败',
            title: '获取失败',
            comments: '获取失败',
            likes: '获取失败',
            collects: '获取失败'
          });
        }
      }
      
      // 显示结果
      countSpan.textContent = analysisResults.length;
      resultDiv.style.display = 'block';
      exportButton.disabled = false;
    } catch (error) {
      console.error('分析过程中出现错误:', error);
      alert('分析过程中出现错误，请查看控制台了解详情');
    } finally {
      // 隐藏加载状态
      loadingDiv.style.display = 'none';
      analyzeButton.disabled = false;
    }
  });

  // 导出Excel按钮点击事件
  exportButton.addEventListener('click', function() {
    if (analysisResults.length === 0) {
      alert('没有数据可导出');
      return;
    }
    
    exportToExcel(analysisResults);
  });
});

// 获取小红书页面数据
async function fetchXiaohongshuData(url) {
  // 这里我们使用后台脚本来获取页面内容，因为直接从popup访问其他站点会有跨域限制
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "fetchXiaohongshuData", url: url }, 
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || "未知错误"));
        }
      }
    );
  });
}

// 导出数据到Excel
function exportToExcel(data) {
  // 使用SheetJS库导出Excel
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "小红书数据");
  
  // 生成文件名
  const filename = `小红书数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
  
  // 导出文件
  XLSX.writeFile(wb, filename);
}