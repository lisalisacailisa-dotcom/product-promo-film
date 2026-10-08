# 时间表与检查器

运行：`node <skill路径>/scripts/check-timeline.mjs <项目>/qa/timeline.json`。

时间均为全片帧号，镜头用半开区间。建议由实际 `timeline.ts` 中的常量导出 JSON，避免人工填写的检查表与真实渲染时间不一致。检查器只验证声明的数据，不自动读取视频判断颜色、文字或光标。

下例是合成的操作镜头，不是固定产品流程。所有坐标为同一最终画布坐标系；若有相机变换，应先转换按钮矩形及鼠标尖端。非鼠标镜头不需要 clicks。

```json
{
  "fps": 30,
  "durationFrames": 180,
  "shots": [{"id":"S01","start":0,"end":180}],
  "events": [
    {"id":"batchComplete","frame":30,"shot":"S01"},
    {"id":"move","frame":45,"shot":"S01","after":["batchComplete"]},
    {"id":"arrive","frame":66,"shot":"S01","after":["move"]},
    {"id":"press","frame":72,"shot":"S01","after":["arrive"]},
    {"id":"release","frame":76,"shot":"S01","after":["press"]},
    {"id":"generating","frame":82,"shot":"S01","after":["release"]},
    {"id":"complete","frame":145,"shot":"S01","after":["generating"]}
  ],
  "clicks": [{
    "id":"generateAll",
    "ready":"batchComplete","moveStart":"move","arrive":"arrive",
    "press":"press","release":"release","result":"generating",
    "targetRect":{"x":400,"y":150,"width":150,"height":50},
    "pointerAtPress":{"x":470,"y":173}
  }]
}
```

检查：镜头空档、未声明重叠、超出片长、重复ID、错误依赖顺序、点击链先后、鼠标落点。叠化时后镜头写 `"transitionIn":"overlap"`。黑场若是设计选择也应作为明确镜头覆盖时间。

未检查：帧中的真实文本、语义数字、材质/比例、坐标是否与真实页面一致、音频、成片是否还沿用旧时间线。这些依照 `qa.md` 对最终文件检查。
