// One-time migration script; current authoritative sources are build.cjs, document.cjs and bundle/assets/app.js.
// Generates FW-0.2 from its own copied FW-0.1 sources; never modifies FW-0.1.
const fs=require('node:fs'),path=require('node:path');
const root=__dirname;
if(fs.readFileSync(path.join(root,'build.cjs'),'utf8').includes('const overviewSpecs='))throw new Error('Migration already applied; run build.cjs and document.cjs only.');
const put=(p,v)=>fs.writeFileSync(path.join(root,p),v);
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const old='FW-0.1';
let build=read('build.cjs').replaceAll(old,'FW-0.2');
const drawerCode=String.raw`
current='PAGE-chat';
const drawer=state('ST-sidebar-open','other',
 '<dialog id="sidebar" class="sidebar" aria-labelledby="sidebar-title"><header class="dialog-head"><h2 id="sidebar-title">Momcozy AI</h2>'+b('C01-close','×','sidebar-close','text-button')+'</header><nav aria-label="侧边导航">'+b('C01.1','我的','sidebar-go:mine','sidebar-link')+b('C01.2','宝宝','sidebar-go:baby','sidebar-link')+b('C01.3','设备','sidebar-go:devices','sidebar-link')+'</nav></dialog>');
const chatEnd=html.lastIndexOf('</div></section>');html=html.slice(0,chatEnd)+drawer+html.slice(chatEnd);
`;
build=build.replace("const types=[['breast'",drawerCode+"\nconst types=[['breast'");
const pagesCode=String.raw`
const overviewSpecs=[
 {key:'mine',req:'C01.1',title:'我的',heading:'妈妈信息',description:'记录自己的变化，也照顾好自己。',label:'今日泵奶记录',value:'360 ml',note:'近 7 天平均 · 328 ml',entries:[['trend','奶量趋势','按天查看泵奶记录','具体图表、列表与日期筛选尚未提供。'],['body','身体与状态','回看最近的状态记录','具体字段、记录来源与详情尚未提供。']]},
 {key:'baby',req:'C01.2',title:'宝宝',heading:'宝宝信息',description:'<span id="baby-context">宝宝 · 年龄待完善</span>',label:'今日记录',value:'4 次喂养',note:'最近一次 · 14:20，120 ml',entries:[['feeding','喂养与睡眠','今天 4 次喂养 · 2 次小睡','具体记录列表、睡眠录入与汇总规则尚未提供。'],['growth','生长发育','查看最近的身长与体重变化','身长、体重的录入与展示方式尚未提供。']]},
 {key:'devices',req:'C01.3',title:'设备',heading:'设备',description:'查看设备及最近同步的记录。',label:'Momcozy 吸奶器',value:'未连接',note:'最近同步 · 昨日 20:30',entries:[['device-info','设备信息','型号、连接状态与最近同步','具体详情和连接管理操作尚未提供。'],['sync','同步记录','查看已保存的泵奶记录','具体记录列表、筛选及同步过程尚未提供。']]}
];
for(const spec of overviewSpecs){
 current='PAGE-'+spec.key;
 const rows=spec.entries.map((entry,i)=>b(spec.req+'.'+(i+1),'<span><strong>'+entry[1]+'</strong><small>'+entry[2]+'</small></span><span aria-hidden="true">›</span>','overview-detail:'+entry[0],'overview-row')).join('');
 const dialogs=spec.entries.map((entry,i)=>state('ST-'+entry[0]+'-scope','other','<dialog id="detail-'+entry[0]+'" class="scope-dialog" aria-labelledby="title-'+entry[0]+'"><div class="eyebrow">框架范围说明</div><h2 id="title-'+entry[0]+'">'+entry[1]+'</h2><p>'+entry[2]+'</p><p class="notice">此入口已录入，目标界面尚未展示。</p><p>'+entry[3]+'</p>'+b(spec.req+'.'+(i+1)+'-close','返回'+spec.title,'detail-close','secondary')+'</dialog>')).join('');
 const body='<header class="overview-header">'+b(spec.req+'-back','返回侧边栏','overview-back','text-button')+'<strong>'+spec.title+'</strong><span aria-hidden="true"></span></header>'+state('ST-'+spec.key,'normal','<p class="fine overview-disclaimer">演示数据，未与账号同步</p><h1 tabindex="-1">'+spec.heading+'</h1><p class="muted">'+spec.description+'</p><article class="overview-summary"><div class="fine">'+spec.label+'</div><strong>'+spec.value+'</strong><p>'+spec.note+'</p><div class="fine">固定示例，未与本地新记录联动</div></article><p class="fine">查看信息</p><div class="overview-links">'+rows+'</div>')+dialogs;
 html+=p(current,'#/'+spec.key,spec.title,body,'PAGE-chat');
}
`;
build=build.replace('const tokens=',pagesCode+'\nconst tokens=');
build=build.replace("${b('C01','☰','menu','icon')}","${b('C01','<span aria-hidden=\"true\">☰</span><span class=\"sr-only\">打开侧边栏</span>','menu','icon')}");
build=build.replace('<button data-action="scope">04　范围、来源与待决</button>','<button data-action="review-sidebar">04　侧边栏与对象概览</button><button data-action="review:identity">05　回看已录入背景</button><button data-action="scope">06　范围、来源与待决</button>');
build=build.replace('原始页面职责、字段、三个快捷入口及任务卡片承载方式。','原始页面职责、字段、三个快捷入口、任务卡片，以及侧边栏与三个对象概览。');
build += String.raw`
fs.appendFileSync(path.join(bundle,'assets/styles.css'),
 '\n.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.overview-header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin-bottom:32px}.overview-header button{justify-self:start;font-size:var(--small);padding-left:0}.overview-disclaimer{margin-top:28px}.overview-summary{padding:20px;border:1px solid var(--line);border-radius:var(--radius-lg);margin:28px 0 24px}.overview-summary>strong{display:block;font-size:var(--title);margin:4px 0}.overview-summary>p{font-size:var(--small);color:var(--muted);margin:4px 0 12px}.overview-links{display:grid;gap:12px}.overview-row{display:flex;align-items:center;justify-content:space-between;text-align:left;gap:12px;width:100%;padding:16px}.overview-row small{display:block;color:var(--muted);font-size:var(--small);font-weight:400;margin-top:4px}.sidebar{position:fixed;inset:auto;margin:0;max-width:none;max-height:none;border-radius:var(--radius-lg) 0 0 var(--radius-lg);padding:20px}.sidebar nav{display:grid;margin:20px 0;gap:8px}.sidebar .sidebar-link{padding:14px;border:1px solid transparent;min-height:52px}.sidebar .sidebar-link[aria-current="page"]{background:var(--bg);color:var(--brand);border-color:var(--line)}.sidebar::backdrop{background:#28272566}.scope-dialog h2{font-size:var(--title)}.scope-dialog button{width:100%}\n');
`;
put('build.cjs',build);

