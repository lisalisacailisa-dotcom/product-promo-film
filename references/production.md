# 工程、音频与输出

## 可维护交付

推荐项目结构（可沿用现有工程）：
```
brief/ product-brief.md evidence-ledger.md script.md
src/ scenes/ components/ theme.ts timeline.ts
public/ fonts/ images/ videos/ audio/
qa/ keyframes/ checks.md timeline.json
outputs/ product-promo-v01.mp4
project-state.md
```

入口注册尺寸、fps、durationInFrames；秒转帧集中计算。场景起止采用半开区间 `[start,end)`，转场重叠明确声明，不能靠多段重复编码碰巧连接。镜头 ID 与输出、素材、验收帧对应。

所有动画由当前帧决定，不能依赖 wall-clock、CSS transition、未固定随机数或加载时序。鼠标、步骤高亮、流式文本、生成进度共享同一具名时间表，禁止在多个组件分别猜帧数。复用的图片节点先验证原始比例和黑边。

优先修改现有工程副本，而非重建用户已经满意的片段。不盲目全局 replace 数字：把500改510可能误改1500宽度。时间、布局、业务计数各自命名。保留原片/原源文件，并记录修订范围。

## 预检和渲染

先确认 Node、Remotion、浏览器、FFmpeg、字体和静态资产可用。沿用锁文件中的版本，不为一次视频任务无故升级。读取相关 Remotion 本地技能/当前官方文档仅在需要时进行；本技能不硬依赖其安装。

先出样帧与一个短动态样段，再跑长片。示例命令（用实际路径和Composition替换参数）：
```
npx remotion still src/index.tsx Promo qa/frame.png --frame=120
npx remotion render src/index.tsx Promo outputs/promo.mp4 --codec=h264 --crf=16
ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate -show_entries format=duration -of json outputs/promo.mp4
ffmpeg -v error -i outputs/promo.mp4 -f null -
```

Windows 既有工程使用 `--browser-executable` 指向已安装浏览器；本次历史环境 `--gl=angle --concurrency=1` 比 swangle 稳定快速，仅作故障排查起点，不强加给所有设备。卡住时先看进程/日志，检查资产加载、GPU与并发，不重复启动多个长渲染。

最终常用 H.264 MP4，兼顾兼容性，必要时输出 yuv420p、faststart。沿用既定 fps；60fps 适用于细腻镜头运动但不会自动提高文字质量。4K 需要可解析的文字和足够分辨率的素材，不能只放大低清截图。

## 音频

脚本阶段声明：配音/字幕/配乐/交互音效各自有或无。默认保持用户已有音轨；先检查源文件是否真的有音频。

旁白要根据最终实际录音调时；不能让末句被切掉。配乐节拍帮助章节切换，不能强迫业务演示抢拍。点击、转场、完成提示音克制使用；语音期间降低配乐。初始网络交付可参考约 -16 LUFS 综合响度、-1 dBTP 峰值，再按投放要求调整，不把参考值当所有平台标准。

没有语音生成能力时使用用户音轨、可用授权素材，或明确交付无旁白版本及缺口。不要声称无声视频“带音效”。用户只要求无声操作片段时无需强加配乐。

重新拼接时保持分辨率、fps、色彩和音频采样率一致；有重叠叠化需重新计算总长度。不使用未经检查的 `-shortest` 把画面或尾音意外裁断。最终完整导出后再做一遍检查，不能只检查分段源文件。

## 版本与恢复

`project-state.md`保存：确认脚本版本、已确认风格/文案/配音、Scene→source→Composition→输出映射、渲染命令、资产缺口、渲染状态。中断后从现有记录和文件恢复，不从头重做。实际导出失败就报告失败及剩余步骤，不拿关键帧冒充视频。
