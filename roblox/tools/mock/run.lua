-- Прогон серверного и клиентского кода Эльдории на макете Roblox
local ROOT = arg_root
package.path = ROOT .. "/tools/mock/?.lua;" .. package.path
local R = dofile(ROOT .. "/tools/mock/roblox.lua")
math.randomseed(tonumber(arg_seed) or 7)
-- виртуальные часы: идут вместе с кадрами прогона
local vclock = 100
os.clock = function() return vclock end

local function readFile(p)
	local f = assert(io.open(ROOT .. "/" .. p, "r"))
	local s = f:read("a")
	f:close()
	return s
end

-------------------------------------------------------------------- дерево игры
game = Instance.new("DataModel")
game.Name = "Game"
local services = {}
local function svc(name, class)
	local s = Instance.new(class or name)
	s.Name = name
	s.Parent = game
	services[name] = s
	return s
end
local methods_extra = {}
workspace = svc("Workspace")
local terrain = Instance.new("Terrain")
terrain.Name = "Terrain"
terrain.Parent = workspace
local cam = Instance.new("Camera")
cam.Name = "Camera"
cam.ViewportSize = { X = 1280, Y = 720 }
cam.CFrame = CFrame.new(0, 20, 20)
cam.Parent = workspace
workspace.CurrentCamera = cam
local Players = svc("Players")
local RS = svc("ReplicatedStorage")
local SSS = svc("ServerScriptService")
local Lighting = svc("Lighting")
local StarterPlayer = svc("StarterPlayer")
local RunService = svc("RunService")
svc("TweenService"); svc("Debris"); svc("DataStoreService"); svc("StarterGui"); svc("SoundService")
svc("ContextActionService"); svc("UserInputService"); svc("HttpService")

-- поведение сервисов
local mt = getmetatable(game)
local baseIndex = mt.__index
local store = {}
local casActions = {}
local SPECIAL = {
	GetService = function(self, n) return services[n] or error("нет сервиса " .. n) end,
	BindToClose = function(self, fn) R.closeFn = fn end,
	GetPlayers = function(self)
		local t = {}
		for _, c in ipairs(self:GetChildren()) do if c.ClassName == "Player" then table.insert(t, c) end end
		return t
	end,
	GetPlayerFromCharacter = function(self, ch)
		for _, p in ipairs(Players:GetChildren()) do if p.ClassName == "Player" and p.Character == ch then return p end end
		return nil
	end,
	Raycast = function(self, origin, dir, params)
		assert(origin and dir and dir.Magnitude, "Raycast(origin, dir)")
		if dir.Y < -1 then return { Position = Vector3.new(origin.X, 0, origin.Z), Instance = terrain, Normal = Vector3.new(0, 1, 0) } end
		return nil
	end,
	GetServerTimeNow = function() return vclock + 1000 end,
	Create = function(self, obj, info, goals)
		assert(type(goals) == "table")
		return { Play = function() for k, v in pairs(goals) do obj[k] = v end end, Cancel = function() end, Completed = R.Signal.new("Tween.Completed") }
	end,
	AddItem = function() end,
	GetDataStore = function()
		return {
			GetAsync = function(_, k) return store[k] end,
			SetAsync = function(_, k, v)
				-- проверка, что данные сериализуются в JSON (нет функций, Instance, смешанных ключей)
				local function chk(x, path)
					local t = type(x)
					if t == "table" then
						assert(getmetatable(x) == nil, "в сохранении есть объект с метатаблицей: " .. path)
						for kk, vv in pairs(x) do assert(type(kk) == "string" or type(kk) == "number", "ключ " .. path); chk(vv, path .. "." .. tostring(kk)) end
					else
						assert(t == "number" or t == "string" or t == "boolean", "в сохранении тип " .. t .. " в " .. path)
					end
				end
				chk(v, k)
				store[k] = v
			end,
		}
	end,
	SetCoreGuiEnabled = function() end,
	BindAction = function(self, name, fn, touch, ...) casActions[name] = fn end,
	SetTitle = function() end,
	SetPosition = function() end,
	UnbindAction = function() end,
	PlayLocalSound = function() end,
}
mt.__index = function(o, k)
	if SPECIAL[k] then return SPECIAL[k] end
	return baseIndex(o, k)
end

-------------------------------------------------------------------- скрипты
local scriptPath = {}
local moduleCache = {}
local function makeScript(class, name, path, parent)
	local s = Instance.new(class)
	s.Name = name
	scriptPath[s] = path
	s.Parent = parent
	return s
end
local function runScript(inst)
	local env = setmetatable({ script = inst }, { __index = _G })
	local chunk = assert(load(readFile(scriptPath[inst]), "@" .. scriptPath[inst], "t", env))
	return chunk()
