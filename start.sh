#!/bin/bash

# Deno版本LLM代理API启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

# 检查Deno是否安装
check_deno() {
    if ! command -v deno &> /dev/null; then
        print_message "Deno未安装，正在安装..." $YELLOW
        curl -fsSL https://deno.land/x/install/install.sh | sh
        export PATH="$HOME/.deno/bin:$PATH"
        
        if ! command -v deno &> /dev/null; then
            print_message "Deno安装失败，请手动安装" $RED
            exit 1
        fi
        print_message "Deno安装成功" $GREEN
    else
        print_message "Deno已安装: $(deno --version | head -n1)" $GREEN
    fi
}

# 创建环境配置文件
setup_env() {
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_message "已创建.env文件，请根据需要修改配置" $YELLOW
        else
            print_message "未找到.env.example文件，创建默认配置..." $YELLOW
            cat > .env << 'EOF'
# 环境配置文件
APP_NAME=LLM Proxy API (Deno)
DEBUG=false
HOST=0.0.0.0
PORT=3333
TARGET_API_URL=https://api.orionai.asia/chat
CONVERSATION_API_URL=https://api.orionai.asia/conversation
PROJECT_API_URL=https://api.orionai.asia/project
MESSAGE_API_URL=https://api.orionai.asia/conversation
API_KEYS=["your-api-key-here"]
REQUIRE_API_KEY=true
TOKEN_POOL=["your-token-here"]
AVAILABLE_MODELS=["ChatGPT 4.1 Mini-Default", "ChatGPT 4.1 Mini-Writer", "ChatGPT 4.1 Mini-Researcher", "ChatGPT 4.1 Mini-Study", "ChatGPT 4.1 Mini-Developer", "ChatGPT 4.1 Mini-SEO Mode", "ChatGPT 4.1 Mini-Cybersecurity Mode", "ChatGPT 4.1-Default", "ChatGPT 4.1-Writer", "ChatGPT 4.1-Researcher", "ChatGPT 4.1-Study", "ChatGPT 4.1-Developer", "ChatGPT 4.1-SEO Mode", "ChatGPT 4.1-Cybersecurity Mode", "o4-Default", "o4-Writer", "o4-Researcher", "o4-Study", "o4-Developer", "o4-SEO Mode", "o4-Cybersecurity Mode", "Gemini 2.5 Flash 05-20-Default", "Gemini 2.5 Flash 05-20-Writer", "Gemini 2.5 Flash 05-20-Researcher", "Gemini 2.5 Flash 05-20-Study", "Gemini 2.5 Flash 05-20-Developer", "Gemini 2.5 Flash 05-20-SEO Mode", "Gemini 2.5 Flash 05-20-Cybersecurity Mode", "Gemini 2.5 Pro 06-05-Default", "Gemini 2.5 Pro 06-05-Writer", "Gemini 2.5 Pro 06-05-Researcher", "Gemini 2.5 Pro 06-05-Study", "Gemini 2.5 Pro 06-05-Developer", "Gemini 2.5 Pro 06-05-SEO Mode", "Gemini 2.5 Pro 06-05-Cybersecurity Mode", "Claude 3.5 Sonnet-Default", "Claude 3.5 Sonnet-Writer", "Claude 3.5 Sonnet-Researcher", "Claude 3.5 Sonnet-Study", "Claude 3.5 Sonnet-Developer", "Claude 3.5 Sonnet-SEO Mode", "Claude 3.5 Sonnet-Cybersecurity Mode", "Claude 4-Default", "Claude 4-Writer", "Claude 4-Researcher", "Claude 4-Study", "Claude 4-Developer", "Claude 4-SEO Mode", "Claude 4-Cybersecurity Mode", "DeepSeek R1-Default", "DeepSeek R1-Writer", "DeepSeek R1-Researcher", "DeepSeek R1-Study", "DeepSeek R1-Developer", "DeepSeek R1-SEO Mode", "DeepSeek R1-Cybersecurity Mode", "DeepSeek V3-Default", "DeepSeek V3-Writer", "DeepSeek V3-Researcher", "DeepSeek V3-Study", "DeepSeek V3-Developer", "DeepSeek V3-SEO Mode", "DeepSeek V3-Cybersecurity Mode", "Grok 3 Mini-Default", "Grok 3 Mini-Writer", "Grok 3 Mini-Researcher", "Grok 3 Mini-Study", "Grok 3 Mini-Developer", "Grok 3 Mini-SEO Mode", "Grok 3 Mini-Cybersecurity Mode", "Grok 3-Default", "Grok 3-Writer", "Grok 3-Researcher", "Grok 3-Study", "Grok 3-Developer", "Grok 3-SEO Mode", "Grok 3-Cybersecurity Mode", "Grok 4-Default", "Grok 4-Writer", "Grok 4-Researcher", "Grok 4-Study", "Grok 4-Developer", "Grok 4-SEO Mode", "Grok 4-Cybersecurity Mode"]
TIMEOUT=30000
MAX_RETRIES=3
RETRY_DELAY=1.0
EOF
            print_message "已创建默认.env文件，请根据需要修改配置" $YELLOW
        fi
    else
        print_message ".env文件已存在" $GREEN
    fi
}

