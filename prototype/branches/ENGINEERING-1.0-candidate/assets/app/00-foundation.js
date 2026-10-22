/* Local keyword routing: opens existing demo flows, never records or captures automatically. */
const CARE_ACTIONS={record:{label:'记一笔',icon:'journal'},cry:{label:'听哭闹',icon:'waveform'},poop:{label:'看便便',icon:'diaper'}};
function detectCareIntents(text){
 const clauses=String(text).toLowerCase().split(/[，,。！!？?；;\n]|但是|不过|而是/).filter(c=>!/(不要|不用|不想|不需要|暂不|别|无需|取消|停止)/.test(c));
 const patterns={record:/记一笔|记一下|记录|记下|记个|喂养|喂奶|奶量|吸奶|亲喂|换尿布|\b(log|record|feeding)\b/,cry:/哭闹|哭声|哭了|一直哭|哭不停|听哭|\b(cry|crying)\b/,poop:/便便|大便|排便|便秘|腹泻|拉肚子|\b(poop|stool)\b/};
 return Object.keys(CARE_ACTIONS).filter(k=>clauses.some(c=>patterns[k].test(c)));
}

/* Local prototype. Care cards use browser media devices; automated care analysis is not connected. */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const safe=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const currentLocalTime=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
const NOW=currentLocalTime(),DAY=NOW.slice(0,10),KEY='momcozy-engineering-1.0';
const TYPES={'亲喂':'breast','配方奶':'formula','瓶喂母乳':'bottle','换尿布':'diaper','吸奶':'pump'};
/* Presentation-only category keys for the CS-0.5 task color path. */
const RECORD_CATEGORY={'亲喂':'feed','配方奶':'feed','瓶喂母乳':'feed','换尿布':'diaper'};
const recordCategory=type=>RECORD_CATEGORY[type]||'neutral';
const seed=[{id:'s1',type:'瓶喂母乳',owner:'宝宝',amount:120,time:DAY+'T14:20'},{id:'s2',type:'换尿布',owner:'宝宝',kind:'嘘嘘',rash:'无',time:DAY+'T13:50'},{id:'s3',type:'吸奶',owner:'妈妈',amount:120,time:DAY+'T13:00'},{id:'s4',type:'配方奶',owner:'宝宝',amount:80,time:DAY+'T11:40'},{id:'s5',type:'亲喂',owner:'宝宝',side:'左侧',duration:15,time:DAY+'T09:30'},{id:'s6',type:'吸奶',owner:'妈妈',amount:110,time:DAY+'T09:00'},{id:'s7',type:'瓶喂母乳',owner:'宝宝',amount:100,time:DAY+'T07:10'},{id:'s8',type:'吸奶',owner:'妈妈',amount:130,time:DAY+'T06:30'}].map(r=>({...r,sync:'示例',note:''}));
let saved;try{saved=JSON.parse(localStorage.getItem(KEY));}catch{}
let records=Array.isArray(saved?.records)?saved.records:[],profiles=saved?.profiles||{baby:'宝宝',birth:'',momStage:'',focus:''},prefs={theme:'light',platform:'ios',reduced:false,transparency:false,contrast:false,sound:false,...saved?.prefs};
let page='assistant',owner='宝宝',journalFilter='all',positions={},drafts={},formContext=null,saveJob=null,saveTimer=null,task=null,taskHistory=[],messages=[],attachment='',chatBusy=false,chatTimer,toastTimer,taskTimer,speechTimer,scenario='normal',analysisOutcome='indeterminate',homeMode='normal',deviceConnected=false,syncBusy=false,syncTimer,pausedByBackground=false;
let mediaSession=null,capturedMedia=null,mediaOperation=0,captureClock=null;
let adviceIndex=0,adviceExpanded=false,adviceTouchStart=null;
const sheet=$('#sheet'),sheetPanel=sheet.querySelector('.sheet-panel'),reducedMotionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
const sidebarLayer=$('#sidebar-layer'),sidebarPanel=$('#care-sidebar'),sidebarToggle=$('.main-menu-button');
let sidebarOpener=null,sidebarCloseTimer=null,mineReturnPage='assistant',babyReturnPage='assistant',recordsReturnPage='assistant',mineReturnAfterRecords=null,babyReturnAfterRecords=null;
let resetInProgress=false;const deletedRecordIds=new Set(saved?.deletedRecordIds||[]);const inlineSaveTimers=new Map();let taskTriggerRevision=0;

