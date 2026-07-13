# PatternFlow

PatternFlow is an independent English self-study platform for vocabulary, grammar, reading, writing and practical speaking.

一套面向英语学习者的原创自学平台，涵盖词汇、语法、阅读、写作和实用表达。

## 功能

- 低压力首页：继续学习、十分钟训练和重新回来模式
- 五个一级入口：首页、课程、口语、复习、进度
- Unit 5 – Things A2+ 原创课程
- 清晰美式语音、本地 MP3 优先和浏览器语音降级
- 跟读、录音与回放，不提供虚假的发音评分
- 智能错题复习、词汇掌握状态和本地学习进度
- 深色、浅色和跟随系统主题
- 数据导入、导出和基础 PWA 离线支持
- 隐藏课程工作室：`/studio`

## 本地运行

```powershell
npm install
npm start
```

打开 `http://127.0.0.1:8788/`。

## 检查

```powershell
npm run build
npm run lint
npm run typecheck
npm test
```

学习数据保存在浏览器 localStorage，不会自动上传到远程服务器。
