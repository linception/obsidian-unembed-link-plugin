import { Plugin, Editor, TFile, EditorChange, App, PluginSettingTab, Setting, Notice } from 'obsidian';

// --- 常量定义 ---
const EVENT_EDITOR_CHANGE = 'editor-change';
const DEFAULT_IMAGE_EXTENSIONS = 'png,jpg,jpeg,gif,bmp,svg,webp,ico';
const PLUGIN_NAME_LOADED = '非图片链接感叹号移除插件已加载。';
const PLUGIN_NAME_UNLOADED = '非图片链接感叹号移除插件已卸载。';

// --- 工具函数：debounce ---
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
    let timeout: number | null;
    return function(this: any, ...args: Parameters<T>) {
        const context = this;
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = window.setTimeout(() => {
            timeout = null;
            func.apply(context, args);
        }, wait);
    };
};

// --- 插件设置的接口和默认值 ---
interface UnembedLinkPluginSettings {
    scanDelay: number;
    imageExtensions: string;
    autoFillAltText: boolean;
}

const DEFAULT_SETTINGS: UnembedLinkPluginSettings = {
    scanDelay: 500,
    imageExtensions: DEFAULT_IMAGE_EXTENSIONS,
    autoFillAltText: true
};

export default class UnembedLinkPlugin extends Plugin {
    settings: UnembedLinkPluginSettings;
    private imageExtensionsSet: Set<string>;

    async onload() {
        console.log(PLUGIN_NAME_LOADED);

        await this.loadSettings();
        this.updateImageExtensionsSet();

        // 注册编辑器变更事件，使用 debounce
        this.registerEvent(
            this.app.workspace.on(
                EVENT_EDITOR_CHANGE,
                debounce(this.handleEditorChange.bind(this), this.settings.scanDelay)
            )
        );

        this.addSettingTab(new UnembedLinkSettingTab(this.app, this));
    }

    onunload() {
        console.log(PLUGIN_NAME_UNLOADED);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // 设置保存后更新图片扩展名集合
        this.updateImageExtensionsSet();
    }

    private updateImageExtensionsSet() {
        this.imageExtensionsSet = new Set(this.settings.imageExtensions.toLowerCase().split(',').map(ext => ext.trim()).filter(Boolean));
    }

    private isImageFile(extension: string): boolean {
        return this.imageExtensionsSet.has(extension.toLowerCase());
    }

    /**
     * 处理编辑器变更事件
     */
    private handleEditorChange = (editor: Editor) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('非图片链接移除插件：未找到活动文件。');
            return;
        }
        
        // 整合为一个正则表达式，同时匹配两种链接格式
        const linkRegex = /!\[\[([^\]]+)\]\]|!\[([^\]]*)\]\(([^)]+)\)/g;
        const fullText = editor.getValue();
        const changes: EditorChange[] = [];
        
        let match;
        while ((match = linkRegex.exec(fullText)) !== null) {
            const fullMatch = match[0];
            const matchIndex = match.index;
            
            let linkPath: string;
            let altText: string | null = null;
            let isWikiLink = false;
            
            // 判断是 Wiki 链接还是 Markdown 链接
            if (match[1]) { // Wiki 链接: ![[linkPath]]
                linkPath = match[1];
                isWikiLink = true;
            } else if (match[3]) { // Markdown 链接: ![altText](linkPath)
                altText = match[2];
                linkPath = match[3];
            } else {
                continue; // 无法识别的匹配
            }

            this.processLinkAndAddChange(activeFile, fullMatch, linkPath, altText, isWikiLink, matchIndex, editor, changes);
        }
        
        if (changes.length > 0) {
            editor.transaction({ changes });
            new Notice(`已批量更新 ${changes.length} 个非图片链接。`);
        }
    };

    /**
     * 检查链接并创建变更对象
     */
    private processLinkAndAddChange(
        activeFile: TFile, 
        fullMatch: string, 
        linkPath: string, 
        altText: string | null, 
        isWikiLink: boolean,
        matchIndex: number,
        editor: Editor,
        changes: EditorChange[]
    ) {
        const decodedLinkPath = decodeURIComponent(linkPath);
        const targetFile = this.app.metadataCache.getFirstLinkpathDest(decodedLinkPath, activeFile.path);

        if (targetFile && !this.isImageFile(targetFile.extension)) {
            let newLink: string;
            if (isWikiLink) {
                newLink = `[[${linkPath}]]`;
            } else {
                let filledAltText = altText;
                if (this.settings.autoFillAltText && altText === '') {
                    filledAltText = targetFile.basename;
                }
                newLink = `[${filledAltText}](${linkPath})`;
            }

            if (fullMatch !== newLink) {
                changes.push({
                    text: newLink,
                    from: editor.offsetToPos(matchIndex),
                    to: editor.offsetToPos(matchIndex + fullMatch.length)
                });
            }
        }
    }
}

// --- 插件设置界面类 ---
class UnembedLinkSettingTab extends PluginSettingTab {
    plugin: UnembedLinkPlugin;

    constructor(app: App, plugin: UnembedLinkPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('扫描延迟')
            .setDesc('设置插件在您停止输入后多少毫秒开始扫描并修复链接。')
            .addText(text => text
                .setPlaceholder('500')
                .setValue(this.plugin.settings.scanDelay.toString())
                .onChange(async (value) => {
                    const newDelay = parseInt(value, 10);
                    if (!isNaN(newDelay) && newDelay >= 0) {
                        this.plugin.settings.scanDelay = newDelay;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('图片文件扩展名')
            .setDesc('插件会忽略此列表中包含的扩展名，即使它们带有 `!` 符号也会保留。请使用逗号分隔每个扩展名（例如：`png,jpg,webp`）。')
            .addText(text => text
                .setPlaceholder(DEFAULT_IMAGE_EXTENSIONS)
                .setValue(this.plugin.settings.imageExtensions)
                .onChange(async (value) => {
                    this.plugin.settings.imageExtensions = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('自动填充空 altText')
            .setDesc('开启后，如果 Markdown 链接 `![altText](path)` 中的 `altText` 为空，插件会自动用文件名填充它。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoFillAltText)
                .onChange(async (value) => {
                    this.plugin.settings.autoFillAltText = value;
                    await this.plugin.saveSettings();
                }));
    }
}