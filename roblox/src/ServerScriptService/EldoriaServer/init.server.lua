-- Хроники Эльдории для Roblox — главный серверный скрипт
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")

local Eldoria = ReplicatedStorage:WaitForChild("Eldoria")
local Config = require(Eldoria:WaitForChild("Config"))
local Models = require(script:WaitForChild("Models"))
local WorldGen = require(script:WaitForChild("WorldGen"))
local Enemies = require(script:WaitForChild("Enemies"))

Players.CharacterAutoLoads = false

---------------------------------------------------------------- связь с клиентом
local remotes = Instance.new("Folder")
remotes.Name = "Remotes"
local Action = Instance.new("RemoteEvent")
Action.Name = "Action"
Action.Parent = remotes
local Notify = Instance.new("RemoteEvent")
Notify.Name = "Notify"
Notify.Parent = remotes
local Fx = Instance.new("RemoteEvent")
Fx.Name = "Fx"
Fx.Parent = remotes
remotes.Parent = Eldoria

local function notify(plr, text, color)
	Notify:FireClient(plr, text, color or Color3.fromRGB(240, 226, 190))
end
local function notifyAll(text, color)
	Notify:FireAllClients(text, color or Color3.fromRGB(240, 226, 190))
end
local function fxAll(kind, d) Fx:FireAllClients(kind, d) end
Enemies.fx = fxAll

local function serverNow() return workspace:GetServerTimeNow() end
local function clock() return os.clock() end

---------------------------------------------------------------- свет, атмосфера, смена суток
Lighting.Brightness = 2.4
Lighting.Ambient = Color3.fromRGB(64, 62, 72)
Lighting.OutdoorAmbient = Color3.fromRGB(122, 122, 132)
Lighting.EnvironmentDiffuseScale = 0.6
Lighting.EnvironmentSpecularScale = 0.5
Lighting.GlobalShadows = true
Lighting.ClockTime = 9
local atm = Lighting:FindFirstChildOfClass("Atmosphere") or Instance.new("Atmosphere")
atm.Density = 0.3
atm.Offset = 0.15
atm.Haze = 1.4
atm.Glare = 0.3
atm.Color = Color3.fromRGB(205, 196, 176)
atm.Decay = Color3.fromRGB(104, 112, 126)
atm.Parent = Lighting
if not Lighting:FindFirstChildOfClass("Sky") then
	local sky = Instance.new("Sky")
	sky.SunAngularSize = 14
	sky.MoonAngularSize = 9
	sky.Parent = Lighting
end
local bloom = Lighting:FindFirstChildOfClass("BloomEffect") or Instance.new("BloomEffect")
bloom.Intensity = 0.5
bloom.Size = 22
bloom.Threshold = 1.6
bloom.Parent = Lighting
local cc = Instance.new("ColorCorrectionEffect")
cc.Name = "EldoriaGrade"
cc.Saturation = 0.08
cc.Contrast = 0.05
cc.Parent = Lighting

task.spawn(function()
	local t0 = clock()
	while true do
		-- день длиннее ночи: 70% суток — с 6 до 20 часов, 30% — ночь
		local p = ((clock() - t0) / Config.DAY_LENGTH + 0.12) % 1
		local h
		if p < 0.7 then h = 6 + p / 0.7 * 14 else h = 20 + (p - 0.7) / 0.3 * 10 end
		Lighting.ClockTime = h % 24
		task.wait(0.5)
	end
end)

---------------------------------------------------------------- мир
local worldFolder = Instance.new("Folder")
worldFolder.Name = "Eldoria"
worldFolder.Parent = workspace
local owFolder = Instance.new("Folder")
owFolder.Name = "Overworld"
owFolder.Parent = worldFolder
local lairFolder = Instance.new("Folder")
lairFolder.Name = "Lair"
lairFolder.Parent = worldFolder
local pickupFolder = Instance.new("Folder")
pickupFolder.Name = "Pickups"
pickupFolder.Parent = worldFolder

local layout = WorldGen.buildOverworld(owFolder)
local lairInfo = WorldGen.buildLair(lairFolder)

