#!/usr/bin/env python3
"""Собирает один файл index.html из src/.
   python3 tools/build.py            -> index.html
   python3 tools/build.py --test     -> dist/test.html (с тестовым хуком window.__t, см. tests/hook.txt)
"""
import sys, glob, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rd(p): return open(os.path.join(ROOT, p), encoding='utf-8').read()

def build(test=False):
    tpl = rd('src/index.template.html')
    css = rd('src/style.css').rstrip('\n')
    files = sorted(glob.glob(os.path.join(ROOT, 'src/js/*.js')))
    js = ''.join(open(f, encoding='utf-8').read() for f in files)
    body = '(() => {\n' + js.rstrip('\n') + '\n})();'
    if test:
        hook = rd('tests/hook.txt').strip()
        marker = 'requestAnimationFrame(loop);\n})();'
        assert body.count(marker) == 1, 'не нашёл точку вставки тестового хука'
        body = body.replace(marker, hook)
    assert '/*@@CSS@@*/' in tpl and '/*@@JS@@*/' in tpl
    return tpl.replace('/*@@CSS@@*/', css).replace('/*@@JS@@*/', body)

def sync_sw(html):
    """Номер сборки из меню -> имя кэша в sw.js (чтобы у игроков обновлялась офлайн-копия)."""
    import re
    m = re.search(r'сборка (D\d+\.\d+)', html); assert m, 'нет номера сборки'
    p = os.path.join(ROOT, 'sw.js'); sw = open(p, encoding='utf-8').read()
    new = re.sub(r"eldoria-D\d+\.\d+", 'eldoria-' + m.group(1), sw)
    if new != sw: open(p, 'w', encoding='utf-8').write(new)
    return m.group(1)

if __name__ == '__main__':
    test = '--test' in sys.argv
    out = os.path.join(ROOT, 'dist/test.html') if test else os.path.join(ROOT, 'index.html')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w', encoding='utf-8').write(build(test))
    print('written', out)
    if not test: print('build', sync_sw(open(out, encoding='utf-8').read()))
