# Obsidian Unembed Link Plugin

**非图片链接感叹号移除插件**

此插件会自动检查你文件中的链接，如果链接指向的是非图片文件（例如笔记文件、PDF、音频等），它会自动移除链接前的感叹号 `!`，防止 Obsidian 以嵌入（Embed）的方式显示这些文件。

---

### 功能亮点

- **自动移除感叹号**: 当你输入或修改链接时，插件会自动检查目标文件类型。如果是非图片文件，它会智能地移除 `![[...]]` 或 `![...](...)` 链接前的 `!` 符号，将其转换为普通链接。
- **支持两种链接格式**: 同时支持 Obsidian 的 Wiki 链接 `[[...]]` 和标准的 Markdown 链接 `[...]`。
- **自动填充 Alt 文本**: 针对 Markdown 链接 `![alt-text](...)`，如果 `alt-text` 为空，插件可以自动将其填充为目标文件的文件名，让你的笔记更规范。
- **可配置**: 你可以在设置中自定义扫描延迟、排除特定的图片扩展名，以及开启/关闭自动填充 Alt 文本的功能。

---

### 为什么需要这个插件？

在 Obsidian 中，使用 `!` 符号可以嵌入（Embed）一个文件。这对于图片非常有用，但如果你不小心对笔记、PDF 或其他非图片文件使用了 `!`，Obsidian 会尝试在当前笔记中渲染整个文件内容，这可能会导致不必要的性能开销和杂乱的视觉效果。

本插件解决了这个问题，确保你只有在真正需要嵌入图片时才会使用 `!`，让你的笔记保持整洁和高效。

---

## 安装

### 通过 Obsidian 社区插件市场安装（推荐）

1.  打开 Obsidian **设置**。
2.  进入 **社区插件**，点击 **浏览**。
3.  搜索 "Unembed Link Plugin"。
4.  点击 **安装**，然后 **启用** 插件。

### 手动安装

1.  从 [GitHub releases](https://github.com/linception/obsidian-unembed-link-plugin/releases) 页面下载最新版本的 `main.js`、`manifest.json` 和 `styles.css` 文件。
2.  将这三个文件放到你的 Obsidian vault 的插件目录中。
    - 路径通常是 `YourVault/.obsidian/plugins/obsidian-unembed-link-plugin/`。
    - 如果 `obsidain-unembed-link-plugin` 文件夹不存在，请手动创建一个。
3.  重启 Obsidian。
4.  打开 **设置**，进入 **社区插件**，找到并 **启用** "Unembed Link Plugin"。

---

## 设置

在插件设置中，你可以根据自己的需求调整以下选项：

- **扫描延迟**: 设置插件在您停止输入后多少毫秒开始扫描和修复链接。默认值为 500ms。
- **图片文件扩展名**: 一个以逗号分隔的列表，包含所有你希望插件保留 `!` 符号的图片文件扩展名。例如：`png,jpg,jpeg,gif`。
- **自动填充空 altText**: 开启后，如果 Markdown 链接的 alt 文本为空，插件会自动用文件名填充。

---

## 感谢

- 感谢 Obsidian 团队提供了如此强大的插件 API。
- 感谢所有为这个插件提供建议和反馈的用户。

如果你有任何问题或建议，欢迎在 [GitHub Issues](https://github.com/linception/obsidian-unembed-link-plugin/issues) 中提出。