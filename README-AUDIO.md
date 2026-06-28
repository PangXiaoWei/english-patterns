# English Patterns 音频生成说明

这个网站优先播放本地 MP3。没有 MP3 时，会自动使用浏览器 Web Speech API 美式发音，不会白屏，也不会报错。

## 为什么要生成 MP3

浏览器自带发音在不同电脑上声音不一样。高质量 MP3 可以让单词、短语和例句发音更稳定、更清晰。

## 为什么不能在前端调用 OpenAI API

前端代码会公开到 GitHub Pages。如果把 API key 写到前端，别人可以看到并使用你的 key。API key 只能放在本地 `.env.local`，不能提交到 GitHub。

## 第一步：创建 .env.local

复制 `.env.example`，重命名为 `.env.local`。

然后打开 `.env.local`，填写：

```text
OPENAI_API_KEY=你的 OpenAI API key
TTS_PROVIDER=openai
TTS_MODEL=gpt-4o-mini-tts
TTS_VOICE=marin
TTS_RESPONSE_FORMAT=mp3
```

## 第二步：先测试 10 条

双击：

```text
generate-audio-test.bat
```

它只生成前 10 条音频，用来测试 API key 和音质。

## 第三步：检查缺少哪些音频

双击：

```text
check-audio.bat
```

这个脚本只检查，不调用 API，不花钱。

## 第四步：生成缺失音频

确认测试没问题后，再双击：

```text
generate-audio.bat
```

它默认只生成 Priority 1 和 Priority 2，并且只生成缺失的 MP3。已经存在的文件不会重复生成。

## 音频保存位置

```text
public/audio/en-us/words/
public/audio/en-us/phrases/
public/audio/en-us/examples/
public/audio/en-us/minimal-pairs/
```

生成后会更新：

```text
public/audio/audio-manifest.json
```

## 如何确认网站播放的是本地 MP3

如果对应 MP3 文件存在，小喇叭会优先播放 MP3。

如果 MP3 不存在或加载失败，网站会自动 fallback 到浏览器发音。

## 如何避免泄露 API key

不要提交这些文件：

```text
.env
.env.local
*.env
```

项目 `.gitignore` 已经忽略它们。前端代码里不要写 `OPENAI_API_KEY`。

## 如何控制 API 成本

先用：

```text
generate-audio-test.bat
```

只生成 10 条测试。确认效果好，再分批生成。不要一开始全量生成巨大词库。