local mapData = Instance.new("StringValue")
mapData.Name = "MapData"
mapData.Value = layout.mapString
mapData:SetAttribute("N", Config.MAP_N)
mapData:SetAttribute("ShopX", layout.shopCell[1])
mapData:SetAttribute("ShopZ", layout.shopCell[2])
mapData:SetAttribute("CaveX", layout.caveCell[1])
mapData:SetAttribute("CaveZ", layout.caveCell[2])
mapData.Parent = Eldoria

Enemies.init(worldFolder)
Enemies.safeZones = {
	{ pos = layout.spawn, r = 30 },
	{ pos = layout.shopPos, r = 34 },
	{ pos = layout.cavePos, r = 22 },
	{ pos = lairInfo.spawn, r = 24 },
}

---------------------------------------------------------------- данные героя
local store
pcall(function() store = DataStoreService:GetDataStore("EldoriaR1") end)

local data = {}

local function defaultData()
	local d = {
		level = 1, xp = 0, xpNext = Config.PLAYER.xpNext, gold = 0, atk = Config.PLAYER.atk, maxHp = Config.PLAYER.hp,
		weapon = "sword", owned = { sword = true }, armor = "none", ownedArmor = { none = true },
		elix = { small = 3, big = 0, speed = 0, might = 0, guard = 0 },
		quest = nil, done = {}, stage = 0, intro = false, kills = {},
	}
	return d
end

local function merge(def, got)
	if type(got) ~= "table" then return def end
	for k, v in pairs(def) do
		if got[k] == nil then got[k] = v
		elseif type(v) == "table" and type(got[k]) == "table" and k ~= "quest" then merge(v, got[k]) end
	end
	return got
end

local function loadData(plr)
	local d = defaultData()
	if store then
		local ok, res = pcall(function() return store:GetAsync("p_" .. plr.UserId) end)
		if ok and type(res) == "table" then d = merge(defaultData(), res)
		elseif not ok then warn("Eldoria: не удалось загрузить сохранение", res) end
	end
	d.buffs = { speed = 0, might = 0, guard = 0 }
	-- os.clock() в начале работы сервера может быть маленьким, поэтому «давно» = -1e9
	d.invulnUntil = -1e9
	d.dashCd = -1e9
	d.lastAtk = -1e9
	return d
end

local function saveData(plr)
	local d = data[plr]
	if not d or not store then return false end
	local copy = {}
	for k, v in pairs(d) do
		if k ~= "buffs" and k ~= "invulnUntil" and k ~= "dashCd" and k ~= "lastAtk" then copy[k] = v end
	end
	local ok, err = pcall(function() store:SetAsync("p_" .. plr.UserId, copy) end)
	if ok then plr:SetAttribute("SavedAt", os.date("!%d.%m %H:%M") .. " UTC · ур. " .. d.level)
	else warn("Eldoria: не удалось сохранить", err) end
	return ok
end

local function keysCsv(t)
	local out = {}
	for k, v in pairs(t) do if v then table.insert(out, k) end end
	table.sort(out)
	return table.concat(out, ",")
end

local function publish(plr)
	local d = data[plr]
	if not d then return end
	plr:SetAttribute("Level", d.level)
	plr:SetAttribute("XP", d.xp)
	plr:SetAttribute("XPNext", d.xpNext)
	plr:SetAttribute("Gold", d.gold)
	plr:SetAttribute("Atk", d.atk)
	plr:SetAttribute("MaxHp", d.maxHp)
	plr:SetAttribute("Weapon", d.weapon)
	plr:SetAttribute("Armor", d.armor)
	plr:SetAttribute("Stage", d.stage)
	plr:SetAttribute("Owned", keysCsv(d.owned))
	plr:SetAttribute("OwnedArmor", keysCsv(d.ownedArmor))
	plr:SetAttribute("QuestsDone", keysCsv(d.done))
	plr:SetAttribute("Quest", d.quest and d.quest.id or "")
	plr:SetAttribute("QuestProg", d.quest and d.quest.prog or 0)
	plr:SetAttribute("IntroSeen", d.intro)
	for _, k in ipairs(Config.ELIX_ORDER) do plr:SetAttribute("E_" .. k, d.elix[k] or 0) end
	for k, v in pairs(d.buffs) do plr:SetAttribute("Buff_" .. k, v) end
	local ls = plr:FindFirstChild("leaderstats")
	if ls then
		ls["Уровень"].Value = d.level
		ls["Золото"].Value = d.gold
	end
