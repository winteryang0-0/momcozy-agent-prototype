import React,{useEffect,useRef,useState} from 'react';
import {Avatar} from './Avatar.jsx';
import {STATES,FLOWS,SequencePlayer} from './motion-model.mjs';
const phaseNames={manual:'单状态 · 自动循环',playing:'流程播放中',paused:'流程已暂停',waiting:'等待你的操作',done:'流程已结束'};
export function App(){
 const [snap,setSnap]=useState({state:'ready',phase:'manual',name:'单状态预览',index:0,total:0,rev:0,gate:null});
 const [motionRun,setMotionRun]=useState(0);
 const [flow,setFlow]=useState('record'),[speed,setSpeed]=useState(1),[reduced,setReduced]=useState(false),[systemReduced,setSystemReduced]=useState(false),[frozen,setFrozen]=useState(false),[hidden,setHidden]=useState(false),[size,setSize]=useState(420),[showReference,setShowReference]=useState(false),[events,setEvents]=useState([]);
 const controller=useRef(null),lastRev=useRef(-1);
 if(!controller.current)controller.current=new SequencePlayer(next=>{setSnap(next);if(next.rev!==lastRev.current){lastRev.current=next.rev;setEvents(old=>[{id:next.rev,text:STATES[next.state].name,from:next.name,time:new Date().toLocaleTimeString('zh-CN',{hour12:false})},...old].slice(0,8));}});
 const player=controller.current;
 useEffect(()=>{const mq=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setSystemReduced(mq.matches);update();mq.addEventListener('change',update);const visibility=()=>{setHidden(document.hidden);if(document.hidden){player.pause();setFrozen(true);}};document.addEventListener('visibilitychange',visibility);return()=>{player.dispose();mq.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility);};},[]);
 const def=STATES[snap.state],isReduced=reduced||systemReduced,paused=frozen||hidden||snap.phase==='paused';
 const manual=state=>{setFrozen(false);player.manual(state);};
 const start=()=>{setFrozen(false);player.start(FLOWS[flow]);};
 const replay=()=>setMotionRun(n=>n+1);
 const togglePause=()=>{if(snap.phase==='paused'){setFrozen(false);player.resume();}else if(snap.phase==='playing'){player.pause();setFrozen(true);}else setFrozen(!frozen);};
 const cancel=()=>{setFrozen(false);player.cancel();};
 const interrupt=()=>{setFrozen(false);player.manual('interrupted');};
 const standaloneAction=()=>{setFrozen(false);
  if(snap.state==='ready'||snap.state==='cancelled')player.start(FLOWS.record);
  else if(snap.state==='permission')player.start({name:'模拟允许权限',steps:[{state:'listening',ms:2200},{state:'processing',ms:1800},{state:'result'}]});
  else if(['error','offline','confirm'].includes(snap.state))player.start({name:'模拟保存',steps:[{state:'saving',ms:1500},{state:'success'}]});
  else if(snap.state==='indeterminate')player.start(FLOWS.analysis);
  else if(snap.state==='timeout')player.start({name:'重试分析',steps:[{state:'processing',ms:2000},{state:'result'}]});
  else if(snap.state==='interrupted'||snap.state==='result')player.start({name:'播报说明（无音频）',steps:[{state:'speaking',ms:6000},{state:'result'}]});
  else if(snap.state==='listening'){if(['playing','paused'].includes(snap.phase))player.finishListening();else player.start({name:'停止收音并处理',steps:[{state:'processing',ms:1800},{state:'result'}]});}
 };
 const actionLabels={ready:'开始一次记录',cancelled:'重新开始',permission:'模拟允许麦克风',error:'重试保存',offline:'模拟联网并重试',confirm:'确认并模拟保存',indeterminate:'重新采集',timeout:'重试分析',interrupted:'重新播报（模拟）',result:'播放说明（口型模拟）',listening:'停止收音并处理'};
 const canAction=actionLabels[snap.state]&&(snap.state==='listening'||(snap.phase!=='playing'&&snap.phase!=='paused'));
 return <main>
  <header className="masthead"><div className="brand">momcozy <span>· AI EXPERIENCE</span></div><span className="version">静态形象 → 交互表现 · v0.1</span></header>
  <section className="intro"><div><p className="eyebrow">SOFT COMPANION / MOTION STUDY</p><h1>软石的每一次回应</h1><p className="lead">选择一个状态，或播放一段完整流程。安静、明确，随时可以停下。</p></div><span className="demo-tag">独立演示 · 模拟数据</span></section>
  <div className="workspace"><section className={'stage tone-'+(def.tone||'neutral')} aria-label="角色预览">
   <div className="stage-top"><span className="state-code">{def.en}</span><span className="phase">{phaseNames[snap.phase]}</span></div>
   <div className="character-stage"><Avatar state={snap.state} revision={`${snap.rev}:${motionRun}`} reduced={isReduced} paused={paused} speed={speed} size={size} loop={snap.phase==='manual'}/></div>
   <div className="status-block" aria-live="polite" aria-atomic="true"><span className={'status-label '+(def.tone||'neutral')}>{def.name}</span><h2 data-testid="state-title">{def.title}</h2><p>{def.copy}</p></div>
   <div className="task-actions">
    {snap.gate&&<button className="primary" onClick={()=>{setFrozen(false);player.next();}}>{snap.gate}</button>}
    {!snap.gate&&canAction&&<button className="primary" onClick={standaloneAction}>{actionLabels[snap.state]}</button>}
    {snap.state==='speaking'&&<button className="primary" onClick={interrupt}>打断播报</button>}
    {!['ready','cancelled','success'].includes(snap.state)&&<button className="quiet" onClick={cancel}>{snap.state==='permission'?'暂不启用':'取消当前任务'}</button>}
   </div>
   <div className="stage-foot"><button className="text-button" disabled={paused} onClick={replay}>重播当前动作</button><label>预览宽度<select aria-label="预览宽度" value={size} onChange={e=>setSize(Number(e.target.value))}><option value="420">420 px</option><option value="96">96 px</option><option value="48">48 px</option><option value="24">24 px</option></select></label><button className="text-button" onClick={()=>setShowReference(!showReference)}>{showReference?'收起参考':'对照原始形象'}</button></div>
   {showReference&&<figure className="reference"><img src={new URL('../assets/reference.png',import.meta.url).href} alt="已选软石静态概念图"/><figcaption>已选静态概念图。表情贴图沿用其轮廓、材质与配色。</figcaption></figure>}
  </section><aside className="state-panel"><div className="section-title"><h2>状态选择</h2><span>{Object.keys(STATES).length} STATES</span></div><p className="hint">点击状态自动循环预览；切换时结束上一段播放。</p>
   {['交流','任务','恢复'].map(group=><div className="state-group" key={group}><h3>{group}</h3><div className="state-grid">{Object.entries(STATES).filter(([,s])=>s.group===group).map(([key,s])=><button key={key} className={'state-button '+(snap.state===key?'selected':'')} aria-pressed={snap.state===key} onClick={()=>manual(key)}><span>{s.name}</span><span className="state-number">{String(Object.keys(STATES).indexOf(key)+1).padStart(2,'0')}</span></button>)}</div></div>)}
  </aside></div>
  <section className="flow-section" aria-label="流程控制"><div className="flow-heading"><div><p className="eyebrow">TRY A FULL JOURNEY</p><h2>把状态串成一次体验</h2></div><p className="hint">关键决定停下来等你确认。</p></div>
   <div className="flow-controls"><label className="flow-picker">场景（切换即停止当前流程）<select aria-label="演示场景" value={flow} onChange={e=>{setFlow(e.target.value);manual('ready');}}>{Object.entries(FLOWS).map(([id,f])=><option key={id} value={id}>{f.name}</option>)}</select></label><button className="primary" onClick={start}>播放流程</button><button className="secondary" onClick={togglePause}>{paused?'继续播放':'暂停播放'}</button><button className="quiet" onClick={cancel}>停止并取消</button><label className="speed">动作速度<select aria-label="动作速度" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option></select></label><label className="check"><input type="checkbox" checked={reduced} onChange={e=>setReduced(e.target.checked)}/>减少动态效果</label></div>
   <div className="journey" aria-label="流程步骤">{FLOWS[flow].steps.map((step,i)=><div key={i} className={'journey-step '+(snap.name===FLOWS[flow].name&&snap.index===i?'current':'')}><span>{i+1}</span><b>{STATES[step.state].name}</b><small>{step.gate?'等待操作':step.ms?'自动衔接':'结束'}</small></div>)}</div>
   <p className="playback-note">{snap.phase==='paused'||frozen?'播放已暂停；点击“继续播放”恢复。':snap.phase==='waiting'?'流程正在等待你操作，请使用角色下方的按钮。':snap.phase==='playing'?`当前播放：${snap.name} · 第 ${snap.index+1} / ${snap.total} 步`:'单状态动作播放后停留 0.9 秒再循环；播报口型持续循环，静止状态保持原样。'} {systemReduced?'系统已启用减少动态效果。':isReduced?'已关闭角色位移、形变与循环口型，保留状态文字。':''}</p>
  </section>
  <div className="detail-grid"><section className="rules"><div className="section-title"><h2>原始动作规则</h2><span>{def.en}</span></div><p className="motion-description">{def.motion}</p><dl><div><dt>进入条件</dt><dd>{def.trigger}</dd></div><div><dt>退出条件</dt><dd>{def.exit}</dd></div><div><dt>动作时长</dt><dd>{def.duration===Infinity?'仅播报期间循环，打断即停':def.duration===0?'静止，无装饰动画':`${def.duration} ms · 一次性反馈`}</dd></div></dl></section><section className="event-panel"><div className="section-title"><h2>本次状态记录</h2><button className="text-button" onClick={()=>setEvents([])}>清空</button></div>{events.length===0?<p className="hint">从一个状态开始，观察每次切换。</p>:<ol className="event-list">{events.map(e=><li key={e.id}><time>{e.time}</time><b>{e.text}</b><span>{e.from}</span></li>)}</ol>}</section></div>
  <footer><p>本页不连接麦克风、分析服务或存储服务，也不播放声音。录音、保存与结果均为演示。</p><p>形象与动效为候选稿；小尺寸表情和生产资产仍需后续验证。切到后台会暂停，返回后由你继续。</p></footer>
 </main>;
}
