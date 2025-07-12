# Deno 版本安装和运行指南

## 1. 安装 Deno

### macOS (推荐使用 Homebrew)
```bash
# 使用 Homebrew 安装
brew install deno

# 或者使用官方安装脚本
curl -fsSL https://deno.land/x/install/install.sh | sh
```

### 其他系统
```bash
# Linux/macOS 官方安装脚本
curl -fsSL https://deno.land/x/install/install.sh | sh

# Windows (PowerShell)
iwr https://deno.land/x/install/install.ps1 -useb | iex
```

## 2. 验证安装
```bash
deno --version
```

## 3. 配置环境变量
请根据您的实际需求修改 `.env` 文件中的配置：

```env
# 必须配置的项目
API_KEYS=["your-actual-api-key-1", "your-actual-api-key-2"]
TOKEN_POOL=["your-actual-token-1", "your-actual-token-2"]

# 可选配置
PORT=3333
TARGET_API_URL=https://api.orionai.asia/chat
```

## 4. 运行应用

### 开发模式（推荐）
```bash
# 进入 deno 目录
cd deno

# 使用启动脚本（自动检查环境）
./start.sh

# 或直接运行
deno task dev
```

### 生产模式
```bash
deno task start
```

### 其他命令
```bash
# 格式化代码
deno task fmt

# 代码检查
deno task lint

# 运行测试
deno task test
```

## 5. 使用 Docker（无需安装 Deno）

如果不想安装 Deno，可以直接使用 Docker：

```bash
# 构建镜像
docker build -t llm-proxy-deno .

# 运行容器
docker run -p 3333:3333 --env-file .env llm-proxy-deno

# 或使用 docker-compose
docker-compose up
```

## 6. API 测试

应用启动后，可以访问：
- 健康检查: http://localhost:3333/health
- API 文档: http://localhost:3333/docs
- 模型列表: http://localhost:3333/v1/models

## 7. 故障排除

### 常见问题
1. **权限错误**: 确保 start.sh 有执行权限
   ```bash
   chmod +x start.sh
   ```

2. **端口占用**: 修改 .env 中的 PORT 配置

3. **环境变量错误**: 检查 .env 文件格式，确保 JSON 数组格式正确

### 日志查看
应用会输出详细的日志信息，包括：
- 启动信息
- 请求日志
- 错误信息
- Token 使用情况

## 8. 性能优化

### 生产环境建议
- 设置 `DEBUG=false`
- 配置多个 Token 实现负载均衡
- 使用反向代理（如 Nginx）
- 监控内存和 CPU 使用情况