end

local function aliveChar(plr)
	local ch = plr.Character
	if not ch then return nil end
	local hum = ch:FindFirstChildOfClass("Humanoid")
	local hrp = ch:FindFirstChild("HumanoidRootPart")
	if hum and hrp and hum.Health > 0 then return hrp, hum, ch end
	return nil
end

local function buffOn(d, k) return (d.buffs[k] or 0) > serverNow() end

local function applySpeed(plr)
	local d = data[plr]
	local _, hum = aliveChar(plr)
	if d and hum then hum.WalkSpeed = Config.PLAYER.walkSpeed * (buffOn(d, "speed") and 1.4 or 1) end
end

---------------------------------------------------------------- оружие и броня на герое
local function giveWeapon(plr)
	local d = data[plr]
	local ch = plr.Character
	if not d or not ch then return end
	for _, cont in ipairs({ ch, plr:FindFirstChild("Backpack") }) do
		if cont then
			for _, t in ipairs(cont:GetChildren()) do
				if t:IsA("Tool") then t:Destroy() end
			end
		end
	end
	local w = Config.WEAPONS[d.weapon] or Config.WEAPONS.sword
	local tool = Models.weaponTool(d.weapon, w.name)
	tool.Parent = ch
	tool.Unequipped:Connect(function()
		task.defer(function()
			local _, hum = aliveChar(plr)
			if hum and tool.Parent and tool.Parent:IsA("Backpack") then hum:EquipTool(tool) end
		end)
	end)
end

local function applyArmor(plr)
	local d = data[plr]
	local ch = plr.Character
	if not d or not ch then return end
	for _, p in ipairs(ch:GetChildren()) do
		if p.Name == "EldoriaArmor" then p:Destroy() end
	end
	local a = Config.ARMORS[d.armor]
	if a and a.color then Models.armorPiece(ch, a.color) end
end

---------------------------------------------------------------- опыт и уровни
local function addXP(plr, n)
	local d = data[plr]
	if not d then return end
	d.xp = d.xp + n
	local up = false
	while d.xp >= d.xpNext do
		d.xp = d.xp - d.xpNext
		d.level = d.level + 1
		d.xpNext = math.floor(d.xpNext * Config.LEVEL_UP.xpMul + 0.5)
		d.maxHp = d.maxHp + Config.LEVEL_UP.hp
		d.atk = d.atk + Config.LEVEL_UP.atk
		up = true
	end
	if up then
		local hrp, hum = aliveChar(plr)
		if hum then
			hum.MaxHealth = d.maxHp
			hum.Health = d.maxHp
		end
		notify(plr, "✦ Новый уровень: " .. d.level .. "! Здоровье и урон возросли.", Color3.fromRGB(127, 224, 127))
		if hrp then fxAll("levelup", { pos = hrp.Position }) end
	end
end

local function questProgress(plr, kind)
	local d = data[plr]
	if not d or not d.quest then return end
	local q = Config.QUESTS[d.quest.id]
	if not q or q.target ~= kind or d.quest.prog >= q.count then return end
	d.quest.prog = d.quest.prog + 1
	if d.quest.prog >= q.count then
		notify(plr, "✔ Задание «" .. q.name .. "» выполнено! Вернитесь к торговцу за наградой.", Color3.fromRGB(255, 211, 74))
	else
		notify(plr, q.name .. ": " .. d.quest.prog .. "/" .. q.count, Color3.fromRGB(220, 200, 140))
	end
end

---------------------------------------------------------------- урон по герою
Enemies.hurtPlayer = function(plr, dmg, source)
	local d = data[plr]
	local hrp, hum, ch = aliveChar(plr)
	if not d or not hum then return end
	local t = clock()
	if t < d.invulnUntil then return end
	local a = Config.ARMORS[d.armor] or Config.ARMORS.none
	local mul = (1 - a.reduce) * (buffOn(d, "guard") and 0.5 or 1)
	local final = math.max(1, math.floor(dmg * mul + 0.5))
	hum:TakeDamage(final)
	d.invulnUntil = t + 0.35
	local head = ch:FindFirstChild("Head") or hrp
	fxAll("dmg", { pos = head.Position + Vector3.new(0, 2, 0), text = "-" .. final, hero = true })
	Fx:FireClient(plr, "hurt", { source = source })
