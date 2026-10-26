"""Generate outlined brand SVGs. Requires fonttools==4.67.0 (authoring only)."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / '.brand-tools'))
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

NAVY, IVORY, SAFFRON = '#132C44', '#FAF9F6', '#B65320'
font = instantiateVariableFont(TTFont(Path(__file__).with_name('Manrope.ttf')), {'wght': 750}, inplace=False)
glyphs, cmap = font.getGlyphSet(), font.getBestCmap()

def lettering(text, size, x, baseline, tracking=0):
    scale = size / font['head'].unitsPerEm
    paths = []
    for char in text:
        glyph = glyphs[cmap[ord(char)]]
        pen = SVGPathPen(glyphs, ntos=lambda n: f'{n:.3f}'.rstrip('0').rstrip('.'))
        glyph.draw(TransformPen(pen, (scale, 0, 0, -scale, x, baseline)))
        paths.append(f'<path d="{pen.getCommands()}"/>')
        x += glyph.width * scale + tracking
    return ''.join(paths), x - tracking

# Purpose-drawn block letterforms: thick strokes and open counters for 16px use.
mark = f'<rect width="64" height="64" rx="12" fill="{NAVY}"/><path fill="{IVORY}" d="M10 16h7v25h13v7H10zM34 48V16h6l5 12 5-12h6v32h-6V30l-5 11-5-11v18z"/>'
def svg(width, height, title, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title"><title id="title">{title}</title>{body}</svg>\n'

word, right = lettering('LoanMitra', 52, 98, 55, -.8)
india, india_right = lettering('INDIA', 13, 99, 79, 3.8)
width = round(right + 2)
logo = svg(width, 96, 'LoanMitra India', f'<g transform="translate(0 8) scale(1.25)">{mark}</g><g fill="{NAVY}">{word}{india}</g><path fill="{SAFFRON}" d="M{india_right+12:.3f} 73h20v3h-20z"/>')
icon = svg(64, 64, 'LoanMitra India LM monogram', mark)
out = ROOT / 'public/brand'
out.mkdir(parents=True, exist_ok=True)
(out / 'loanmitra-india.svg').write_text(logo, encoding='utf8')
(out / 'lm-monogram.svg').write_text(icon, encoding='utf8')
(ROOT / 'src/app/icon.svg').write_text(icon, encoding='utf8')
print(f'Logo viewBox: 0 0 {width} 96; monogram: 64 x 64')
