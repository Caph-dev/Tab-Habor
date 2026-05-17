# Tab Harbor 改动说明

[简体中文](README.md) | [English](README.en.md)

这个 fork 保留 Tab Harbor 原本的方向，但这份 README 只记录当前分支里我做的修改，不再重复介绍原仓库已有功能。

## 改了什么

### Chrome 同步小结

- 增加基于 `chrome.storage.sync` 的跨设备同步，不引入自有服务器。
- 同步前提是两台设备使用同一个 Google Chrome 账号，并且 Chrome Sync 已开启，同时允许同步“扩展程序 / Extensions”或相关扩展数据。
- “稍后阅读”会同步 URL、标题、完成 / 归档 / 删除状态和顺序。
- “待办”会同步标题、描述、完成 / 归档 / 删除状态和顺序。
- 搜索栏下方快捷项会同步 URL、标签、顺序、图标类型、图标遮罩和轻量图标。
- 大体积快捷图标图片不会写入 Chrome Sync，会继续保留在本机缓存中，避免超过 Chrome Sync 的单项容量限制。
- `chrome.storage.local` 仍作为本地缓存和旧数据备份；删除使用 tombstone 状态，避免另一台设备用旧数据把项目复活。

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
- 将桌面设置和固定顺序按钮从顶部标签分组导航行移出，改为页面右下角的安静浮动控制。
- 将标签分组导航保留在左侧打开标签页列内，让右侧内容可以填补这些控制移走后释放出的顶部空间。
- 调整主题菜单，让它从右下角控制按钮上方向上弹出；移动端使用固定定位，避免超出视口或和抽屉触发按钮冲突。
- 微调右侧搜索框间距，让搜索框上边线在视觉上对齐左侧“打开的标签页”标题行里的分隔线。
- 优化右侧抽屉打开路径：先显示抽屉外壳，再在下一次绘制后刷新当前抽屉视图内容。
- 在桌面设置里增加抽屉速度滑杆，默认速度更快，并支持持久化 1-5 档速度。
- 为新的分组导航位置、右下角浮动控制、向上弹出的主题菜单、搜索框间距、抽屉打开路径和抽屉速度设置补充 UI regression 覆盖。

### Popup 体验

- 将快捷图标尺寸和遮罩变量同步到扩展 popup。
- 更新 popup 渲染逻辑和测试，覆盖快捷图标遮罩行为。
- 调整 popup 样式，使它和新标签页里的快捷图标处理保持一致。

### 隐私页面

- 将隐私页面里的相关字体也同步到本地 editorial 字体栈。

## 当前差异范围

和上游 `V-IOLE-T/tab-harbor@main` 相比，当前分支主要改动：

- `extension/drawer-sync-store.js`
- `extension/quick-shortcuts-sync-store.js`
- `extension/theme-controls.js`
- `extension/style.css`
- `extension/index.html`
- `extension/popup/popup.js`
- `extension/popup/popup.css`
- `extension/popup/popup.html`
- `extension/drawer-manager.js`
- `extension/dashboard-runtime.js`
- `extension/i18n.js`
- `extension/manifest.json`
- sync、shortcut、popup、theme、drawer、todo、UI regression 相关测试
- `privacy.html`

## 验证

相关验证命令：

```bash
node --test extension/*.test.js extension/popup/*.test.js
```

如果涉及脚本加载或启动链路，也需要在 Chrome 里实际加载扩展验证；这个项目仍然是按顺序加载的普通 script 标签，没有 bundler。

## 说明

最近 GitHub 评论里提到纯 HTML / CSS / JS 结构已经有些难维护。当前分支没有把项目改成 Vue 或其他框架，而是在现有架构内收窄处理 UI、交互和同步功能。
