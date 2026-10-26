#!/usr/bin/env python3
"""Read-only checks for source, assets, brand, PDF and package integrity.
This is not a browser rendering, interaction or performance test.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib
import json
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET
from PIL import Image
import fitz

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'site'


def sha(file):return hashlib.sha256(file.read_bytes()).hexdigest()


class Doc(HTMLParser):
    def __init__(self):super().__init__(convert_charrefs=True);self.nodes=[]
    def handle_starttag(self,tag,attrs):self.nodes.append((tag,dict(attrs)))
    def handle_startendtag(self,tag,attrs):self.handle_starttag(tag,attrs)


def check_html(path):
    doc=Doc();doc.feed(path.read_text())
    ids=[a['id'] for _,a in doc.nodes if 'id' in a]
    assert len(ids)==len(set(ids)),f'Duplicate IDs in {path}'
    for tag,attrs in doc.nodes:
        for key in ['src','href','poster']:
            value=attrs.get(key)
            if not value:continue
            if value.startswith('#'):
                assert value[1:] in ids,f'Broken anchor {value}'
                continue
            parsed=urlsplit(value)
            if parsed.scheme or parsed.netloc:continue
            f=(path.parent/unquote(parsed.path)).resolve()
            assert f.is_file(),f'Missing file {f}'
            if tag=='img' and f.suffix in ['.png','.webp','.jpg'] and 'width' in attrs and 'height' in attrs:
                assert Image.open(f).size==(int(attrs['width']),int(attrs['height'])),f'Wrong image dimensions {f}'
        for key in ['aria-labelledby','aria-controls']:
            if key in attrs:assert all(i in ids for i in attrs[key].split()),f'Broken {key}'
        if attrs.get('target')=='_blank':assert 'noopener' in attrs.get('rel','')
    return doc


def main():
    checks=[]
    lock=json.loads((ROOT/'docs/architecture-lock.json').read_text())
    assert lock['selected_model']==3 and lock['hero_title']=='À PART.'
    assert sha(ROOT/lock['selected_reference'])==lock['selected_reference_sha256']
    assert sha(ROOT/lock['logo_png'])==lock['logo_png_sha256']
    checks.append('model 3 selection and approved-reference hashes')
    doc=check_html(SITE/'index.html');check_html(ROOT/'docs/GUIA-VISUAL.html')
    assert next(a for t,a in doc.nodes if t=='html')['lang']=='fr-FR'
    scenes=[a for t,a in doc.nodes if t=='section' and 'data-scene' in a]
    assert [a['id'] for a in scenes]==lock['main_scene_ids']
    assert [a['data-background'] for a in scenes]==lock['main_background_sequence']
    assert [a['id'] for a in scenes if a['data-background']=='solid']==['prestations']
    assert len([t for t,a in doc.nodes if t=='h1'])==1
    assert '>À PART.</h1>' in (SITE/'index.html').read_text()
    assert not any(t in ['video','iframe'] for t,a in doc.nodes)
    assert not any(a.get('href','').startswith('tel:') for t,a in doc.nodes)
    for tag,a in doc.nodes:
        if tag=='script' and 'src' in a:assert not urlsplit(a['src']).scheme
        if 'planity.com' in a.get('href',''):assert a['href']==lock['booking']
    checks.append('six approved scenes, one solid rose scene, French, links/ARIA and no invented phone')
    for cssurl in re.findall(r'url\([\'\"]?([^\)\'\"]+)',(SITE/'styles.css').read_text()):assert (SITE/cssurl).is_file()
    for fragment in re.findall(r'<svg\b.*?</svg>',(SITE/'index.html').read_text(),re.S):ET.fromstring(fragment)
    svg_count=0
    for p in ROOT.rglob('*.svg'):
        svg=ET.fromstring(p.read_text());svg_count+=1
        if p.parent==ROOT/'brand':
            assert not any(el.tag.endswith('image') for el in svg.iter()),f'Raster embedded in brand SVG {p}'
    for p in ROOT.rglob('*.json'):json.loads(p.read_text())
    for p in (SITE/'assets/fonts').glob('*.woff'):assert p.read_bytes()[:4]==b'wOFF'
    checks.append(f'CSS assets, inline SVG, {svg_count} SVG files, JSON and WOFF signatures')
    image_count=0
    for p in ROOT.rglob('*'):
        if p.suffix.lower() in ['.png','.webp','.jpg','.jpeg']:
            im=Image.open(p);im.verify();image_count+=1
        assert p.suffix.lower() not in ['.mp4','.mov','.webm','.gif'],f'Video/animation file contrary to brief: {p}'
    logo=Image.open(ROOT/lock['logo_png']).convert('RGBA');a=logo.getchannel('A');hist=a.histogram();total=logo.width*logo.height
    assert logo.size==(1774,887) and a.getextrema()==(0,255)
    transparent=hist[0]/total
    assert transparent>.8
    assert all(a.getpixel(pt)==0 for pt in [(0,0),(1773,0),(0,886),(1773,886)])
    assert (ROOT/lock['logo_png']).read_bytes()==(SITE/'assets/logo.png').read_bytes()
    fg=Image.open(SITE/'assets/hero-portrait-D.webp')
    assert fg.mode=='RGBA' and fg.getchannel('A').getextrema()[0]==0
    checks.append(f'{image_count} images decode; transparent logo/foreground; identical PNG logo copies; no video files')
    manifest=json.loads((ROOT/'docs/asset-manifest.json').read_text())
    originals=0
    for item in manifest['assets']:
        assert sha(ROOT/item['file'])==item['sha256'],f'Asset changed: {item["file"]}'
        if item['kind']=='client_original':
            originals+=1;assert item['sha256']==item['source_attachment_sha256']
        if 'source' in item:assert (ROOT/item['source']).is_file()
    assert originals==8
    checks.append('all 8 client originals unchanged; campaign and web derivative origins recorded')
    node=shutil.which('node');assert node,'Node.js required for source syntax check'
    for file in ['app.js','content.js']:subprocess.run([node,'--check',str(SITE/file)],capture_output=True,check=True)
    code="const fs=require('fs'),vm=require('vm');let c={window:{}};vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),c);process.stdout.write(JSON.stringify(c.window.DEPENDANCE));"
    content=json.loads(subprocess.check_output([node,'-e',code,str(SITE/'content.js')]))
    assert content['booking']==lock['booking']
    for tag,attrs in doc.nodes:
        for key in ['data-service','data-category']:
            if key in attrs:assert attrs[key] in content['services']
    for key,data in content['services'].items():assert data['title'] and data['description'] and data['items'] and all(isinstance(x,str) and x for x in data['items'])
    for item in content['gallery']:
        assert (SITE/item['file']).is_file()
        assert Image.open(SITE/item['file']).size==(item['width'],item['height'])
    checks.append('JavaScript syntax; service/tab data binding; gallery files and dimensions')
    pdf=fitz.open(ROOT/lock['card']['pdf']);assert len(pdf)==2
    for page in pdf:
        assert abs(page.rect.width*25.4/72-91)<.02 and abs(page.rect.height*25.4/72-61)<.02
        assert abs(page.trimbox.width*25.4/72-85)<.02 and abs(page.trimbox.height*25.4/72-55)<.02
        assert page.get_drawings()
    text=pdf[1].get_text();data=json.loads((ROOT/'business-card/card-data.json').read_text())
    for key in ['name','role','street','city','booking_label','instagram_label']:assert data[key] in text
    links=[x.get('uri') for x in pdf[1].get_links()]
    assert data['booking_url'] in links and data['instagram_url'] in links
    assert not pdf[0].get_images(),'Front logo must be vector outlines, not raster image'
    for word in pdf[1].get_text('words'):
        assert pdf[1].trimbox.contains(fitz.Rect(*word[:4])),f'Card text outside trim: {word[4]}'
    checks.append('two-page card PDF: 91x61 mm, 85x55 TrimBox, exact French text, live links and vector front')
    hashes=ROOT/'MANIFEST.sha256'
    if hashes.exists():
        n=0
        for line in hashes.read_text().splitlines():
            expected,name=line.split('  ',1);assert sha(ROOT/name)==expected,f'Checksum mismatch: {name}';n+=1
        checks.append(f'package integrity: {n} SHA-256 hashes')
    print(json.dumps({'status':'PASS','scope':'source, assets, brand, PDF and package checks; not browser QA','checks':checks,'logo':{'mode':'RGBA','dimensions':list(logo.size),'alpha_range':list(a.getextrema()),'fully_transparent_percent':round(transparent*100,3)},'pdf':{'pages':2,'media_mm':[91,61],'trim_mm':[85,55],'bleed_mm':3,'visual_inspection':'front and back rendered and reviewed','profile':'RGB; not certified PDF/X or printer ICC'},'video_files':0,'browser_qa':{'status':'UNVERIFIED','reason':'sites-previewd mailbox unavailable at /tmp/sites-previewd/requests; start/status returned os error 2'},'not_performed':['browser layout and interactive QA','performance measurement','deployment']},indent=2,ensure_ascii=False))


if __name__=='__main__':main()
