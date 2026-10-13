#!/usr/bin/env python3
"""Запускает все тесты по очереди. Использование: python3 tests/run_all.py [имя ...]
   Предварительно: python3 tools/build.py --test
   Тест считается пройденным, если код возврата 0, в выводе нет 'FAIL' и есть 'ALL OK' (кроме t1)."""
import subprocess, sys, os, glob
HERE = os.path.dirname(os.path.abspath(__file__))
names = sys.argv[1:] or [os.path.basename(f)[:-3] for f in sorted(glob.glob(HERE+'/t*.py'))]
failed = []
for n in names:
    r = subprocess.run([sys.executable, os.path.join(HERE, n+'.py')], capture_output=True, text=True, timeout=600)
    out = r.stdout + r.stderr
    good = r.returncode == 0 and 'FAIL' not in out and 'Traceback' not in out and ('ALL OK' in out or n in ('t1','t20'))
    print(('ok   ' if good else 'FAIL ') + n)
    if not good: failed.append(n); print('\n'.join('    '+l for l in out.strip().split('\n')[-12:]))
print('\nПровалено:', failed or 'нет'); sys.exit(1 if failed else 0)
