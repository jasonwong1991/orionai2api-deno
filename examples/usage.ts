/**
 * 使用示例
 */

// 1. 使用原生fetch API
async function testWithFetch() {
  const response = await fetch('http://localhost:3333/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-api-key',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'Claude 4-Default',
      messages: [
        { role: 'user', content: 'Hello! How are you today?' }
      ],
      stream: false
    })
  });

  const data = await response.json();
  console.log('Response:', data);
}

// 2. 流式响应示例
async function testStreamingResponse() {
  const response = await fetch('http://localhost:3333/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-api-key',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'Claude 4-Default',
      messages: [
        { role: 'user', content: 'Tell me a short story' }
      ],
      stream: true
    })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('Stream finished');
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              Deno.stdout.write(new TextEncoder().encode(content));
            }
          } catch (e) {
            // Ignore parsing errors
            console.error('Error parsing JSON:', e);
          }
        }
      }
    }
  }
}

// 3. 获取模型列表
async function listModels() {
  const response = await fetch('http://localhost:3333/v1/models', {
    headers: {
      'Authorization': 'Bearer your-api-key',
    }
  });

  const data = await response.json();
  console.log('Available models:', data.data.map(m => m.id));
}

// 4. 健康检查
async function healthCheck() {
  const response = await fetch('http://localhost:3333/health');
  const data = await response.json();
  console.log('Health status:', data);
}

// 运行示例
if (import.meta.main) {
  console.log('Testing LLM Proxy API...');
  
  try {
    await healthCheck();
    await listModels();
    await testWithFetch();
    await testStreamingResponse(); // 取消注释以测试流式响应
  } catch (error) {
    console.error('Error:', error);
  }
}
