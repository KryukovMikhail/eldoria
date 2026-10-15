# Легенды Эльдории

2D RPG на Canvas в одном файле `index.html` (играть: https://kryukovmikhail.github.io/eldoria/).
Работает на десктопе, iOS и Android, устанавливается как PWA.

Технический стек и устройство проекта: [ARCHITECTURE.md](ARCHITECTURE.md).

## Структура

```
src/index.template.html   разметка (меню, оверлеи) с метками /*@@CSS@@*/ и /*@@JS@@*/
src/style.css             стили
src/js/NN_*.js            код игры, склеивается по порядку имён внутри одной IIFE
tools/build.py            сборка: src/ -> index.html (+ имя кэша в sw.js)
tests/                    автотесты (Playwright), tests/hook.txt — тестовый хук window.__t
index.html, sw.js, ...    то, что публикуется на GitHub Pages
```

Модули — это куски одного скрипта: порядок файлов важен, `const`/`let` из ранних файлов видны в поздних.
Новый модуль добавляйте с номером, который ставит его на нужное место.

## Работа

```bash
python3 tools/build.py            # собрать index.html (и обновить CACHE в sw.js)
python3 tools/build.py --test     # собрать dist/test.html с хуком window.__t
pip install playwright && playwright install chromium
python3 tests/run_all.py          # все тесты;  python3 tests/run_all.py t21  — один
```

## Релиз

1. Поднять номер сборки в `src/index.template.html` (`#buildTag`, «сборка D001.0NN»).
2. `python3 tools/build.py` — обновит `index.html` и `sw.js`.
3. Закоммитить `index.html` и `sw.js` вместе с `src/`. CI проверит, что `index.html` соответствует `src/`, и прогонит тесты.
