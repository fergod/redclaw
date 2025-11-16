// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchXiaohongshuData") {
    fetchXiaohongshuData(request.url)
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      
    // 返回true表示异步响应
    return true;
  }
});

// 获取小红书页面数据
async function fetchXiaohongshuData(url) {
  try {
    // 添加请求头模拟浏览器访问
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      }
    });
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // 检查返回的内容是否为HTML
    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
      throw new Error('返回的内容不是有效的HTML页面');
    }
    
    // 提取所需信息
    const data = {};
    
    // 提取链接
    data.url = url;
    
    // 提取博主名字 (使用正则表达式)
    const authorMatch = html.match(/<span[^>]*class="[^"]*username[^"]*"[^>]*>([^<]+)<\/span>/);
    data.author = authorMatch ? authorMatch[1].trim() : '未找到';
    
    // 提取标题 (使用正则表达式)
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      // 去掉"- 小红书"后缀
      data.title = titleMatch[1].replace(/\s*-\s*小红书\s*$/, '').trim();
    } else {
      data.title = '未找到';
    }
    
    // 提取评论数
    const commentsMatch = html.match(/<meta[^>]*name="og:xhs:note_comment"[^>]*content="([^"]+)"[^>]*>/);
    data.comments = commentsMatch ? commentsMatch[1] : '未找到';
    
    // 提取点赞数
    const likesMatch = html.match(/<meta[^>]*name="og:xhs:note_like"[^>]*content="([^"]+)"[^>]*>/);
    data.likes = likesMatch ? likesMatch[1] : '未找到';
    
    // 提取收藏数
    const collectsMatch = html.match(/<meta[^>]*name="og:xhs:note_collect"[^>]*content="([^"]+)"[^>]*>/);
    data.collects = collectsMatch ? collectsMatch[1] : '未找到';
    
    return data;
  } catch (error) {
    throw new Error(`获取数据失败: ${error.message}`);
  }
}