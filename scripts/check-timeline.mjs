#!/usr/bin/env node
// 检查人工声明的镜头/事件时间表；不能替代视频视觉验收。
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';

export function validateTimeline(data) {
  const errors = [];
  const fail = (message) => errors.push(message);
  const integer = (n) => Number.isInteger(n) && n >= 0;
  if (!Number.isFinite(data.fps) || data.fps <= 0) fail('fps必须为正数');
  if (!Number.isInteger(data.durationFrames) || data.durationFrames <= 0) fail('durationFrames必须为正整数');
  if (!Array.isArray(data.shots) || !data.shots.length) fail('shots不能为空');
  if (!Array.isArray(data.events)) fail('events必须是数组');
  const shots = Array.isArray(data.shots) ? data.shots : [];
  const events = Array.isArray(data.events) ? data.events : [];
  const shotIds = new Set();
  let coveredUntil = 0;
  for (const s of [...shots].sort((a,b)=>a.start-b.start)) {
    if (!s.id || shotIds.has(s.id)) fail(`镜头ID缺失或重复：${s.id}`);
    shotIds.add(s.id);
    if (!integer(s.start) || !integer(s.end) || s.end <= s.start || s.end > data.durationFrames) fail(`镜头范围错误：${s.id}`);
    if (s.start > coveredUntil) fail(`未声明的画面空档：${coveredUntil}→${s.start}`);
    if (s.start < coveredUntil && s.transitionIn !== 'overlap') fail(`镜头重叠未声明：${s.id}`);
    coveredUntil = Math.max(coveredUntil,s.end);
  }
  if (coveredUntil !== data.durationFrames) fail('镜头末尾与成片时长不一致');
  const eventMap = new Map();
  for (const e of events) {
    if (!e.id || eventMap.has(e.id)) fail(`事件ID缺失或重复：${e.id}`);
    eventMap.set(e.id,e);
    if (!integer(e.frame) || e.frame >= data.durationFrames) fail(`事件在成片外：${e.id}`);
    if (e.shot) {
      const s=shots.find(s=>s.id===e.shot);
      if (!s || e.frame<s.start || e.frame>=s.end) fail(`事件不在所属镜头：${e.id}`);
    }
  }
  for (const e of events) {
    for (const dep of e.after || []) {
      const prior=eventMap.get(dep);
      if (!prior) fail(`缺少依赖事件：${e.id} → ${dep}`);
      else if (e.frame<=prior.frame) fail(`因果顺序错误：${e.id}必须晚于${dep}`);
    }
  }
  for (const c of data.clicks || []) {
    const ids=['ready','moveStart','arrive','press','release','result'];
    const frames=ids.map(k=>eventMap.get(c[k])?.frame);
    if (frames.some(f=>f===undefined)) {fail(`点击链缺少事件：${c.id}`);continue;}
    for (let i=1;i<frames.length;i++) if(frames[i]<=frames[i-1]) fail(`点击链顺序错误：${c.id}的${ids[i]}`);
    const b=c.targetRect,p=c.pointerAtPress;
    if(!b || !p || ![b.x,b.y,b.width,b.height,p.x,p.y].every(Number.isFinite) || b.width<=0 || b.height<=0) fail(`点击目标几何无效：${c.id}`);
    else if(p.x<b.x || p.x>b.x+b.width || p.y<b.y || p.y>b.y+b.height) fail(`鼠标尖端未命中：${c.id}`);
  }
  return errors;
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.argv[2]) throw new Error('用法：node check-timeline.mjs timeline.json');
    const errors=validateTimeline(JSON.parse(fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,'')));
    if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
    else console.log('时序检查通过；仍需核对实际渲染画面与动态效果。');
  } catch(e){console.error(e.message);process.exitCode=1;}
}
