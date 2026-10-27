from pathlib import Path
p=Path('tests/home-media.cjs');s=p.read_text(encoding='utf-8')
s=s.replace('#welcome>div:not(.mascot-wrap)', '#welcome>div:not(.mascot-wrap):not(#today-wrap)')
s=s.replace("await click('close-panel');", "await p.locator('#panel-back').click();")
s=s.replace("await p.locator('.observation-chips details').nth(2).locator('summary').click();await p.locator('#photo-note').fill('今天观察到颜色变化');", "ok('photo extra observations removed',await p.locator('.photo-observations').count()===0);")
s=s.replace("ok('photo observation retained',(await p.locator('.structured-analysis').innerText()).includes('今天观察到颜色变化'));",'')
p.write_text(s,encoding='utf-8')
