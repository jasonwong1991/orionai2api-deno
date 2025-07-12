# Deno版本LLM代理API项目结构

```
deno/
├── main.ts                     # 应用入口点
├── deno.json                   # Deno配置文件
├── .env.example                # 环境变量示例
├── README.md                   # 项目说明文档
├── Dockerfile                  # Docker镜像构建文件
├── docker-compose.yml          # Docker Compose配置
├── start.sh                    # 启动脚本
├── examples/
│   └── usage.ts               # 使用示例
├── tests/
│   └── main_test.ts           # 基础测试
└── src/
    ├── core/
    │   └── config.ts          # 应用配置管理
    ├── models/
    │   └── schemas.ts         # 数据模型和类型定义
    ├── services/
    │   ├── tokenManager.ts    # Token池管理服务
    │   └── proxyService.ts    # 代理服务核心逻辑
    ├── middleware/
    │   ├── auth.ts           # 认证中间件
    │   ├── cors.ts           # CORS中间件
    │   ├── error.ts          # 错误处理中间件
    │   └── logging.ts        # 日志中间件
    └── routes/
        ├── index.ts          # 路由定义和设置
        ├── v1.ts             # OpenAI兼容API路由
        └── system.ts         # 系统路由（健康检查等）
```

## 主要特性

✅ **完整功能移植**: 从Python版本完整移植所有核心功能
✅ **OpenAI兼容**: 100%兼容OpenAI API格式
✅ **现代化架构**: 使用Deno和TypeScript构建
✅ **高性能**: 基于V8引擎的高性能运行时
✅ **安全性**: Deno的沙箱环境和权限控制
✅ **易部署**: 单一可执行文件，支持Docker
✅ **完整文档**: 详细的使用说明和API文档
✅ **开发友好**: 热重载、代码格式化、类型检查

## 快速开始

1. 安装Deno
2. 配置环境变量
3. 运行 `./start.sh --setup` 初始化
4. 运行 `./start.sh --dev` 启动开发服务器