end
require = function(inst)
	if moduleCache[inst] ~= nil then return moduleCache[inst] end
	assert(scriptPath[inst], "require: не модуль")
	local co = coroutine.running()
	local res = runScript(inst)
	moduleCache[inst] = res
	return res
end

local eld = Instance.new("Folder"); eld.Name = "Eldoria"; eld.Parent = RS
makeScript("ModuleScript", "Config", "src/ReplicatedStorage/Eldoria/Config.lua", eld)
local server = makeScript("Script", "EldoriaServer", "src/ServerScriptService/EldoriaServer/init.server.lua", SSS)
local enemiesMod = makeScript("ModuleScript", "Enemies", "src/ServerScriptService/EldoriaServer/Enemies.lua", server)
makeScript("ModuleScript", "Models", "src/ServerScriptService/EldoriaServer/Models.lua", server)
makeScript("ModuleScript", "WorldGen", "src/ServerScriptService/EldoriaServer/WorldGen.lua", server)

-------------------------------------------------------------------- игрок
local player = Instance.new("Player")
player.Name = "Тестер"
player.UserId = 101
player.DisplayName = "Тестер"
local backpack = Instance.new("Backpack"); backpack.Name = "Backpack"; backpack.Parent = player
local pgui = Instance.new("PlayerGui"); pgui.Name = "PlayerGui"; pgui.Parent = player
local spawnPos = Vector3.new(0, 4, 0)
R.loadCharacter = function(plr)
	local ch = Instance.new("Model")
	ch.Name = plr.Name
	local hum = Instance.new("Humanoid"); hum.Name = "Humanoid"; hum.Health = 100; hum.MaxHealth = 100
	local hrp = Instance.new("Part"); hrp.Name = "HumanoidRootPart"; hrp.Size = Vector3.new(2, 2, 1); hrp.CFrame = CFrame.new(spawnPos)
	local head = Instance.new("Part"); head.Name = "Head"; head.CFrame = CFrame.new(spawnPos + Vector3.new(0, 1.5, 0))
	local torso = Instance.new("Part"); torso.Name = "UpperTorso"; torso.CFrame = CFrame.new(spawnPos)
	hrp.Parent = ch; head.Parent = ch; torso.Parent = ch; hum.Parent = ch
	ch.PrimaryPart = hrp
	plr.Character = ch
	ch.Parent = workspace
	plr.CharacterAdded:Fire(ch)
end
local function hrp() return player.Character and player.Character:FindFirstChild("HumanoidRootPart") end
local function moveTo(p, look)
	player.Character:PivotTo(look and CFrame.lookAt(p, look) or CFrame.new(p))
end

-------------------------------------------------------------------- сеть
local clientReady = false
local notes = {}
R.onFireServer = function(remote, ...) remote.OnServerEvent:Fire(player, ...) end
R.onFireClient = function(remote, plr, ...)
	if remote.Name == "Notify" then table.insert(notes, (...)) end
	if clientReady then remote.OnClientEvent:Fire(...) end
end

local function step(n, dt)
	for i = 1, n do
		vclock = vclock + (dt or 0.05)
		RunService.Heartbeat:Fire(dt or 0.05)
		if clientReady then RunService.RenderStepped:Fire(dt or 0.05) end
		if i % 5 == 0 then R.runDelays(1) end
	end
	R.runDelays(2)
