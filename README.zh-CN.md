# Tab Harbor 改动说明

[English](README.md) | [简体中文](README.zh-CN.md)

这个 fork 保留 Tab Harbor 原本的方向，但这份 README 只记录当前分支里我做的修改，不再重复介绍原仓库已有功能。

## 改了什么

### 快捷图标编辑器

- 为快捷方式增加图标遮罩控制。
- 增加全局图标尺寸和圆角半径滑杆。
- 增加“搜索网站图标”操作，会根据快捷方式 URL 查找可用的 favicon、Apple touch icon 和备用 favicon 服务图标。
- 优化自定义图片 / SVG 在圆角遮罩里的显示，让小图标更自然地填满图标框。
- 为快捷方式增加鼠标中键打开支持，可以在后台标签页打开对应链接。

### 视觉方向

- 将标题和装饰性文字从远程 Libre Caslon 字体改为本地 editorial 字体：
  - `Test Tiempos Text`
  - `方正FW筑紫A老明朝 简`
- 调整 greeting、日期、抽屉计数、分组标题和页脚等位置的字体使用。
- 弱化快捷方式默认外框，让它更像安静的图标栏，而不是一组小卡片。

### 抽屉和首页细节

- 调整保存抽屉宽度，让宽屏下有更多呼吸感。
- 待办文字支持显示两行，不再强制单行截断。
- 更新重复 Tab Harbor 标签页提示，只在打开 3 个及以上 Tab Harbor 标签页时出现。
- 补齐 saved-for-later 和 todo empty state 的 i18n 挂点。

### Popup 体验

- 将快捷图标尺寸和遮罩变量同步到扩展 popup。
- 更新 popup 渲染逻辑和测试，覆盖快捷图标遮罩行为。
- 调整 popup 样式，使它和新标签页里的快捷图标处理保持一致。

### 隐私页面

- 将隐私页面里的相关字体也同步到本地 editorial 字体栈。

## 当前差异范围

和上游 `V-IOLE-T/tab-harbor@main` 相比，当前分支主要改动：

- `extension/theme-controls.js`
- `extension/style.css`
- `extension/index.html`
- `extension/popup/popup.js`
- `extension/popup/popup.css`
- `extension/drawer-manager.js`
- `extension/dashboard-runtime.js`
- `extension/i18n.js`
- shortcut、popup、theme、UI regression 相关测试
- `privacy.html`

## 验证

相关验证命令：

```bash
node --test extension/*.test.js extension/popup/*.test.js
```

如果涉及脚本加载或启动链路，也需要在 Chrome 里实际加载扩展验证；这个项目仍然是按顺序加载的普通 script 标签，没有 bundler。

## 说明

最近 GitHub 评论里提到纯 HTML / CSS / JS 结构已经有些难维护。当前分支没有把项目改成 Vue 或其他框架，而是在现有架构内收窄处理 UI 和交互细节。