end

---------------------------------------------------------------- логово Мортракса
local lair = { boss = nil, open = false }
local gateParts = {}
for _, p in ipairs(lairInfo.gate:GetChildren()) do
	if p:IsA("BasePart") then table.insert(gateParts, { part = p, cf = p.CFrame }) end
end
local function setGate(open)
	lair.open = open
	for _, g in ipairs(gateParts) do
		local target = open and (g.cf - Vector3.new(0, 17.5, 0)) or g.cf
		TweenService:Create(g.part, TweenInfo.new(open and 2.2 or 0.3, Enum.EasingStyle.Quad), { CFrame = target }):Play()
	end
end

local function playersInLair()
	local out = {}
	for _, plr in ipairs(Players:GetPlayers()) do
		if plr:GetAttribute("Zone") == "lair" and aliveChar(plr) then table.insert(out, plr) end
	end
	return out
end

local function resetLair(bossAlive)
	Enemies.clearZone("lair")
	for i, spot in ipairs(lairInfo.guardSpots) do
		Enemies.spawn(Config.LAIR_GUARDS[i] or "skeleton", Vector3.new(spot.X, Config.LAIR_ORIGIN.Y, spot.Z), { zone = "lair" })
	end
	if bossAlive then
		local bp = lairInfo.bossPos
		lair.boss = Enemies.spawn("boss", Vector3.new(bp.X, Config.LAIR_ORIGIN.Y, bp.Z), { zone = "lair" })
		if lair.boss then
			lair.boss.home = Vector3.new(bp.X, Config.LAIR_ORIGIN.Y, bp.Z)
			lair.boss.root.CFrame = CFrame.lookAt(lair.boss.root.Position, lair.boss.root.Position - Vector3.new(1, 0, 0))
		end
		setGate(false)
	else
		lair.boss = nil
		setGate(true)
	end
end

local function enterLair(plr)
	local d = data[plr]
	local hrp = aliveChar(plr)
	if not d or not hrp then return end
	if #playersInLair() == 0 then resetLair(d.stage < 1) end
	local sp = lairInfo.spawn
	plr.Character:PivotTo(CFrame.lookAt(sp, sp + Vector3.new(1, 0, 0)))
	plr:SetAttribute("Zone", "lair")
	if lair.boss and not lair.boss.dead then
		notify(plr, Config.BOSS_TAUNT, Color3.fromRGB(255, 120, 100))
		task.delay(2.5, function() notify(plr, "☠ " .. Config.BOSS_LORE, Color3.fromRGB(214, 190, 150)) end)
	else
		notify(plr, "Логово Мортракса пусто. Решётка в Грот Шорохов открыта.", Color3.fromRGB(180, 210, 255))
	end
end

local function exitLair(plr)
	local hrp = aliveChar(plr)
	if not hrp then return end
	local p = layout.caveReturn
	plr.Character:PivotTo(CFrame.lookAt(p, layout.spawn))
	plr:SetAttribute("Zone", "ow")
end

layout.caveDoor:FindFirstChildOfClass("ProximityPrompt").Triggered:Connect(enterLair)
lairInfo.exitPart:FindFirstChildOfClass("ProximityPrompt").Triggered:Connect(exitLair)

Enemies.onBossPhase = function(rec, phase)
	for _, plr in ipairs(playersInLair()) do
		if phase == 2 then notify(plr, "Мортракс ревёт и поднимает мёртвых!", Color3.fromRGB(255, 140, 100))
		else notify(plr, "Мортракс в ярости — удары посыпались чаще!", Color3.fromRGB(255, 90, 80)) end
	end
end