end
local function section(t) print(("—"):rep(4) .. " " .. t) end
local function lastNotes(k)
	local out = {}
	for i = math.max(1, #notes - (k or 3) + 1), #notes do table.insert(out, notes[i]) end
	return table.concat(out, " | ")
end

-------------------------------------------------------------------- 1. сервер
section("запуск сервера и генерация мира")
runScript(server)
local Enemies = require(enemiesMod)
local ow = workspace.Eldoria.Overworld
print("операций с рельефом:", R.terrainOps, "· деревьев и декора:", #ow.Nature:GetChildren(), "· врагов:", #Enemies.list, "· предметов:", #workspace.Eldoria.Pickups:GetChildren())
local md = eld.MapData
assert(#md.Value == 96 * 96, "размер карты")
do
	local f = io.open(ROOT .. "/build/map.txt", "w")
	if f then f:write(md.Value, "\n", md:GetAttribute("ShopX"), " ", md:GetAttribute("ShopZ"), " ", md:GetAttribute("CaveX"), " ", md:GetAttribute("CaveZ")); f:close() end
end
local counts = {}
for ch in md.Value:gmatch(".") do counts[ch] = (counts[ch] or 0) + 1 end
print("клетки карты:", "трава " .. (counts["."] or 0), "деревья " .. (counts["#"] or 0), "вода " .. (counts["~"] or 0), "горы " .. (counts["^"] or 0), "тропы " .. (counts["P"] or 0))

section("вход игрока")
player.Parent = Players
Players.PlayerAdded:Fire(player)
assert(player.Character, "персонаж не загрузился")
local tool = player.Character:FindFirstChildOfClass("Tool")
print("в руках:", tool and tool.Name, "· уровень", player:GetAttribute("Level"), "· золото", player:GetAttribute("Gold"), "· эликсиров", player:GetAttribute("E_small"))

-------------------------------------------------------------------- 2. клиент
section("запуск клиента")
Players.LocalPlayer = player
makeScript("LocalScript", "EldoriaClient", "src/StarterPlayer/StarterPlayerScripts/EldoriaClient.client.lua", player)
local client = player:FindFirstChild("EldoriaClient")
runScript(client)
clientReady = true
step(3)
local ui = pgui:FindFirstChild("EldoriaUI")
print("интерфейс создан:", ui ~= nil, "· элементов:", ui and #ui:GetDescendants())
local function clickAll(text)
	for _, b in ipairs(ui:GetDescendants()) do
		if b.ClassName == "TextButton" and b.Text and b.Text:find(text, 1, true) then b.Activated:Fire(); step(1); return 1 end
	end
	return 0
end
print("вступление показано, кнопка «В путь»:", clickAll("В путь"), "· IntroSeen =", player:GetAttribute("IntroSeen"))

-------------------------------------------------------------------- 3. бой на поверхности
section("бой на поверхности")
local function nearestEnemy(kind)
	local best, bd
	for _, rec in ipairs(Enemies.list) do
		if not rec.dead and (not kind or rec.kind == kind) and rec.zone == "ow" then
			local d = (rec.root.Position - hrp().Position).Magnitude
			if not bd or d < bd then best, bd = rec, d end
		end
	end
	return best
end
local e = nearestEnemy()
moveTo(e.root.Position + Vector3.new(0, 0, 5), e.root.Position)
step(40)
print("враг", e.def.name, "атакует; здоровье героя:", player.Character.Humanoid.Health)
-- удар через инструмент, как на ПК и телефоне
local t0 = player.Character:FindFirstChildOfClass("Tool")
t0.Activated:Fire(); t0.Deactivated:Fire()
step(2)
print("после удара мечом: здоровье врага", math.floor(e.hum.Health), "/", e.hum.MaxHealth)
-- сильный удар через клавишу F (ContextActionService)
casActions.EldoriaAttack("EldoriaAttack", Enum.UserInputState.Begin)
vclock = vclock + 1
casActions.EldoriaAttack("EldoriaAttack", Enum.UserInputState.End)
print("сильный удар (удержание 1 с): здоровье врага", math.floor(e.hum.Health), "·", e.dead and "повержен" or "жив")
step(2)
casActions.EldoriaDash("EldoriaDash", Enum.UserInputState.Begin)
-- добиваем 25 врагов, чтобы накопить золото и опыт
for i = 1, 25 do
	local r = nearestEnemy()
	if r then Enemies.damage(r, 9999, player, hrp().Position) end
end
step(10)
print("после 25 побед: уровень", player:GetAttribute("Level"), "· опыт", player:GetAttribute("XP"), "/", player:GetAttribute("XPNext"), "· золото", player:GetAttribute("Gold"), "· врагов осталось", Enemies.count("ow"))
step(140)
print("через 7 с врагов на поверхности:", Enemies.count("ow"))

-------------------------------------------------------------------- 4. предметы и эликсиры
section("предметы и эликсиры")
local pk = workspace.Eldoria.Pickups:GetChildren()[1]
pk.Hitbox.Touched:Fire(player.Character.HumanoidRootPart)
print("подобран предмет:", pk.Name, "· золото", player:GetAttribute("Gold"), "· эликсиров", player:GetAttribute("E_small"))
player.Character.Humanoid:TakeDamage(50)
local keyOne = { KeyCode = Enum.KeyCode.One }
services.UserInputService.InputBegan:Fire(keyOne, false)
step(1)
print("выпит эликсир клавишей 1:", lastNotes(1), "· здоровье", player.Character.Humanoid.Health)

-------------------------------------------------------------------- 5. лавка и задания
section("лавка и задания")
local merchant = ow.Shop:FindFirstChild("Торговец")
merchant.HumanoidRootPart.ProximityPrompt.Triggered:Fire(player)
moveTo(merchant.HumanoidRootPart.Position + Vector3.new(0, 0, -6))
local shopGui = ui:FindFirstChild("Frame")
clickAll("Броня")
local okBuy = clickAll("Купить · 60")
print("купить кожаную броню:", okBuy, "→", lastNotes(1), "· броня", player:GetAttribute("Armor"))
print("броня на персонаже:", player.Character:FindFirstChild("EldoriaArmor") ~= nil)
clickAll("Оружие")
print("копьё до победы над Мортраксом заблокировано:", player:GetAttribute("Owned"))
clickAll("Эликсиры")
clickAll("Купить · 45")
print("куплено зелье скорости:", player:GetAttribute("E_speed"))
services.UserInputService.InputBegan:Fire({ KeyCode = Enum.KeyCode.Three }, false)
step(1)
print("выпито зелье скорости, скорость героя:", player.Character.Humanoid.WalkSpeed)
clickAll("Задания")
clickAll("Взять задание")
print("задание:", player:GetAttribute("Quest"))
for i = 1, 5 do
	local w = Enemies.spawn("wolf", Vector3.new(30 + i * 3, 0, 30), { zone = "ow" })
	Enemies.damage(w, 9999, player, hrp().Position)
end
step(2)
print("прогресс:", player:GetAttribute("QuestProg"), "·", lastNotes(1))
clickAll("Задания")
local claimed = clickAll("Получить Вознаграждение")
print("награда получена:", claimed, "→", lastNotes(1), "· выполнено:", player:GetAttribute("QuestsDone"))
clickAll("✕")

-------------------------------------------------------------------- 6. логово Мортракса
section("логово Мортракса")
local door = ow.CaveEntrance.Door
door.ProximityPrompt.Triggered:Fire(player)
step(2)
print("зона:", player:GetAttribute("Zone"), "· враги в логове:", Enemies.count("lair", true))
local boss
for _, r in ipairs(Enemies.list) do if r.def.boss then boss = r end end
assert(boss, "Мортракс не появился")
moveTo(boss.root.Position + Vector3.new(-9, 0, 0), boss.root.Position)
step(120)
print("отладка: босс видит цель =", boss.engaged, "· расстояние", math.floor((boss.root.Position - hrp().Position).Magnitude), "· reach", boss.reach)
print("бой: здоровье героя", player.Character and player.Character.Humanoid.Health, "·", lastNotes(2))
if player.Character.Humanoid.Health <= 0 then step(100) end
moveTo(boss.root.Position + Vector3.new(-9, 0, 0), boss.root.Position)
Enemies.damage(boss, 120, player, hrp().Position)
step(40)
print("фаза 2, скелетов призвано:", Enemies.count("lair", true), "·", lastNotes(2))
Enemies.damage(boss, 50, player, hrp().Position)
step(80)
print("фаза 3 ·", lastNotes(1))
Enemies.damage(boss, 9999, player, hrp().Position)
step(20)
print("после победы: этап", player:GetAttribute("Stage"), "·", lastNotes(3))
clickAll("Продолжить")

section("после победы: копьё и выход")
moveTo(merchant.HumanoidRootPart.Position + Vector3.new(0, 0, -6))
player:SetAttribute("Zone", "ow")
merchant.HumanoidRootPart.ProximityPrompt.Triggered:Fire(player)
clickAll("Оружие")
clickAll("Купить · 50")
print("куплено копьё:", player:GetAttribute("Weapon"), "· в руках", player.Character:FindFirstChildOfClass("Tool").Name)
clickAll("Продать 25")
print("продано копьё, в руках:", player:GetAttribute("Weapon"))
player:SetAttribute("Zone", "lair")
workspace.Eldoria.Lair.Exit.ProximityPrompt.Triggered:Fire(player)
print("выход из логова, зона:", player:GetAttribute("Zone"))

-------------------------------------------------------------------- 7. эффекты клиента
section("эффекты клиента")
local Fx = eld.Remotes.Fx
for _, kind in ipairs({ "slash", "dmg", "death", "summon", "boom", "levelup", "drink", "loot", "hurt", "coin", "victory" }) do
	Fx.OnClientEvent:Fire(kind, { cf = CFrame.new(1, 2, 3), range = 7, arc = 360, charged = true, by = 5, pos = Vector3.new(1, 2, 3), text = "12", gold = 3, xp = 5, item = "Эликсир", color = Color3.new(1, 0, 0), title = "Тест", boss = true, r = 10 })
end
step(5)
clickAll("☰ Меню"); clickAll("Управление"); clickAll("Назад"); clickAll("История"); clickAll("В путь")
clickAll("☰ Меню"); clickAll("Сохранить"); step(2)
print("сохранение:", lastNotes(1))

-------------------------------------------------------------------- 8. смерть и выход
section("смерть героя и выход из игры")
player.Character.Humanoid:TakeDamage(99999)
step(2)
print("после смерти:", lastNotes(1), "· новый персонаж:", player.Character and player.Character.Humanoid.Health)
Players.PlayerRemoving:Fire(player)
if R.closeFn then R.closeFn() end
print("в хранилище сохранено:", store["p_101"] ~= nil, "· уровень", store["p_101"] and store["p_101"].level, "· этап", store["p_101"] and store["p_101"].stage)

print(("="):rep(30))
print("ОШИБОК В ОБРАБОТЧИКАХ:", R.errors)