let app=read('bundle/assets/app.js');
app=app.replace("KEY='momcozy-framework-fw01'","KEY='momcozy-framework-fw02'");
app=app.replace("chat:'主对话',","chat:'主对话',mine:'我的',baby:'宝宝',devices:'设备',");
app=app.replace("lastFocus=null;","lastFocus=null;let sidebarReturn=false,sidebarScroll=0,sidebarSelected='',sidebarOpener=null,detailOpener=null;");
app=app.replace("function showRoute(){capture();", "function showRoute(){if(route==='chat'&&location.hash!=='#/chat'&&!$('#sidebar').open)sidebarScroll=window.scrollY;capture();");
app=app.replace("window.scrollTo(0,0);}","if(route==='chat'&&sidebarReturn){sidebarReturn=false;window.scrollTo(0,sidebarScroll);openSidebar(false);}else window.scrollTo(0,0);}");
app=app.replace("'身份＋5步引导。只还原已提供的产后路径，返回保留输入。'","['mine','baby','devices'].includes(route)?'对象概览：信息摘要与两个下级入口；目标界面未提供的入口展示范围说明。返回恢复侧边栏，再关闭恢复对话。':'身份＋5步引导。只还原已提供的产后路径，返回保留输入。'");
app=app.replace("$('.record-baby').forEach", ()=>"$('#baby-context').textContent=d!==null&&d>=0?$('#stage-context').textContent:'宝宝 · 年龄待完善';\n $$('.record-baby').forEach");
const funcs=String.raw`
function positionSidebar(){const r=$('.device').getBoundingClientRect();const el=$('#sidebar');const top=Math.max(12,r.top);el.style.left=Math.max(0,r.left)+'px';el.style.top=top+'px';el.style.width=Math.min(350,r.width*.85)+'px';el.style.height=Math.min(Math.max(300,r.height),window.innerHeight-top-12)+'px';}
function openSidebar(remember=true){capture();if(remember){sidebarScroll=window.scrollY;sidebarOpener=document.activeElement;}const el=$('#sidebar');el.querySelectorAll('[data-action^="sidebar-go:"]').forEach(b=>{if(b.dataset.action==='sidebar-go:'+sidebarSelected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});positionSidebar();if(!el.open)el.showModal();$('[data-control-id="C01-close"]').setAttribute('aria-label','关闭侧边栏');$('[data-control-id="C01-close"]').focus();}
function closeSidebar(){if($('#sidebar').open)$('#sidebar').close();window.scrollTo(0,sidebarScroll);if(sidebarOpener?.isConnected&&sidebarOpener.getClientRects().length)sidebarOpener.focus({preventScroll:true});else $('[data-control-id="C01"]').focus({preventScroll:true});}
function backToSidebar(){sidebarReturn=true;go('chat');}
function closeDetail(){const d=$('.scope-dialog[open]');if(d)d.close();if(detailOpener?.isConnected)detailOpener.focus({preventScroll:true});}
`;
app=app.replace('function recordMenu(){',funcs+'\nfunction recordMenu(){');
const menuStart=app.indexOf("else if(action==='menu')");const menuEnd=app.indexOf("else if(action==='sound')",menuStart);
if(menuStart<0||menuEnd<0)throw Error('menu replacement missing');
app=app.slice(0,menuStart)+`else if(action==='menu')openSidebar();else if(action==='sidebar-close')closeSidebar();else if(action==='sidebar-go'){sidebarSelected=arg;$('#sidebar').close();go(arg);}else if(action==='overview-back')backToSidebar();else if(action==='overview-detail'){detailOpener=button;$('#detail-'+arg).showModal();}else if(action==='detail-close')closeDetail();else if(action==='review-sidebar'){if(route==='chat')openSidebar();else{sidebarReturn=true;go('chat');}}`+app.slice(menuEnd);
app=app.replace('的 17 张截图与拆解','的 21 张截图与拆解');
app=app.replace('保留 C01–C15、C09.1–C09.5 编号。','保留 C01–C15、C09.1–C09.5，补充 C01.1–C01.3 及六个下级入口编号。');
app=app.replace('备孕与孕期分支、侧菜单完整内容、多宝宝分档','六个下级入口的未提供目标界面、备孕与孕期分支、多宝宝分档');
app=app.replace("window.addEventListener('hashchange',showRoute);",()=>`$('#sidebar').addEventListener('cancel',e=>{e.preventDefault();closeSidebar()});$('#sidebar').addEventListener('click',e=>{if(e.target!==$('#sidebar'))return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSidebar()});$$('.scope-dialog').forEach(d=>d.addEventListener('cancel',e=>{e.preventDefault();closeDetail()}));window.addEventListener('resize',()=>{if($('#sidebar').open)positionSidebar()});window.addEventListener('hashchange',()=>{if($('#sidebar').open)$('#sidebar').close();$$('.scope-dialog[open]').forEach(d=>d.close());showRoute()});`);
put('bundle/assets/app.js',app);
let doc=read('document.cjs').replaceAll('FW-0.1','FW-0.2').replaceAll('fw01','fw02').replaceAll('4173','4175');
doc=doc.replace("...seed.types.map(x=>x[2])];","...seed.types.map(x=>x[2]),'C01.1','C01.2','C01.3','C01.1.1','C01.1.2','C01.2.1','C01.2.2','C01.3.1','C01.3.2'];");
doc=doc.replace("[['menu','C01'],['sound'","[['sound'");
const flowsCode=String.raw`
flow('FLOW-sidebar',['C01'],[action('ACT-sidebar-open','C01','ST-chat','ST-sidebar-open'),action('ACT-sidebar-close','C01-close','ST-sidebar-open','ST-chat')],['ST-chat','ST-sidebar-open'],['聊天填写草稿并打开侧栏','关闭按钮、Esc和遮罩分别退出','重新进入侧栏'], '保持聊天输入、滚动位置和任务状态，焦点恢复菜单入口');
for(const [key,req,leaves] of [['mine','C01.1',['trend','body']],['baby','C01.2',['feeding','growth']],['devices','C01.3',['device-info','sync']]]){
 flow('FLOW-'+key,['C01',req],[action('ACT-open-'+key,req,'ST-sidebar-open','ST-'+key),action('ACT-return-'+key,req+'-back','ST-'+key,'ST-sidebar-open')],['ST-sidebar-open','ST-'+key],['侧栏进入 '+key,'检查固定示例及说明','返回侧栏，再关闭恢复聊天'], '导航关闭抽屉进入概览；返回恢复选中项，数据非真实同步');
 leaves.forEach((leaf,i)=>flow('FLOW-'+leaf,[req+'.'+(i+1)],[action('ACT-open-'+leaf,req+'.'+(i+1),'ST-'+key,'ST-'+leaf+'-scope'),action('ACT-close-'+leaf,req+'.'+(i+1)+'-close','ST-'+leaf+'-scope','ST-'+key)],['ST-'+key,'ST-'+leaf+'-scope'],['点击下级入口 '+leaf,'阅读未提供范围，按钮或Esc返回'], '保持概览页与焦点；不虚构目标界面、不执行连接或同步'));
}
`;
doc=doc.replace("const source='sources/requirements-thread.json';",flowsCode+"\nconst source='sources/requirements-v02.json';");
doc=doc.replace('framework:{revision:1','framework:{revision:2');
doc=doc.replace('菜单、声音、图片、语音、更多：恢复已展示入口。无来源内容用边界说明；不新增完整菜单体系。','主对话 → C01侧抽屉 → 我的 / 宝宝 / 设备三个对象概览 → 各两个下级功能入口（目标界面未提供，以范围说明弹层表示）。\\n概览返回 → 恢复侧抽屉及选中项 → 关闭恢复原对话草稿、任务与位置。\\n声音、图片、语音、更多：保持已展示入口。');
doc=doc.replace('完整侧菜单、多宝宝独立档案、账号/家庭共享、商城/设备','六个下级入口目标界面、多宝宝独立档案、账号/家庭共享、商城/设备绑定');
doc=doc.replace('原始需求聊天及17张截图','原始需求聊天及新增侧栏拆解，共21张截图');
doc=doc.replace('移动端通过菜单回看背景','移动端侧栏进入我的、宝宝与设备概览；回看引导可通过审阅导航或直接打开#/identity');
doc=doc.replace('本版12个页面和43个静态状态标记','本版15个页面和53个静态状态标记');
put('document.cjs',doc);
put('preview.cjs',read('preview.cjs').replaceAll('4173','4175'));
put('check_candidate.py',read('check_candidate.py').replaceAll('FW-0.1','FW-0.2'));
put('sources/requirements-v02.json',JSON.stringify({previous:JSON.parse(read('sources/requirements-thread.json')),sidebar_addition:JSON.parse(read('sources/sidebar-requirements.json')),change_authorization:'用户：请注意我的需求拆解里面已经加入了侧边栏展开的页面和下级页面，框架上将这部分补充进来'},null,2));
console.log('FW-0.2 sources extended. Run build.cjs then document.cjs.');