# 缓存依赖
cache_deps() {
    print_message "正在缓存依赖..." $BLUE
    deno cache main.ts
    print_message "依赖缓存完成" $GREEN
}

# 格式化代码
format_code() {
    print_message "正在格式化代码..." $BLUE
    deno fmt
    print_message "代码格式化完成" $GREEN
}

# 检查代码
lint_code() {
    print_message "正在检查代码..." $BLUE
    deno lint
    print_message "代码检查完成" $GREEN
}

# 运行测试
run_tests() {
    print_message "正在运行测试..." $BLUE
    deno test --allow-net --allow-env --allow-read
    print_message "测试完成" $GREEN
}

# 启动服务器
start_server() {
    local mode=$1
    local port=${2:-3333}
    local host=${3:-0.0.0.0}
    
    print_message "启动服务器..." $BLUE
    print_message "模式: $mode" $BLUE
    print_message "地址: http://$host:$port" $BLUE
    print_message "API文档: http://$host:$port/docs" $BLUE
    print_message "健康检查: http://$host:$port/health" $BLUE
    print_message "按 Ctrl+C 停止服务器" $YELLOW
    
    if [ "$mode" = "dev" ]; then
        deno run --allow-net --allow-env --allow-read --watch main.ts
    else
        deno run --allow-net --allow-env --allow-read main.ts
    fi
}

# 显示帮助信息
show_help() {
    echo "Deno版本LLM代理API启动脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --setup          初始化项目设置"
    echo "  --dev            开发模式启动（自动重载）"
    echo "  --prod           生产模式启动"
    echo "  --port PORT      指定端口（默认3333）"
    echo "  --host HOST      指定主机（默认0.0.0.0）"
    echo "  --cache          缓存依赖"
    echo "  --fmt            格式化代码"
    echo "  --lint           检查代码"
    echo "  --test           运行测试"
    echo "  --help           显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --setup       # 初始化项目"
    echo "  $0 --dev         # 开发模式启动"
    echo "  $0 --prod        # 生产模式启动"
    echo "  $0 --dev --port 8080  # 指定端口启动"
}

# 主函数
main() {
    local mode=""
    local port=3333
    local host="0.0.0.0"
    local setup=false
    local cache_only=false
    local fmt_only=false
    local lint_only=false
    local test_only=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --setup)
                setup=true
                shift
                ;;
            --dev)
                mode="dev"
                shift
                ;;
            --prod)
                mode="prod"
                shift
                ;;
            --port)
                port="$2"
                shift 2
                ;;
            --host)
                host="$2"
                shift 2
                ;;
            --cache)
                cache_only=true
                shift
                ;;
            --fmt)
                fmt_only=true
                shift
                ;;
            --lint)
                lint_only=true
                shift
                ;;
            --test)
                test_only=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_message "未知选项: $1" $RED
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查Deno
    check_deno
    
    # 执行相应操作
    if [ "$setup" = true ]; then
        setup_env
        cache_deps
        print_message "项目设置完成！" $GREEN
        print_message "现在可以运行: $0 --dev" $BLUE
        exit 0
    fi
    
    if [ "$cache_only" = true ]; then
        cache_deps
        exit 0
    fi
    
    if [ "$fmt_only" = true ]; then
        format_code
        exit 0
    fi
    
    if [ "$lint_only" = true ]; then
        lint_code
        exit 0
    fi
    
    if [ "$test_only" = true ]; then
        run_tests
        exit 0
    fi
    
    # 如果没有指定模式，默认为开发模式
    if [ -z "$mode" ]; then
        mode="dev"
    fi
    
    # 启动服务器
    start_server "$mode" "$port" "$host"
}

# 运行主函数
main "$@"