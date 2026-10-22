'use strict';
// Final revision 14: profile fixes and semantic onboarding icons.
// Apply only after all exact anchors match; no partial writes on failure.
const fs=require('node:fs');
const vm=require('node:vm');
const replacements=[
  {
    "name": "role semantic icons",
    "before": "icon(v==='妈妈'?'heart':v==='爸爸'?'user':'user')",
    "after": "icon(({妈妈:'mom',爸爸:'dad','爷爷/奶奶':'grandparents','外公/外婆':'grandparents','其他成员':'family'})[v])"
  },
  {
    "name": "concern semantic icons",
    "before": "(d.concerns.includes(c)?icon('check'):icon(i<6?'baby':'heart'))+'<span>'+c+'</span></button>'",
    "after": "icon(['bottle','baby-satisfied','waveform','diaper','moon','growth','recovery','emotion','rest'][i])+'<span>'+c+'</span>'+(d.concerns.includes(c)?icon('check','choice-check'):'')+'</button>'"
  },
  {
    "name": "mother heading icon",
    "before": "profile-compact\"><h3>'+icon('heart')+'妈妈信息",
    "after": "profile-compact\"><h3>'+icon('mom')+'妈妈信息"
  },
  {
    "name": "birthday optional common max",
    "before": "field('出生日期','birth','date',profiles.birth,'required max=\"'+DAY+'\"')",
    "after": "field('出生日期 · 选填','birth','date',profiles.birth,'max=\"'+profileToday()+'\"')"
  },
  {
    "name": "empty mother stage preserved",
    "before": "selectField('当前阶段','momStage',['孕前','孕期','产后'],profiles.momStage)",
    "after": "'<label><span>当前阶段 · 选填</span><select name=\"momStage\"><option value=\"\" '+(!CARE_STAGES.includes(profiles.momStage)?'selected':'')+'>暂不填写</option>'+CARE_STAGES.map(stage=>'<option value=\"'+stage+'\" '+(stage===profiles.momStage?'selected':'')+'>'+stage+'</option>').join('')+'</select></label>'"
  },
  {
    "name": "legacy profile preserve babies and optional clear",
    "before": "if(d.birth&&profiles.babies?.length)profiles.babies[0].birth=d.birth;if(d.momStage&&d.momStage!=='产后'){profiles.birth='';profiles.birthWeeks='';profiles.babies=[];}",
    "after": "if(Object.prototype.hasOwnProperty.call(d,'birth')){profiles.babies=structuredClone(profiles.babies?.length?profiles.babies:[{birth:'',weeks:profiles.birthWeeks||''}]);profiles.babies[0].birth=d.birth;}"
  },
  {
    "name": "allow navigating to invalid hidden baby",
    "before": "if(b.dataset.onboardingBaby!==undefined){if(!validateOnboarding())return;onboarding.draft.activeBaby=Number(b.dataset.onboardingBaby);",
    "after": "if(b.dataset.onboardingBaby!==undefined){readOnboardingFields();onboarding.draft.activeBaby=Number(b.dataset.onboardingBaby);"
  },
  {
    "name": "validate every baby being saved",
    "before": "function validateOnboarding(){\n readOnboardingFields();const d=onboarding.draft;\n if(onboarding.step===0&&!CARE_ROLES.includes(d.role)){$('#onboarding-error').textContent='请选择照护身份，也可选择稍后设置。';return false;}\n const invalid=[...$('#onboarding-form').querySelectorAll('input,select')].find(el=>!el.checkValidity());\n if(invalid){$('#onboarding-error').textContent=invalid.type==='date'?'请填写有效的出生日期，不能晚于今天。':'请填写范围内的整数；不确定时可留空。';invalid.focus();return false;}return true;\n}\n",
    "after": "function onboardingBabiesToSave(d){\n const stage=d.role==='妈妈'?d.stage:'',post=!['孕前','孕期'].includes(stage);\n if(post||onboarding.dateRepair)return Array.from({length:Number(d.babyCount)||1},(_,i)=>({...{birth:'',weeks:''},...d.babies[i]}));\n return structuredClone(profiles.babies?.length?profiles.babies:(profiles.birth?[{birth:profiles.birth,weeks:profiles.birthWeeks||''}]:[]));\n}\nfunction validProfileBirth(birth){\n if(!birth)return true;if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(birth)||birth>profileToday())return false;\n const parsed=new Date(birth+'T12:00:00Z');return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===birth;\n}\nfunction validateOnboarding(){\n readOnboardingFields();const d=onboarding.draft;\n if(onboarding.step===0&&!CARE_ROLES.includes(d.role)){$('#onboarding-error').textContent='请选择照护身份，也可选择稍后设置。';return false;}\n const invalid=[...$('#onboarding-form').querySelectorAll('input,select')].find(el=>!el.checkValidity());\n if(invalid){$('#onboarding-error').textContent=invalid.type==='date'?'请填写有效的出生日期，不能晚于今天。':'请填写范围内的整数；不确定时可留空。';invalid.focus();return false;}\n if(onboarding.step===1||onboarding.step===3){\n  const babies=onboardingBabiesToSave(d),bad=babies.findIndex(b=>!validProfileBirth(b.birth));\n  if(bad>=0){\n   if(['孕前','孕期'].includes(d.role==='妈妈'?d.stage:'')){onboarding.dateRepair=true;d.babies=babies;d.babyCount=babies.length;}\n   onboarding.step=1;d.activeBaby=bad;storeOnboarding();renderOnboarding();\n   $('#onboarding-error').textContent='请检查宝宝 '+(bad+1)+' 的出生日期，不能晚于今天；也可以暂不填写。';\n   const input=$('[name=\"baby-'+bad+'-birth\"]');if(input){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby','onboarding-error');input.focus();}return false;\n  }\n }\n return true;\n}\n"
  },
  {
    "name": "repair preserved invalid birthday without changing selected stage",
    "before": "stage=d.role==='妈妈'?d.stage:'',step=onboarding.step,body=",
    "after": "stage=onboarding.dateRepair&&onboarding.step===1?'':d.role==='妈妈'?d.stage:'',step=onboarding.step,body="
  },
  {
    "name": "date repair explanation",
    "before": "content='<p class=\"onboarding-intro wheel-hint\">上下滑动选择 · 滚轮首项可暂不填</p>",
    "after": "content=(onboarding.dateRepair?'<p class=\"status-note\">先修正已有宝宝的出生日期，不会改变你选择的妈妈阶段。</p>':'')+'<p class=\"onboarding-intro wheel-hint\">上下滑动选择 · 滚轮首项可暂不填</p>"
  },
  {
    "name": "finish validates independently",
    "before": "function finishOnboarding(){\n const d=",
    "after": "function finishOnboarding(){\n if(!validateOnboarding())return;\n const d="
  },
  {
    "name": "preserve prior baby data on stage changes",
    "before": "const babies=post?Array.from({length:count||1},(_,i)=>({...{birth:'',weeks:''},...d.babies[i]})):[];",
    "after": "const babies=onboardingBabiesToSave(d);"
  },
  {
    "name": "preserve first baby and count on hidden stages",
    "before": "babyCount:stage==='孕前'?null:count,babies,birth:post?babies[0].birth:'',birthWeeks:post?babies[0].weeks:''",
    "after": "babyCount:post?count:babies.length||count,babies,birth:babies[0]?.birth||'',birthWeeks:babies[0]?.weeks||''"
  },
  {
    "name": "reset temporary repair flag after save",
    "before": "onboarding.draft=ok?null:d;const onboardingOk=storeOnboarding();",
    "after": "onboarding.draft=ok?null:d;if(ok)delete onboarding.dateRepair;const onboardingOk=storeOnboarding();"
  }
];
function patchProfile(source){let next=source;for(const r of replacements){if(next.split(r.before).length!==2)throw new Error('Profile patch anchor must match once: '+r.name);next=next.replace(r.before,r.after);}new vm.Script(next);return next;}
module.exports={patchProfile,replacements};
if(require.main===module){const path=process.argv[2];if(!path)throw new Error('Usage: node profile-patch.cjs <assets/app.js>');const next=patchProfile(fs.readFileSync(path,'utf8'));fs.writeFileSync(path,next);console.log('Applied '+replacements.length+' profile replacements');}
