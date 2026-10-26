#!/usr/bin/env python3
"""Editable 85x55 mm card, 3 mm bleed. Native SVG layouts and 2-page PDF.
Logo paths are technically traced from the approved PNG, not redrawn.
"""
from pathlib import Path
from html import escape
import json
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor

ROOT = Path(__file__).resolve().parents[1]
CARD = ROOT/'business-card'
data = json.loads((CARD/'card-data.json').read_text())
logo = json.loads((ROOT/'brand/logo-outlines.json').read_text())
paths = logo['paths']
W, H, BLEED = 91, 61, 3
BOOKING = data['booking_url']
colors = data['colors']
fields = [
    ('name', 10, 15, 11, 'Manrope-Semibold'),
    ('role', 10, 21, 6.5, 'Manrope'),
    ('street', 10, 31, 8, 'Manrope'),
    ('city', 10, 35.7, 8, 'Manrope'),
    ('booking_label', 10, 47.5, 7.5, 'Manrope'),
    ('instagram_label', 10, 53, 6.5, 'Manrope')
]


def d_string():
    return ' '.join('M' + ' L'.join(f'{x:g},{y:g}' for x,y in p) + ' Z' for p in paths)


def svg_logo(x, y, w, h, color, monogram=False):
    view = '680 85 410 420' if monogram else f'0 0 {logo["width"]} {logo["height"]}'
    return f'<svg x="{x}" y="{y}" width="{w}" height="{h}" viewBox="{view}" preserveAspectRatio="xMidYMid meet"><path fill="{color}" fill-rule="evenodd" d="{d_string()}"/></svg>'


def write_svgs():
    start = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">'
    guides = '<g id="guides" style="display:none"><rect x="3" y="3" width="85" height="55" fill="none" stroke="#00a0ff" stroke-width=".1"/><rect x="7" y="7" width="77" height="47" fill="none" stroke="#e5008c" stroke-width=".1"/></g>'
    front = start + f'<title>La Dépendance - recto, 85 x 55 mm et fond perdu 3 mm</title><rect width="91" height="61" fill="{colors["ivory"]}"/>' + svg_logo(5.5,10.5,80,40,colors['prune']) + guides + '</svg>'
    texts=[]
    for key,x,y,size,font in fields:
        weight='600' if font=='Manrope-Semibold' else '400'
        label=escape(data[key])
        node=f'<text x="{x}" y="{y}" fill="{colors["ivory"]}" font-family="Manrope,Arial,sans-serif" font-weight="{weight}" font-size="{size*25.4/72:.4f}">{label}</text>'
        if key.endswith('_label'):
            url=escape(BOOKING if key=='booking_label' else data['instagram_url'],quote=True)
            node=f'<a href="{url}">{node}</a>'
        texts.append(node)
    style='<style>@font-face{font-family:Manrope;src:url(../site/assets/fonts/Manrope-400.woff);font-weight:400}@font-face{font-family:Manrope;src:url(../site/assets/fonts/Manrope-600.woff);font-weight:600}</style>'
    back = start + '<title>La Dépendance - verso</title>' + style + f'<rect width="91" height="61" fill="{colors["prune"]}"/>' + svg_logo(75,8.5,7.8,8,colors['ivory'],True) + f'<path d="M10 41 H81" fill="none" stroke="{colors["rose"]}" stroke-width=".14"/>' + ''.join(texts) + guides + '</svg>'
    (CARD/'Cartao-Recto-Editavel.svg').write_text(front)
    (CARD/'Cartao-Verso-Editavel.svg').write_text(back)


def pdf_logo(c, x, y, w, h, color, monogram=False):
    # Inputs use millimetres measured from top left. PDF path flips Y.
    vx,vy,vw,vh = (680,85,410,420) if monogram else (0,0,logo['width'],logo['height'])
    scale = min(w*mm/vw, h*mm/vh)
    actual_w,actual_h=vw*scale,vh*scale
    left=x*mm+(w*mm-actual_w)/2
    top=(H-y)*mm-(h*mm-actual_h)/2
    c.saveState()
    clip=c.beginPath();clip.rect(x*mm,(H-y-h)*mm,w*mm,h*mm);c.clipPath(clip,stroke=0,fill=0)
    c.translate(left-vx*scale,top+vy*scale)
    c.scale(scale,-scale)
    p=c.beginPath()
    for segment in paths:
        p.moveTo(*segment[0])
        for point in segment[1:]:p.lineTo(*point)
        p.close()
    c.setFillColor(HexColor(color));c.drawPath(p,stroke=0,fill=1,fillMode=0)
    c.restoreState()


def configure_page(c, background):
    c.setTrimBox((3*mm,3*mm,88*mm,58*mm))
    c.setBleedBox((0,0,W*mm,H*mm))
    c.setFillColor(HexColor(background));c.rect(0,0,W*mm,H*mm,fill=1,stroke=0)


def main():
    for name,file in [('Manrope','Manrope-400.ttf'),('Manrope-Semibold','Manrope-600.ttf')]:
        pdfmetrics.registerFont(TTFont(name,str(ROOT/'fonts-print'/file)))
    write_svgs()
    target=CARD/'La-Dependance-Cartao-85x55mm-3mm.pdf'
    c=canvas.Canvas(str(target),pagesize=(W*mm,H*mm),pageCompression=1)
    c.setTitle('La Dépendance - carte de visite recto verso')
    c.setAuthor('La Dépendance')
    configure_page(c,colors['ivory'])
    pdf_logo(c,5.5,10.5,80,40,colors['prune'])
    c.showPage()
    configure_page(c,colors['prune'])
    pdf_logo(c,75,8.5,7.8,8,colors['ivory'],True)
    c.setStrokeColor(HexColor(colors['rose']));c.setLineWidth(.14*mm);c.line(10*mm,(H-41)*mm,81*mm,(H-41)*mm)
    for key,x,y,size,font in fields:
        c.setFillColor(HexColor(colors['ivory']));c.setFont(font,size)
        c.drawString(x*mm,(H-y)*mm,data[key])
        if key.endswith('_label'):
            link=BOOKING if key=='booking_label' else data['instagram_url']
            width=pdfmetrics.stringWidth(data[key],font,size)
            c.linkURL(link,(x*mm,(H-y)*mm-2,x*mm+width,(H-y)*mm+size+1),relative=0,thickness=0)
    c.save()
    print(target)


if __name__ == '__main__':main()
