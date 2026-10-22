export const STATES = {
 ready:{name:'就绪',en:'READY',group:'交流',frame:0,duration:0,title:'随时可以开始',copy:'安静地等待下一次操作。',motion:'中性表情，保持静止。',trigger:'进入页面 / 完成退出',exit:'用户发起新任务'},
 listening:{name:'收音中',en:'LISTENING',group:'交流',frame:1,duration:480,title:'正在接收你的声音',copy:'模拟收音中 · 没有启用麦克风',motion:'一次眨眼后轻微前倾，再保持专注。',trigger:'麦克风已实际启动（本页模拟）',exit:'停止收音 / 取消 / 权限中断'},
 processing:{name:'处理中',en:'PROCESSING',group:'交流',frame:1,duration:520,title:'正在整理这段内容',copy:'模拟分析中 · 不显示虚假百分比',motion:'轻微收拢一次，保持专注，不循环摇摆。',trigger:'分析任务已开始',exit:'返回结果 / 无法判断 / 超时 / 取消'},
 speaking:{name:'播报中',en:'SPEAKING',group:'交流',frame:0,duration:Infinity,title:'正在说明这次结果',copy:'播报口型演示 · 本页不播放音频',motion:'小幅口型节奏；仅播报状态循环，可立即打断。',trigger:'音频实际播放（本页为口型模拟）',exit:'播放结束 / 用户打断 / 取消'},
 confirm:{name:'待确认',en:'AWAITING CONFIRMATION',group:'任务',frame:0,duration:0,title:'请核对这条记录',copy:'示例：瓶喂 · 90 mL · 10:30。尚未保存。',motion:'恢复中性并静止，不催促、不索求关注。',trigger:'记录草稿可供核对',exit:'用户明确保存 / 修改 / 取消'},
 saving:{name:'保存中',en:'SAVING',group:'任务',frame:1,duration:400,title:'正在保存记录',copy:'模拟提交中 · 请勿重复提交',motion:'轻微压低后回稳一次，保持专注。',trigger:'提交请求已开始',exit:'保存确认 / 执行失败 / 离线'},
 success:{name:'保存成功',en:'ENTRY SAVED',group:'任务',frame:0,duration:1250,title:'记录已保存',copy:'模拟保存成功。稍后仍可修改。',motion:'短暂浅笑与一次轻抬，约 1.2 秒恢复中性。',trigger:'收到真实保存确认（本页模拟）',exit:'反馈结束后表情复位；状态文字保留',tone:'success'},
 result:{name:'结果就绪',en:'RESULT READY',group:'任务',frame:0,duration:240,title:'这次结果已准备好',copy:'就绪只代表分析完成，不代表健康正常。',motion:'平稳回到中性；不微笑、不庆祝、不点头。',trigger:'分析返回可展示结果',exit:'查看结果 / 主动播放说明 / 新任务'},
 indeterminate:{name:'无法判断',en:'INDETERMINATE',group:'恢复',frame:0,duration:0,title:'暂时无法从这段内容得出结论',copy:'可以重新采集，或先结束本次任务。',motion:'保持中性，不皱眉、摇头或表现失望。',trigger:'任务返回无法判断',exit:'重新采集 / 结束'},
 error:{name:'保存失败',en:'SAVE FAILED',group:'恢复',frame:0,duration:0,title:'这次未能保存',copy:'本次演示的记录仍保留，可以重试。',motion:'终止当前动作，保持稳定；用文字解释问题。',trigger:'明确收到执行失败',exit:'用户重试 / 修改 / 取消',tone:'error'},
 offline:{name:'离线',en:'OFFLINE',group:'恢复',frame:0,duration:0,title:'连接暂时中断',copy:'示例草稿仍在；联网后由你决定是否重试。',motion:'中性静止；不自动重试、不显示成功表情。',trigger:'网络连接不可用（本页模拟）',exit:'恢复连接并重试 / 取消',tone:'error'},
 permission:{name:'权限未开启',en:'PERMISSION NEEDED',group:'恢复',frame:0,duration:0,title:'需要麦克风权限才能收音',copy:'本页仅模拟权限流程，不申请系统权限。',motion:'保持中性；权限说明独立于角色表情。',trigger:'收音需要权限且尚未获准',exit:'允许 / 暂不启用'},
 timeout:{name:'处理超时',en:'TIMED OUT',group:'恢复',frame:0,duration:0,title:'这次处理比预期更久',copy:'可以重新尝试，也可以结束本次任务。',motion:'停止处理动作，恢复中性；不假装继续推进。',trigger:'超过业务约定时限（本页模拟）',exit:'重试 / 取消',tone:'error'},
 interrupted:{name:'已打断',en:'INTERRUPTED',group:'恢复',frame:0,duration:0,title:'已停止播报',copy:'结果仍保留。你可以重新播报或结束。',motion:'口型立即停止，恢复中性，不播放收尾动作。',trigger:'用户打断播报',exit:'重新播报 / 结束'},
 cancelled:{name:'已取消',en:'CANCELLED',group:'恢复',frame:0,duration:0,title:'本次任务已取消',copy:'旧任务的延迟结果不会触发完成反馈。',motion:'立即终止当前动作，恢复中性，不挽留。',trigger:'用户取消当前任务',exit:'用户重新开始'},
};
export const FLOWS = {
 record:{name:'记录与保存',steps:[{state:'listening',ms:2200},{state:'processing',ms:2000},{state:'confirm',gate:'确认并模拟保存'},{state:'saving',ms:1600},{state:'success'}]},
 recovery:{name:'保存失败后重试',steps:[{state:'confirm',gate:'确认并模拟保存'},{state:'saving',ms:1800},{state:'error',gate:'重试保存'},{state:'saving',ms:1600},{state:'success'}]},
 analysis:{name:'分析与播报',steps:[{state:'listening',ms:2200},{state:'processing',ms:2200},{state:'result',gate:'播放说明（口型模拟）'},{state:'speaking',ms:6000},{state:'result'}]},
 uncertain:{name:'无法判断后重新采集',steps:[{state:'processing',ms:2400},{state:'indeterminate',gate:'重新采集'},{state:'listening',ms:2000},{state:'processing',ms:1800},{state:'result'}]},
 offline:{name:'离线恢复',steps:[{state:'saving',ms:1800},{state:'offline',gate:'模拟恢复连接并重试'},{state:'saving',ms:1600},{state:'success'}]},
 permission:{name:'权限与收音',steps:[{state:'permission',gate:'模拟允许麦克风'},{state:'listening',ms:2400},{state:'processing',ms:1800},{state:'result'}]},
 timeout:{name:'超时恢复',steps:[{state:'processing',ms:2600},{state:'timeout',gate:'重试分析'},{state:'processing',ms:1600},{state:'result'}]},
};
export class SequencePlayer {
 constructor(emit,clock={now:()=>performance.now(),set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id)}){this.emit=emit;this.clock=clock;this.epoch=0;this.rev=0;this.timer=null;this.snapshot={state:'ready',phase:'manual',name:'单状态预览',index:0,total:0,rev:0,gate:null};}
 clear(){this.epoch++;if(this.timer!==null)this.clock.clear(this.timer);this.timer=null;}
 publish(values,entry=false){this.snapshot={...this.snapshot,...values,...(entry?{rev:++this.rev}:{})};this.emit(this.snapshot);}
 start(flow){this.clear();this.steps=flow.steps;this.name=flow.name;this.enter(0);}
 enter(index){this.clear();this.index=index;const step=this.steps[index];this.remaining=step.ms||0;this.publish({state:step.state,phase:step.gate?'waiting':step.ms?'playing':'done',name:this.name,index,total:this.steps.length,gate:step.gate||null},true);if(step.ms)this.arm();}
 arm(){const epoch=this.epoch;this.started=this.clock.now();this.timer=this.clock.set(()=>{if(epoch!==this.epoch)return;this.timer=null;if(this.index+1<this.steps.length)this.enter(this.index+1);else this.publish({phase:'done'});},this.remaining);}
 pause(){if(this.snapshot.phase!=='playing')return;this.remaining=Math.max(0,this.remaining-(this.clock.now()-this.started));this.clear();this.publish({phase:'paused'});}
 resume(){if(this.snapshot.phase!=='paused')return;this.publish({phase:'playing'});this.arm();}
 next(){if(this.snapshot.phase!=='waiting')return;if(this.index+1<this.steps.length)this.enter(this.index+1);}
 finishListening(){if(this.snapshot.state!=='listening'||!['playing','paused'].includes(this.snapshot.phase))return;if(this.index+1<this.steps.length)this.enter(this.index+1);}
 manual(state){if(!STATES[state])return;this.clear();this.steps=[];this.publish({state,phase:'manual',name:'单状态预览',index:0,total:0,gate:null},true);}
 cancel(){this.manual('cancelled');}
 dispose(){this.clear();}
}
export function poseAt(state,elapsed,reduced=false){const definition=STATES[state];let frame=definition.frame,dx=0,dy=0,rotate=0,sx=1,sy=1;if(reduced)return{frame,dx,dy,rotate,sx,sy};const pulse=duration=>elapsed<duration?Math.sin(Math.PI*elapsed/duration):0;
 if(state==='listening'){frame=elapsed<115?2:1;const p=pulse(480);rotate=-1.2*p;sx=1+.014*p;}
 if(state==='processing'){const p=pulse(520);sy=1-.015*p;sx=1+.008*p;}
 if(state==='saving'){const p=pulse(400);sy=1-.012*p;dy=2*p;}
 if(state==='success'){frame=elapsed<1100?3:0;const p=pulse(560);dy=-4*p;sx=1+.015*p;sy=1+.01*p;}
 if(state==='speaking')frame=[4,0,5,4,0,5,0,0][Math.floor(elapsed/160)%8];
 return{frame,dx,dy,rotate,sx,sy};}