---------------------------------------------------------------- награда за убийство
Enemies.onKilled = function(rec, killer)
	local kind = rec.kind
	if rec.def.boss then
		lair.boss = nil
		setGate(true)
		for _, plr in ipairs(playersInLair()) do
			local d = data[plr]
			if d then
				d.gold = d.gold + rec.gold
				d.kills.boss = (d.kills.boss or 0) + 1
				local first = d.stage < 1
				d.stage = math.max(d.stage, 1)
				addXP(plr, rec.xp)
				questProgress(plr, "boss")
				Fx:FireClient(plr, "victory", { title = "Мортракс повержен!", first = first })
				notify(plr, "☠ Мортракс повержен! В глубине логова открылся проход в Грот Шорохов. +" .. rec.gold .. " золота", Color3.fromRGB(255, 211, 74))
				if first then notify(plr, "В лавке появились копьё и кольчуга.", Color3.fromRGB(180, 220, 255)) end
				publish(plr)
				task.spawn(saveData, plr)
			end
		end
		return
	end
	if not killer then return end
	local d = data[killer]
	if not d then return end
	d.gold = d.gold + rec.gold
	d.kills[kind] = (d.kills[kind] or 0) + 1
	addXP(killer, rec.xp)
	if not rec.minion then questProgress(killer, kind) end
	Fx:FireClient(killer, "loot", { pos = rec.root.Position, gold = rec.gold, xp = rec.xp })
	publish(killer)
end

---------------------------------------------------------------- предметы на земле
local pickups = 0
local function spawnPickup(kind, pos)
	local model, hit
	if kind == "gold" then
		model, hit = Models.coins(pos, pickupFolder)
	else
		model, hit = Models.bottle(pos, Config.ELIX.small.color, pickupFolder)
	end
	pickups = pickups + 1
	local taken = false
	hit.Touched:Connect(function(other)
		if taken then return end
		local ch = other:FindFirstAncestorOfClass("Model")
		local plr = ch and Players:GetPlayerFromCharacter(ch)
		local d = plr and data[plr]
		if not d then return end
		if kind == "gold" then
			local v = math.random(3, 10)
			d.gold = d.gold + v
			Fx:FireClient(plr, "loot", { pos = hit.Position, gold = v })
		else
			if (d.elix.small or 0) >= Config.ELIX_MAX then
				notify(plr, "Больше эликсиров не унести", Color3.fromRGB(224, 201, 106))
				return
			end
			d.elix.small = d.elix.small + 1
			Fx:FireClient(plr, "loot", { pos = hit.Position, item = "Эликсир здоровья" })
		end
		taken = true
		pickups = pickups - 1
		publish(plr)
		model:Destroy()
	end)
end

local avoidPOI = {
	{ pos = layout.spawn, r = 40 },
	{ pos = layout.shopPos, r = 40 },
	{ pos = layout.cavePos, r = 30 },
}
for i = 1, 30 do
	local p = WorldGen.randomGround(avoidPOI)
	if p then spawnPickup(i <= 21 and "gold" or "elixir", p) end
end

