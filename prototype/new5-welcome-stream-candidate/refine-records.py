from pathlib import Path
import re,json
p=Path('assets/icons.js');s=p.read_text(encoding='utf-8');m=re.search(r'const COZIE_ICON_MAP=(\{.*?\});',s);mapping=json.loads(m[1])
for v in mapping.values():
 v[1]+=6;v[3]=70
s=s[:m.start(1)]+json.dumps(mapping)+s[m.end(1):];p.write_text(s,encoding='utf-8')
p=Path('assets/conversation.js');s=p.read_text(encoding='utf-8')
s=s.replace("if(draft){toast('先完成或取消当前记录。');scrollEnd();return}","if(draft){chat.recordDrafts={...(chat.recordDrafts||{}),[draft.type]:draft};draft=null;}")
s=s.replace("function renderDraft(){", "function renderDraft(){if(draft && (draft.needsFeedingType || CareEngine.absent(draft[CareEngine.fieldFor(draft.type)]))){$('#pending-task').innerHTML='';return;}")
s=s.replace('<p class="panel-copy">选择实际数值与时间，完成后点保存。关闭后可以继续填写。</p>','')
s=re.sub(r'<label class="field">宝宝<select name="babyId">.*?</select></label>', '<input type="hidden" name="babyId" value="${esc(d.babyId)}">',s,count=1)
s=s.replace("${opts.map(t=>`<button type=\"button\" data-action=\"type-chip\"", "${( ['瓶喂母乳','配方奶','亲喂'].includes(d.type)?['亲喂','瓶喂母乳','配方奶']:[]).map(t=>`<button type=\"button\" data-action=\"type-chip\"",1)
s=s.replace("if($('#panel-title'))$('#panel-title').textContent=['瓶喂母乳','配方奶','亲喂'].includes(type)?'喂奶':'核对这次记录';", "if($('#panel-title'))$('#panel-title').innerHTML='<span class=\"record-baby-heading\">'+babyAvatar(baby())+'<span>'+esc(baby().name)+'</span></span>';$('#panel').dataset.recordType=type;")
s=s.replace('<details class="stool-fields"><summary>便便特征与皮肤情况（可选）</summary>','<section class="stool-fields">').replace(".join('')}</details>`;else{const weight", ".join('')}</section>`;else{const weight")
s=s.replace("'more-record':b=>{closePanel();newDraft(b.dataset.type);if(b.dataset.type==='其他')showEdit()}","'more-record':b=>{closePanel();newDraft(b.dataset.type);showEdit()}")
s=s.replace('<details class="trend-totals"><summary>每日汇总</summary>','<section class="trend-totals"><h3>每日汇总</h3>').replace('</details>${historyCalendar()}','</section>')
p.write_text(s,encoding='utf-8')
p=Path('assets/ui-controls.js');s=p.read_text(encoding='utf-8')
s=s.replace("const exact=document.createElement('details');exact.className='exact-input';const sum=document.createElement('summary');sum.textContent='精确输入 / 超出刻度范围';exact.append(sum);", "const exact=document.createElement('div');exact.className='exact-input';exact.hidden=true;")
s=s.replace("exact.open=true;input.setAttribute('aria-invalid','true')", "box.setAttribute('aria-invalid','true');range.focus()")
s=s.replace("else output.textContent=input.value===''?'请选择':input.value+' '+c.unit;", "else output.innerHTML=sheetArt(panel.closest('#panel').dataset.recordType||'体重')+'<span>'+(input.value===''?'请选择':input.value)+'<small>'+c.unit+'</small></span>';")
s=s.replace("group.append(b)","if(select.name!=='stoolColor'){const n=select.name==='kind'?({'尿尿':'wet-diaper','便便':'dirty-diaper','都有':'mixed-diaper'})[o.value]:select.name==='stoolTexture'?'texture':select.name==='skin'?'baby':null;if(n)b.insertAdjacentHTML('afterbegin',icon(n))}group.append(b)")
p.write_text(s,encoding='utf-8')
p=Path('assets/record-views.js');s=p.read_text(encoding='utf-8');s=s.replace('<button class="primary" data-action="quick-edit" data-type="体重">${icon(\'plus\')}添加</button>','');s=s.replace("${!rows.length?'<p class=\"empty\">添加一次体重，开始记录变化</p>':''}",'');s=re.sub(r'\$\{useReference\?\'<details class="growth-info".*?</details>\':',"${useReference?'':",s);s=s.replace('<details><summary>查看每次记录（${rows.length}）</summary>${list}</details>','');p.write_text(s,encoding='utf-8')
