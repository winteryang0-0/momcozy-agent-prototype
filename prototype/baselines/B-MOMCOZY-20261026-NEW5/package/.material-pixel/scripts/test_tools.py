#!/usr/bin/env python3
import json,tempfile,unittest
from pathlib import Path
from bind_project import bind
from audit_project import audit
class ToolsTest(unittest.TestCase):
    def test_binding_and_gate(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);(root/'AGENTS.md').write_text('Keep existing rules\n')
            bind(root);before=(root/'AGENTS.md').read_text();bind(root)
            self.assertEqual(before,(root/'AGENTS.md').read_text());self.assertIn('Keep existing rules',before)
            errors,_=audit(root);self.assertTrue(errors)
            manifest=root/'.material-pixel/coverage.json';data=json.loads(manifest.read_text())
            data['platform']='web';data['dependencies']={'runtime':'test fixture only'}
            (root/'fixture.txt').write_text('TEST FIXTURE: not actual UI evidence')
            for category in ['components','processes','os_surfaces']:
                for row in data[category]:row.update(status='not-used',reason='Synthetic checker fixture')
            for row in data['tests']:row.update(status='pass',command='synthetic fixture',evidence='fixture.txt')
            manifest.write_text(json.dumps(data));self.assertEqual(audit(root)[0],[])
            data['tests'][0]['evidence']='../outside.txt';manifest.write_text(json.dumps(data));self.assertTrue(audit(root)[0])
            data['components'].append(data['components'][0]);manifest.write_text(json.dumps(data));self.assertTrue(audit(root)[0])
    def test_bad_contract_has_no_side_effect(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);(root/'AGENTS.md').write_text('<!-- material-pixel:start -->')
            with self.assertRaises(ValueError):bind(root)
            self.assertFalse((root/'.material-pixel').exists())
    def test_reversed_duplicate_empty_contracts(self):
        for content in ['<!-- material-pixel:end --><!-- material-pixel:start -->', '<!-- material-pixel:start --><!-- material-pixel:end -->'*2, '<!-- material-pixel:start --><!-- material-pixel:end -->']:
            with tempfile.TemporaryDirectory() as temp:
                root=Path(temp);(root/'AGENTS.md').write_text(content)
                with self.assertRaises(ValueError):bind(root)
                self.assertFalse((root/'.material-pixel').exists())
    def test_palette_contrast(self):
        def lum(h):
            v=[int(h[i:i+2],16)/255 for i in (1,3,5)];v=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v]
            return sum(x*y for x,y in zip(v,[.2126,.7152,.0722]))
        data=json.loads((Path(__file__).resolve().parent.parent/'assets/tokens.json').read_text())
        for theme,roles in data['colors'].items():
            for base in ['primary','primary-container','secondary','secondary-container','tertiary','tertiary-container','error','error-container','surface']:
                a,b=sorted([lum(roles[base]),lum(roles['on-'+base])]);self.assertGreaterEqual((b+.05)/(a+.05),4.5,(theme,base))
if __name__=='__main__':unittest.main()