---------------------------------------------------------------- враги на поверхности
local function spawnOverworldEnemy(extraAvoid)
	local avoid = {
		{ pos = layout.spawn, r = 72 },
		{ pos = layout.shopPos, r = 64 },
		{ pos = layout.cavePos, r = 88 },
	}
	for _, a in ipairs(extraAvoid or {}) do table.insert(avoid, a) end
	local p = WorldGen.randomGround(avoid)
	if not p then return end
	local roster = Config.OVERWORLD_ROSTER
	Enemies.spawn(roster[math.random(1, #roster)], p, { zone = "ow" })
end
for i = 1, Config.OVERWORLD_ENEMIES do spawnOverworldEnemy() end

task.spawn(function()
	while true do
		task.wait(6)
		local alive = Enemies.count("ow")
		if alive < Config.OVERWORLD_ENEMIES then
			local avoid = {}
			for _, plr in ipairs(Players:GetPlayers()) do
				local hrp = aliveChar(plr)
				if hrp then table.insert(avoid, { pos = hrp.Position, r = 80 }) end
			end
			for i = 1, math.min(3, Config.OVERWORLD_ENEMIES - alive) do spawnOverworldEnemy(avoid) end
		end
	end
end)
task.spawn(function()
	while true do
		task.wait(45)
		if pickups < 16 then
			for i = 1, 2 do
				local p = WorldGen.randomGround(avoidPOI)
				if p then spawnPickup(math.random() < 0.7 and "gold" or "elixir", p) end
			end
		end
	end
end)
-- логово возвращается в исходное состояние, когда в нём никого нет
task.spawn(function()
	local emptyFor = 0
	while true do
		task.wait(5)
		if #playersInLair() == 0 then
			emptyFor = emptyFor + 5
			if emptyFor >= 30 and Enemies.count("lair", true) > 0 then
				Enemies.clearZone("lair")
				lair.boss = nil
			end
		else
			emptyFor = 0
		end
	end
end)

---------------------------------------------------------------- торговец
local merchantPrompt = Instance.new("ProximityPrompt")
merchantPrompt.ActionText = "Торговать"
merchantPrompt.ObjectText = "Торговец"
merchantPrompt.HoldDuration = 0
merchantPrompt.MaxActivationDistance = 14
merchantPrompt.RequiresLineOfSight = false
merchantPrompt.Parent = layout.merchant:FindFirstChild("HumanoidRootPart") or layout.merchant.PrimaryPart
merchantPrompt.Triggered:Connect(function(plr)
	local d = data[plr]
	if not d then return end
	Fx:FireClient(plr, "openShop", { tip = Config.STORY_TIPS[math.min(d.stage, 1)] })
end)

local function nearShop(plr)
	local hrp = aliveChar(plr)
	return hrp and (hrp.Position - layout.shopPos).Magnitude < 45
end

---------------------------------------------------------------- действия игрока
local handlers = {}

function handlers.attack(plr, d, charged)
	local hrp, hum, ch = aliveChar(plr)
	if not hrp then return end
	local w = Config.WEAPONS[d.weapon] or Config.WEAPONS.sword
	local t = clock()
	if t - d.lastAtk < w.cooldown * 0.85 then return end
	d.lastAtk = t
	charged = charged == true
	local tool = ch:FindFirstChildOfClass("Tool")
	if tool then
		local anim = Instance.new("StringValue")
		anim.Name = "toolanim"
		anim.Value = charged and "Lunge" or w.anim
		anim.Parent = tool
		Debris:AddItem(anim, 0.5)
	end
	local base = d.atk * w.mult * (buffOn(d, "might") and 1.5 or 1) * (charged and 2 or 1)
	local range = w.range * (charged and 1.25 or 1)
	local arc = math.min(360, w.arc + (charged and 70 or 0))
	local look = Vector3.new(hrp.CFrame.LookVector.X, 0, hrp.CFrame.LookVector.Z).Unit
	local hits = 0
	for _, rec in ipairs(Enemies.list) do
		if not rec.dead and rec.root.Parent then
			local to = rec.root.Position - hrp.Position
			local flatTo = Vector3.new(to.X, 0, to.Z)
			local dist = flatTo.Magnitude
			local radius = rec.def.boss and 4.5 or 1.6 * rec.def.scale
			if dist <= range + radius and math.abs(to.Y) < 12 then
				local okAngle = dist < 2.5 or arc >= 360 or math.deg(math.acos(math.clamp(flatTo.Unit:Dot(look), -1, 1))) <= arc / 2
				if okAngle then
					local close = 1 + 0.3 * (1 - math.clamp(dist / (range + radius), 0, 1))
					local dmg = base * close * (0.9 + math.random() * 0.2)
					if Enemies.damage(rec, dmg, plr, hrp.Position, charged and 42 or 24) then hits = hits + 1 end
				end
			end
		end
	end
	fxAll("slash", { cf = hrp.CFrame, range = range, arc = arc, charged = charged, weapon = d.weapon, hit = hits > 0, by = plr.UserId })
end

function handlers.dash(plr, d)
	local t = clock()
	if t < d.dashCd then return end
	d.dashCd = t + Config.DASH.cooldown * 0.9
	d.invulnUntil = math.max(d.invulnUntil, t + Config.DASH.invuln)
end

function handlers.elixir(plr, d, k)
	local e = Config.ELIX[k]
	local hrp, hum = aliveChar(plr)
	if not e or not hum then return end
	if (d.elix[k] or 0) <= 0 then
		notify(plr, "Нет: " .. string.lower(e.name), Color3.fromRGB(224, 127, 127))
		return
	end
	if e.heal then
		if hum.Health >= hum.MaxHealth then
			notify(plr, "Здоровье уже полное", Color3.fromRGB(224, 201, 106))
			return
		end
		hum.Health = math.min(hum.MaxHealth, hum.Health + e.heal)
		notify(plr, "Выпит " .. string.lower(e.name) .. " (+" .. e.heal .. " HP)", Color3.fromRGB(127, 224, 127))
	else
		d.buffs[k] = serverNow() + e.dur
		notify(plr, e.name .. ": " .. e.desc, e.color)
		if k == "speed" then
			applySpeed(plr)
			task.delay(e.dur + 0.1, function() applySpeed(plr) end)
		end
		task.delay(e.dur + 0.1, function()
			if data[plr] and not buffOn(data[plr], k) then
				notify(plr, "Действие зелья закончилось: " .. string.lower(e.name), Color3.fromRGB(168, 157, 120))
			end
		end)
	end
	d.elix[k] = d.elix[k] - 1
	fxAll("drink", { pos = hrp.Position, color = e.color })
	publish(plr)
end

local function canUseItem(d, unlock) return (unlock or 0) <= d.stage end

function handlers.buy(plr, d, cat, id)
	if not nearShop(plr) then return end
	if cat == "weapon" then
		local w = Config.WEAPONS[id]
		if not w or d.owned[id] then return end
		if not canUseItem(d, w.unlock) then notify(plr, "Пока не продаётся", Color3.fromRGB(224, 127, 127)); return end
		if d.gold < w.price then notify(plr, "Не хватает золота", Color3.fromRGB(224, 127, 127)); return end
		d.gold = d.gold - w.price
		d.owned[id] = true
		d.weapon = id
		giveWeapon(plr)
		notify(plr, "Куплено: " .. w.name, Color3.fromRGB(127, 224, 127))
	elseif cat == "armor" then
		local a = Config.ARMORS[id]
		if not a or d.ownedArmor[id] then return end
		if not canUseItem(d, a.unlock) then notify(plr, "Пока не продаётся", Color3.fromRGB(224, 127, 127)); return end
		if d.gold < a.price then notify(plr, "Не хватает золота", Color3.fromRGB(224, 127, 127)); return end
		d.gold = d.gold - a.price
		d.ownedArmor[id] = true
		d.armor = id
		applyArmor(plr)
		notify(plr, "Куплено: " .. a.name, Color3.fromRGB(127, 224, 127))
	elseif cat == "elixir" then
		local e = Config.ELIX[id]
		if not e then return end
		if (d.elix[id] or 0) >= Config.ELIX_MAX then notify(plr, "Больше не унести", Color3.fromRGB(224, 201, 106)); return end
		if d.gold < e.price then notify(plr, "Не хватает золота", Color3.fromRGB(224, 127, 127)); return end
		d.gold = d.gold - e.price
		d.elix[id] = (d.elix[id] or 0) + 1
		notify(plr, "Куплено: " .. e.name, Color3.fromRGB(127, 224, 127))
	end
	Fx:FireClient(plr, "coin", {})
	publish(plr)
end

function handlers.sell(plr, d, cat, id)
	if not nearShop(plr) then return end
	if cat == "weapon" then
		local w = Config.WEAPONS[id]
		if not w or not d.owned[id] or id == "sword" then return end
		d.owned[id] = nil
		d.gold = d.gold + math.floor(w.price / 2)
		if d.weapon == id then d.weapon = "sword"; giveWeapon(plr) end
		notify(plr, "Продано: " .. w.name .. " (+" .. math.floor(w.price / 2) .. ")", Color3.fromRGB(255, 211, 74))
	elseif cat == "armor" then
		local a = Config.ARMORS[id]
		if not a or not d.ownedArmor[id] or id == "none" then return end
		d.ownedArmor[id] = nil
		d.gold = d.gold + math.floor(a.price / 2)
		if d.armor == id then d.armor = "none"; applyArmor(plr) end
		notify(plr, "Продано: " .. a.name .. " (+" .. math.floor(a.price / 2) .. ")", Color3.fromRGB(255, 211, 74))
	elseif cat == "elixir" then
		local e = Config.ELIX[id]
		if not e or (d.elix[id] or 0) <= 0 then return end
		d.elix[id] = d.elix[id] - 1
		d.gold = d.gold + e.sell
		notify(plr, "Продано: " .. e.name .. " (+" .. e.sell .. ")", Color3.fromRGB(255, 211, 74))
	end
	Fx:FireClient(plr, "coin", {})
	publish(plr)
end

function handlers.equip(plr, d, cat, id)
	if cat == "weapon" and d.owned[id] and Config.WEAPONS[id] then
		d.weapon = id
		giveWeapon(plr)
	elseif cat == "armor" and d.ownedArmor[id] and Config.ARMORS[id] then
		d.armor = id
		applyArmor(plr)
	end
	publish(plr)
end

function handlers.quest(plr, d, op, id)
	local q = Config.QUESTS[id]
	if not q then return end
	if op == "take" then
		if d.quest or d.done[id] then return end
		d.quest = { id = id, prog = 0 }
		notify(plr, "Новое задание: " .. q.name, Color3.fromRGB(255, 211, 74))
	elseif op == "cancel" then
		if d.quest and d.quest.id == id then
			d.quest = nil
			notify(plr, "Задание отменено", Color3.fromRGB(200, 190, 160))
		end
	elseif op == "claim" then
		if not nearShop(plr) or not d.quest or d.quest.id ~= id or d.quest.prog < q.count then return end
		d.gold = d.gold + q.gold
		d.elix.small = math.min(Config.ELIX_MAX, (d.elix.small or 0) + q.elix)
		d.done[id] = true
		d.quest = nil
		notify(plr, "Награда: +" .. q.gold .. " золота, эликсиров: " .. q.elix, Color3.fromRGB(255, 211, 74))
		Fx:FireClient(plr, "coin", {})
		task.spawn(saveData, plr)
	end
	publish(plr)
end

function handlers.intro(plr, d)
	d.intro = true
	publish(plr)
end

function handlers.save(plr, d)
	if clock() - (d.lastManualSave or -1e9) < 15 then
		notify(plr, "Сохранение уже сделано недавно", Color3.fromRGB(224, 201, 106))
		return
	end
	d.lastManualSave = clock()
	if store and saveData(plr) then
		notify(plr, "Прогресс сохранён", Color3.fromRGB(127, 224, 127))
	else
		notify(plr, "Сохранение недоступно: опубликуйте игру и включите доступ к API в настройках", Color3.fromRGB(224, 127, 127))
	end
end

Action.OnServerEvent:Connect(function(plr, kind, a, b)
	if type(kind) ~= "string" then return end
	local d = data[plr]
	local h = handlers[kind]
	if not d or not h then return end
	local ok, err = pcall(h, plr, d, a, b)
	if not ok then warn("Eldoria action " .. kind .. ":", err) end
end)

---------------------------------------------------------------- игроки
local worldReady = true

local function onCharacter(plr, ch)
	local d = data[plr]
	local hum = ch:WaitForChild("Humanoid")
	ch:WaitForChild("HumanoidRootPart")
	plr:SetAttribute("Zone", "ow")
	hum.MaxHealth = d.maxHp
	hum.Health = d.maxHp
	hum.BreakJointsOnDeath = false
	applySpeed(plr)
	giveWeapon(plr)
	applyArmor(plr)
	hum.Died:Connect(function()
		local lose = math.floor(d.gold * 0.1)
		d.gold = d.gold - lose
		notify(plr, "Вы пали… Потеряно " .. lose .. " золота. Возвращение через несколько секунд.", Color3.fromRGB(224, 110, 110))
		publish(plr)
		task.delay(4, function()
			if plr.Parent then plr:LoadCharacter() end
		end)
	end)
end

local function onPlayerAdded(plr)
	local ls = Instance.new("Folder")
	ls.Name = "leaderstats"
	local lv = Instance.new("IntValue")
	lv.Name = "Уровень"
	lv.Parent = ls
	local gd = Instance.new("IntValue")
	gd.Name = "Золото"
	gd.Parent = ls
	ls.Parent = plr
	data[plr] = loadData(plr)
	publish(plr)
	plr.CharacterAdded:Connect(function(ch) onCharacter(plr, ch) end)
	if worldReady and plr.Parent then plr:LoadCharacter() end
end

Players.PlayerAdded:Connect(onPlayerAdded)
for _, plr in ipairs(Players:GetPlayers()) do task.spawn(onPlayerAdded, plr) end

Players.PlayerRemoving:Connect(function(plr)
	saveData(plr)
	data[plr] = nil
end)

game:BindToClose(function()
	for _, plr in ipairs(Players:GetPlayers()) do saveData(plr) end
end)

task.spawn(function()
	while true do
		task.wait(90)
		for _, plr in ipairs(Players:GetPlayers()) do task.spawn(saveData, plr) end
	end
end)

print("Хроники Эльдории " .. Config.BUILD .. ": мир готов")
