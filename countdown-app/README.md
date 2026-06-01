# 倒计时挂件

一个轻巧的 Windows 桌面倒计时小部件，无边框透明窗口，始终置顶显示。

## 功能

- ⏳ 实时倒计时（天 / 时 / 分 / 秒）
- 📅 已过去事件显示天数
- 🎨 可自定义主题色、背景透明度、字体大小
- 📌 始终置顶 + 位置锁定
- 🖱️ 拖拽移动 + 四角缩放窗口
- 🚀 开机自启
- 📋 右键快捷菜单

## 截图

> 替换为你的截图

## 运行

```bash
# 安装依赖
npm install

# 启动
npm start
# 或直接双击 启动倒计时.bat
```

## 打包

```bash
npm run build
```

生成的 exe 位于 `dist/` 目录，约 80-100MB。

## 操作

| 操作 | 方法 |
|------|------|
| 拖拽移动 | 左键按住窗口拖动 |
| 缩放窗口 | 拖动窗口右下角 |
| 打开设置 | 双击窗口 或 右键 → 设置 |
| 右键菜单 | 右键点击窗口 |

## 设置项

| 设置 | 说明 |
|------|------|
| 事件名称 | 倒计时目标名称 |
| 目标日期 | 倒计时结束日期 |
| 字体大小 | 数字显示大小 (16-48px) |
| 主题颜色 | 标题高亮色 |
| 背景不透明度 | 窗口背景深浅 |
| 显示秒数 | 开关秒数显示 |
| 始终置顶 | 窗口保持在最前 |
| 锁定位置 | 锁定后不可拖拽 |
| 开机自启 | 随系统启动 |
| 窗口尺寸 | 精确设置宽×高 |

## 技术栈

- **Electron 28** — 桌面框架
- **原生 HTML/CSS/JS** — 无额外前端框架
- **contextBridge + preload** — 安全的 IPC 通信

## 项目结构

```
countdown-app/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本 (contextBridge)
├── start.js             # 启动脚本 (清理环境变量)
├── package.json
├── 启动倒计时.bat        # Windows 一键启动
├── renderer/
│   ├── index.html       # 倒计时界面
│   ├── style.css        # 样式
│   └── renderer.js      # 渲染进程逻辑
└── settings/
    ├── settings.html    # 设置面板
    ├── settings.css     # 设置样式
    └── settings.js      # 设置逻辑
```

## 数据存储

设置文件保存在 `%APPDATA%/countdown-widget/countdown-settings.json`，退出后不会丢失。

## 开发注意事项

- `start.js` 用于清除 `ELECTRON_RUN_AS_NODE` 环境变量后启动 Electron
- 窗口拖动使用 JS 手动实现（而非 CSS `-webkit-app-region`），以避免 Windows 系统菜单干扰
- 未打包模式下开机自启需显式传入 app 路径，否则会显示 Electron 默认界面
- `rcedit` 可修改 exe 图标等资源（需单独配置）
