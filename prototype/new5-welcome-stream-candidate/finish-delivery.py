from pathlib import Path
import json, hashlib
p=Path('assets/conversation.js')
s=p.read_text(encoding='utf-8').replace('${dailyVisual(facts)}${RecordViews.schedule','${RecordViews.schedule')
p.write_text(s,encoding='utf-8')
p=Path('assets/record-refinement.css')
s=p.read_text(encoding='utf-8')
s+='''
/* Keep the daily timeline as the primary view. */
#app[data-route="records"] .daily-advice{background:#dff5ef;border:0;border-radius:28px;padding:18px 20px;margin-bottom:12px}
#app[data-route="records"] .daily-advice h2{font-size:19px;margin:6px 0}
#app[data-route="records"] .daily-advice p{font-size:14px;line-height:1.6;margin:6px 0}
#app[data-route="records"] .daily-advice .actions{display:none}
#app[data-route="records"] .daily-schedule .filters{display:none}
#app[data-route="records"] #native-page{padding-bottom:120px}
'''
p.write_text(s,encoding='utf-8')
p=Path('.material-pixel/coverage.json');d=json.loads(p.read_text(encoding='utf-8'))
d['dependencies']['icons']='User v0.3 raster icon board crops in SVG wrappers; vector navigation fallbacks'
d['record_refinement_20261027']={'status':'local-candidate','source':'User reference images and comments; existing blue baseline','implementation':['assets/record-refinement.css','assets/record-refinement.js','assets/icons.js','assets/conversation.js','assets/home-media.js','assets/record-views.js'],'evidence':['review/record-refinement/regression.json','review/home-media/results.json','review/record-refinement/README.md'],'limitations':['Raster concept icons, not individual production vectors','Mock microphone/analysis regression is not live service validation','No design freeze or Material conformance certification']}
p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
