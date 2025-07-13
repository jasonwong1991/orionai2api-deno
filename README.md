# LLM Proxy API - Deno 版本

这是原 Python 版本的 Deno/TypeScript 重写版本，提供完全兼容的 OpenAI API 接口。

## 🚀 快速开始

### 1. 安装 Deno
```bash
# macOS (推荐)
brew install deno

# 或使用官方脚本
curl -fsSL https://deno.land/x/install/install.sh | sh
```

### 2. 配置环境
```bash
# 复制并编辑配置文件
cp .env.example .env
# 编辑 .env 文件，设置您的 API Keys 和 Tokens
```

### 3. 启动应用
```bash
# 使用启动脚本（推荐）
./start.sh

# 或直接运行
deno task dev
```

### 4. 使用 Docker（可选）
```bash
# 如果不想安装 Deno
docker-compose up
```

## 📖 详细文档

- [安装指南](./docs/INSTALL.md) - 详细的安装和配置说明
- [项目结构](./docs/PROJECT_STRUCTURE.md) - 代码结构说明

## ✨ 主要特性

- 🔄 **完全兼容 OpenAI API** - 支持 `/v1/models` 和 `/v1/chat/completions`
- 🎯 **智能 Token 管理** - 自动轮换和故障转移
- 🔐 **多重身份验证** - 支持多种 API Key 格式
- 📡 **流式响应** - 支持 Server-Sent Events
- 🐳 **容器化部署** - 提供 Docker 支持
- 📊 **详细日志** - 完整的请求/响应日志
- ⚡ **高性能** - 基于 Deno 运行时优化

## 🔧 配置说明

关键环境变量：
```env
# API Keys (JSON 数组格式)
API_KEYS=["key1", "key2", "key3"]

# Token 池 (JSON 数组格式)  
TOKEN_POOL=["token1", "token2", "token3"]

# 服务配置
PORT=3333
TARGET_API_URL=https://api.orionai.asia/chat
```

## 🌐 API 端点

- `GET /health` - 健康检查
- `GET /docs` - API 文档
- `GET /v1/models` - 获取可用模型列表
- `POST /v1/chat/completions` - 聊天完成接口

## 🛠️ 开发命令

```bash
deno task dev     # 开发模式（热重载）
deno task start   # 生产模式
deno task test    # 运行测试
deno task fmt     # 格式化代码
deno task lint    # 代码检查
```

## 📝 使用示例

```typescript
// 获取模型列表
const models = await fetch('http://localhost:3333/v1/models', {
  headers: { 'Authorization': 'Bearer your-api-key' }
});

// 聊天完成
const response = await fetch('http://localhost:3333/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'ChatGPT 4.1 Mini-Default',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});
```

## 🔍 故障排除

1. **Deno 未安装**: 参考 [安装指南](./docs/INSTALL.md)
2. **权限错误**: `chmod +x start.sh`
3. **端口占用**: 修改 `.env` 中的 `PORT` 配置
4. **环境变量格式**: 确保 JSON 数组格式正确

## 📄 许可证

与原项目保持一致的许可证。
