# The Legend of Eldoria для Roblox

3D-версия первой главы игры (вид от третьего лица): Оверворлд, лавка торговца, задания и логово Мортракса.
Текущая сборка — **R001.002**.

## Как запустить

1. Скачайте `Eldoria_R001.002.rbxlx` и откройте его двойным щелчком в Roblox Studio.
2. Нажмите **Play**. Мир строится при запуске, поэтому в режиме редактирования сцена пустая; через 5–10 секунд появится герой.
3. Чтобы сохранялся прогресс: опубликуйте игру (File → Publish to Roblox) и включите
   Game Settings → Security → **Enable Studio Access to API Services**.

## Управление

- **ПК:** WASD — ходьба, мышь — камера, ЛКМ или F — удар (удерживать — сильный удар), Q — рывок, 1–5 — эликсиры и зелья, E — торговать или войти.
- **Телефон:** джойстик слева, кнопки ⚔ (удар, удерживать — сильный) и » (рывок), касание слотов — выпить.
- **Геймпад:** R2 или X — удар, L1 — рывок.

## Устройство

```
src/
  ReplicatedStorage/Eldoria/Config.lua        — все цифры: враги, оружие, броня, эликсиры, задания, тексты
  ServerScriptService/EldoriaServer/
    init.server.lua                           — главный серверный скрипт: герой, бой, лавка, задания, логово, сохранения
    WorldGen.lua                              — генерация поверхности (Terrain) и логова
    Models.lua                                — модели из деталей: деревья, враги, лавка, оружие, предметы
    Enemies.lua                               — поведение врагов, босс, удары по площади, снаряды
  StarterPlayer/StarterPlayerScripts/EldoriaClient.client.lua — интерфейс, управление, эффекты
  StarterPlayer/StarterCharacterScripts/Health.server.lua     — отключает стандартную регенерацию здоровья
tools/
  build_rbxlx.py   — собирает src/ в Eldoria_R*.rbxlx
  luacheck.py      — проверка синтаксиса (через liblua5.4)
  globals.py       — поиск опечаток в именах и обращений к переменным до объявления
  mock/            — макет API Roblox и прогон всей игры: мир, бой, лавка, задания, Мортракс, сохранение
```

Код пишется в общем подмножестве Lua и Luau (без `+=`, `continue`, типов), чтобы его можно было проверить обычным Lua 5.4.

## Сборка и проверка

```
cd roblox
python3 tools/luacheck.py src
python3 tools/globals.py src
python3 tools/mock/run.py        # прогон игры на макете Roblox, в конце «ОШИБОК В ОБРАБОТЧИКАХ: 0»
python3 tools/build_rbxlx.py Eldoria_R001.002.rbxlx
```

Нужен пакет `liblua5.4-0` (Ubuntu: `sudo apt-get install liblua5.4-0`). При каждом релизе поднимается минорная версия сборки (`Config.BUILD`, R001.0NN).
