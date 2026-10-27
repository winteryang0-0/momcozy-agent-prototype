/* Explicit mock boundary; no remote model is called. */
window.MediaAnalysis=(()=>{
function mockWait(signal){return new Promise((resolve,reject)=>{const done=()=>{signal.removeEventListener('abort',stop);resolve()},timer=setTimeout(done,3000),stop=()=>{clearTimeout(timer);reject(new DOMException('已停止','AbortError'))};signal.addEventListener('abort',stop,{once:true});if(signal.aborted)stop();});}
return {mode:'demo',async inspect(media,signal){if(signal.aborted)throw new DOMException('已停止','AbortError');if(!media.blob?.size)throw Error('文件为空，请重新选择。');if(media.kind==='image'){let bitmap;try{bitmap=await createImageBitmap(media.blob);if(!bitmap.width||!bitmap.height)throw Error('empty');}catch{throw Error('图片未能读取，请换一张图片。')}finally{bitmap?.close();}}await mockWait(signal);return {status:'insufficient',reason:'service-not-connected'};},async followup(signal){await mockWait(signal);return {status:'insufficient',reason:'service-not-connected'};}};
})();
