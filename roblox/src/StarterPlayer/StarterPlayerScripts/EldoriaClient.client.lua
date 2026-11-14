-- The Legend of Eldoria для Roblox — клиент: интерфейс, управление, эффекты
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local ContextActionService = game:GetService("ContextActionService")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local StarterGui = game:GetService("StarterGui")
local SoundService = game:GetService("SoundService")
local Lighting = game:GetService("Lighting")
local Debris = game:GetService("Debris")

local player = Players.LocalPlayer
local Eldoria = ReplicatedStorage:WaitForChild("Eldoria")
local Config = require(Eldoria:WaitForChild("Config"))
local Remotes = Eldoria:WaitForChild("Remotes")
local Action = Remotes:WaitForChild("Action")
local NotifyEv = Remotes:WaitForChild("Notify")
local FxEv = Remotes:WaitForChild("Fx")

task.spawn(function()
	for i = 1, 20 do
		local ok = pcall(function() StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false) end)
		if ok then break end
		task.wait(0.5)
	end
end)

---------------------------------------------------------------- оформление
local C = {
	panel = Color3.fromRGB(24, 19, 14), gold = Color3.fromRGB(201, 160, 82), text = Color3.fromRGB(242, 230, 200),
	dim = Color3.fromRGB(176, 160, 128), parch = Color3.fromRGB(233, 216, 172), ink = Color3.fromRGB(66, 44, 24),
	btn = Color3.fromRGB(112, 72, 38), btnHover = Color3.fromRGB(138, 92, 48), red = Color3.fromRGB(200, 52, 52),
	green = Color3.fromRGB(127, 224, 127), blue = Color3.fromRGB(80, 140, 230),
}
local FONT = Enum.Font.GothamMedium
local FONT_B = Enum.Font.GothamBold
local FONT_T = Enum.Font.Merriweather

local function new(class, props, parent)
	local o = Instance.new(class)
	for k, v in pairs(props or {}) do o[k] = v end
	if parent then o.Parent = parent end
	return o
end
local function corner(p, r) return new("UICorner", { CornerRadius = UDim.new(0, r or 8) }, p) end
local function stroke(p, col, th, tr)
	return new("UIStroke", { Color = col or C.gold, Thickness = th or 1.5, Transparency = tr or 0.2, ApplyStrokeMode = Enum.ApplyStrokeMode.Border }, p)
end
local function label(props, parent)
	local t = new("TextLabel", { BackgroundTransparency = 1, Font = FONT, TextColor3 = C.text, TextSize = 14, TextXAlignment = Enum.TextXAlignment.Left }, parent)
	for k, v in pairs(props) do t[k] = v end
	return t
end
local function button(text, parent, onClick, props)
	local b = new("TextButton", { Text = text, Font = FONT_B, TextSize = 14, TextColor3 = C.text, BackgroundColor3 = C.btn, AutoButtonColor = true, Size = UDim2.fromOffset(110, 32) }, parent)
	corner(b, 7)
	stroke(b, C.gold, 1, 0.4)
	for k, v in pairs(props or {}) do b[k] = v end
	b.Activated:Connect(onClick)
	return b
end

local gui = new("ScreenGui", { Name = "EldoriaUI", ResetOnSpawn = false, ZIndexBehavior = Enum.ZIndexBehavior.Sibling, IgnoreGuiInset = false }, player:WaitForChild("PlayerGui"))
local uiScales = {}
local function scaled(obj)
	table.insert(uiScales, new("UIScale", {}, obj))
	return obj
end
local function rescale()
	local cam = workspace.CurrentCamera
	if not cam then return end
	local v = cam.ViewportSize
	local k = math.clamp(math.min(v.X / 980, v.Y / 560), 0.58, 1.15)
	for _, u in ipairs(uiScales) do u.Scale = k end
end
workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(rescale)
-- левый верхний угол: панель героя, мини-карта, эликсиры, цель, сообщения
local topLeft = scaled(new("Frame", { Name = "TopLeft", Size = UDim2.fromOffset(440, 420), BackgroundTransparency = 1 }, gui))

---------------------------------------------------------------- звуки (встроенные в клиент Roblox)
local SFX = {
	swing = "rbxasset://sounds/swordslash.wav",
	lunge = "rbxasset://sounds/swordlunge.wav",
	equip = "rbxasset://sounds/unsheath.wav",
	coin = "rbxasset://sounds/electronicpingshort.wav",
}
local function play(name, vol, pitch)
	local id = SFX[name]
	if not id then return end
	local s = new("Sound", { SoundId = id, Volume = vol or 0.6, PlaybackSpeed = pitch or 1 }, SoundService)
	s:Play()
	Debris:AddItem(s, 3)
end

---------------------------------------------------------------- панель героя
local hud = new("Frame", { Name = "Hud", Position = UDim2.fromOffset(12, 10), Size = UDim2.fromOffset(268, 96), BackgroundColor3 = C.panel, BackgroundTransparency = 0.18 }, topLeft)
corner(hud, 10)
stroke(hud)
local lvlLabel = label({ Position = UDim2.fromOffset(12, 6), Size = UDim2.fromOffset(150, 20), Font = FONT_B, TextSize = 16, Text = "Ур. 1" }, hud)
local coin = new("Frame", { Position = UDim2.new(1, -96, 0, 9), Size = UDim2.fromOffset(14, 14), BackgroundColor3 = Color3.fromRGB(255, 186, 40) }, hud)
corner(coin, 7)
stroke(coin, Color3.fromRGB(150, 96, 20), 1.5, 0)
local goldLabel = label({ Position = UDim2.new(1, -78, 0, 6), Size = UDim2.fromOffset(70, 20), Font = FONT_B, TextSize = 16, Text = "0", TextColor3 = Color3.fromRGB(255, 214, 110) }, hud)
local function bar(y, h, col)
	local bg = new("Frame", { Position = UDim2.fromOffset(12, y), Size = UDim2.new(1, -24, 0, h), BackgroundColor3 = Color3.fromRGB(50, 38, 30), BorderSizePixel = 0 }, hud)
	corner(bg, 5)
	local fill = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = col, BorderSizePixel = 0 }, bg)
	corner(fill, 5)
	local t = label({ Size = UDim2.fromScale(1, 1), TextXAlignment = Enum.TextXAlignment.Center, TextSize = h > 12 and 13 or 10, Font = FONT_B, TextStrokeTransparency = 0.5 }, bg)
	return fill, t
end
local hpFill, hpText = bar(30, 18, C.red)
local xpFill, xpText = bar(52, 11, C.blue)
local gearLabel = label({ Position = UDim2.fromOffset(12, 68), Size = UDim2.new(1, -24, 0, 20), TextSize = 12, TextColor3 = C.dim, Text = "" }, hud)

---------------------------------------------------------------- мини-карта с туманом
local mapFrame = new("Frame", { Name = "Minimap", Position = UDim2.fromOffset(288, 10), Size = UDim2.fromOffset(124, 124), BackgroundColor3 = Color3.fromRGB(20, 26, 18), BackgroundTransparency = 0.35, ClipsDescendants = true }, topLeft)
corner(mapFrame, 10)
stroke(mapFrame)
local mapInner = new("Frame", { Position = UDim2.fromOffset(4, 4), Size = UDim2.new(1, -8, 1, -8), BackgroundTransparency = 1 }, mapFrame)
local lairMapText = label({ Size = UDim2.fromScale(1, 1), TextXAlignment = Enum.TextXAlignment.Center, Text = "Логово\nМортракса", Font = FONT_T, TextColor3 = C.dim, Visible = false, TextWrapped = true }, mapFrame)
local fogCells = {}
local FOG = 24
local MAP_COLORS = {
	["~"] = Color3.fromRGB(64, 124, 190), ["^"] = Color3.fromRGB(92, 88, 92), P = Color3.fromRGB(156, 126, 84),
}
local mapN = Config.MAP_N
local shopDot, caveDot, meDot
task.spawn(function()
	local md = Eldoria:WaitForChild("MapData")
	local s = md.Value
	mapN = md:GetAttribute("N") or Config.MAP_N
	local n = mapN
	new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(72, 112, 54), BackgroundTransparency = 0.3, BorderSizePixel = 0 }, mapInner)
	for z = 1, n do
		local row = string.sub(s, (z - 1) * n + 1, z * n)
		local x = 1
		while x <= n do
			local ch = string.sub(row, x, x)
			local col = MAP_COLORS[ch]
			local x2 = x
			while x2 < n and string.sub(row, x2 + 1, x2 + 1) == ch do x2 = x2 + 1 end
			if col then
				new("Frame", { Position = UDim2.fromScale((x - 1) / n, (z - 1) / n), Size = UDim2.fromScale((x2 - x + 1) / n, 1.02 / n), BackgroundColor3 = col, BackgroundTransparency = 0.25, BorderSizePixel = 0 }, mapInner)
			end
			x = x2 + 1
		end
	end
	local function dot(cx, cz, col, size)
		local d = new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale((cx - 0.5) / n, (cz - 0.5) / n), Size = UDim2.fromOffset(size, size), BackgroundColor3 = col, ZIndex = 3 }, mapInner)
		corner(d, size)
		stroke(d, Color3.fromRGB(20, 14, 10), 1, 0.2)
		return d
	end
	shopDot = dot(md:GetAttribute("ShopX"), md:GetAttribute("ShopZ"), Color3.fromRGB(230, 50, 50), 8)
	caveDot = dot(md:GetAttribute("CaveX"), md:GetAttribute("CaveZ"), Color3.fromRGB(140, 86, 42), 9)
	for fz = 1, FOG do
		fogCells[fz] = {}
		for fx = 1, FOG do
			fogCells[fz][fx] = new("Frame", { Position = UDim2.fromScale((fx - 1) / FOG, (fz - 1) / FOG), Size = UDim2.fromScale(1.02 / FOG, 1.02 / FOG), BackgroundColor3 = Color3.fromRGB(16, 14, 12), BackgroundTransparency = 0.05, BorderSizePixel = 0, ZIndex = 2 }, mapInner)
		end
	end
	meDot = dot(n / 2, n / 2, Color3.fromRGB(255, 255, 255), 7)
	meDot.ZIndex = 5
end)

---------------------------------------------------------------- эликсиры и зелья (клавиши 1–5)
local slotsFrame = new("Frame", { Position = UDim2.fromOffset(12, 112), Size = UDim2.fromOffset(268, 48), BackgroundTransparency = 1 }, topLeft)
new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6) }, slotsFrame)
local slots = {}
for i, k in ipairs(Config.ELIX_ORDER) do
	local e = Config.ELIX[k]
	local b = new("TextButton", { Text = "", Size = UDim2.fromOffset(48, 48), BackgroundColor3 = C.panel, BackgroundTransparency = 0.18, AutoButtonColor = true, LayoutOrder = i }, slotsFrame)
	corner(b, 8)
	stroke(b, C.gold, 1.2, 0.35)
	local bulb = new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.58), Size = UDim2.fromOffset(20, 20), BackgroundColor3 = e.color }, b)
	corner(bulb, 10)
	stroke(bulb, Color3.fromRGB(20, 10, 20), 1, 0.2)
	new("Frame", { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.fromScale(0.5, 0.4), Size = UDim2.fromOffset(6, 8), BackgroundColor3 = Color3.fromRGB(217, 230, 238), BorderSizePixel = 0 }, b)
	new("Frame", { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 0.4, -7), Size = UDim2.fromOffset(8, 4), BackgroundColor3 = Color3.fromRGB(138, 90, 43), BorderSizePixel = 0 }, b)
	label({ Position = UDim2.fromOffset(4, 1), Size = UDim2.fromOffset(14, 14), Text = tostring(i), TextSize = 11, TextColor3 = C.dim, Font = FONT_B }, b)
	local cnt = label({ AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -4, 1, -1), Size = UDim2.fromOffset(24, 14), Text = "0", TextSize = 12, Font = FONT_B, TextXAlignment = Enum.TextXAlignment.Right, TextStrokeTransparency = 0.4 }, b)
	local timer = label({ Size = UDim2.fromScale(1, 1), TextXAlignment = Enum.TextXAlignment.Center, Text = "", TextSize = 15, Font = FONT_B, TextColor3 = Color3.fromRGB(255, 255, 255), TextStrokeTransparency = 0, Visible = false, BackgroundColor3 = Color3.fromRGB(0, 0, 0), BackgroundTransparency = 0.5 }, b)
	corner(timer, 8)
	b.Activated:Connect(function() Action:FireServer("elixir", k) end)
	slots[k] = { btn = b, count = cnt, timer = timer }
end

local tracker = label({ Position = UDim2.fromOffset(14, 166), Size = UDim2.fromOffset(400, 40), TextSize = 13, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top, TextStrokeTransparency = 0.45, Text = "" }, topLeft)

---------------------------------------------------------------- лента сообщений
local feed = new("Frame", { Position = UDim2.fromOffset(12, 212), Size = UDim2.fromOffset(420, 200), BackgroundTransparency = 1 }, topLeft)
new("UIListLayout", { Padding = UDim.new(0, 3), VerticalAlignment = Enum.VerticalAlignment.Top, SortOrder = Enum.SortOrder.LayoutOrder }, feed)
local feedN = 0
local function addNote(text, color)
	feedN = feedN + 1
	local t = label({ Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, TextWrapped = true, Text = text, TextColor3 = color or C.text, TextSize = 14, Font = FONT_B, TextStrokeTransparency = 0.35, LayoutOrder = feedN }, feed)
	local kids = {}
	for _, c in ipairs(feed:GetChildren()) do if c:IsA("TextLabel") then table.insert(kids, c) end end
	if #kids > 6 then
		table.sort(kids, function(a, b) return a.LayoutOrder < b.LayoutOrder end)
		kids[1]:Destroy()
	end
	task.delay(6, function()
		if t.Parent then
			TweenService:Create(t, TweenInfo.new(0.8), { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
			Debris:AddItem(t, 0.9)
		end
	end)
end
NotifyEv.OnClientEvent:Connect(addNote)

---------------------------------------------------------------- полоса здоровья босса
local bossBar = new("Frame", { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 10), Size = UDim2.fromOffset(440, 46), BackgroundColor3 = C.panel, BackgroundTransparency = 0.15, Visible = false }, gui)
scaled(bossBar)
corner(bossBar, 8)
stroke(bossBar, Color3.fromRGB(180, 50, 50))
local bossName = label({ Position = UDim2.fromOffset(12, 3), Size = UDim2.new(1, -24, 0, 18), Font = FONT_T, TextSize = 15, TextXAlignment = Enum.TextXAlignment.Center, Text = "Мортракс — Владыка костей", TextColor3 = Color3.fromRGB(255, 200, 180) }, bossBar)
local bossBg = new("Frame", { Position = UDim2.fromOffset(12, 24), Size = UDim2.new(1, -24, 0, 14), BackgroundColor3 = Color3.fromRGB(50, 30, 30), BorderSizePixel = 0 }, bossBar)
corner(bossBg, 5)
local bossFill = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(190, 40, 40), BorderSizePixel = 0 }, bossBg)
corner(bossFill, 5)

---------------------------------------------------------------- индикатор сильного удара и вспышка ранения
local chargeBg = new("Frame", { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -110), Size = UDim2.fromOffset(160, 10), BackgroundColor3 = Color3.fromRGB(30, 24, 18), Visible = false }, gui)
corner(chargeBg, 5)
stroke(chargeBg, C.gold, 1, 0.3)
local chargeFill = new("Frame", { Size = UDim2.fromScale(0, 1), BackgroundColor3 = Color3.fromRGB(255, 220, 120), BorderSizePixel = 0 }, chargeBg)
corner(chargeFill, 5)
local hurtFlash = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(180, 0, 0), BackgroundTransparency = 1, ZIndex = 0, Active = false }, gui)

---------------------------------------------------------------- кнопка меню
local menuBtn = button("☰ Меню", gui, function() end, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -4, 0, 4), Size = UDim2.fromOffset(96, 34) })
scaled(menuBtn)

---------------------------------------------------------------- лавка
local shop = new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.52), Size = UDim2.fromOffset(600, 440), BackgroundColor3 = Color3.fromRGB(40, 30, 22), Visible = false, ZIndex = 10 }, gui)
scaled(shop)
corner(shop, 12)
stroke(shop, C.gold, 2, 0)
label({ Position = UDim2.fromOffset(18, 10), Size = UDim2.fromOffset(300, 28), Text = "Лавка торговца", Font = FONT_T, TextSize = 22, TextColor3 = Color3.fromRGB(240, 210, 150), ZIndex = 10 }, shop)
local shopGold = label({ Position = UDim2.new(1, -230, 0, 14), Size = UDim2.fromOffset(160, 22), TextXAlignment = Enum.TextXAlignment.Right, Font = FONT_B, TextSize = 16, TextColor3 = Color3.fromRGB(255, 214, 110), ZIndex = 10 }, shop)
button("✕", shop, function() shop.Visible = false end, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -10, 0, 8), Size = UDim2.fromOffset(40, 32), ZIndex = 10 })
local shopTip = label({ Position = UDim2.fromOffset(18, 42), Size = UDim2.new(1, -36, 0, 36), TextWrapped = true, TextSize = 13, TextColor3 = C.dim, Font = Enum.Font.Gotham, ZIndex = 10, TextYAlignment = Enum.TextYAlignment.Top }, shop)
local tabsFrame = new("Frame", { Position = UDim2.fromOffset(18, 82), Size = UDim2.new(1, -36, 0, 32), BackgroundTransparency = 1, ZIndex = 10 }, shop)
new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6) }, tabsFrame)
local list = new("ScrollingFrame", { Position = UDim2.fromOffset(18, 122), Size = UDim2.new(1, -36, 1, -136), BackgroundTransparency = 1, ScrollBarThickness = 6, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y, ZIndex = 10, ScrollingDirection = Enum.ScrollingDirection.Y }, shop)
new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }, list)
local currentTab = "weapon"
local tabButtons = {}

local function attr(n, def)
	local v = player:GetAttribute(n)
	if v == nil then return def end
	return v
end
local function csvHas(csv, k)
	for item in string.gmatch(csv or "", "[^,]+") do if item == k then return true end end
	return false
end

local function shopRow(order, title, desc, right)
	local row = new("Frame", { Size = UDim2.new(1, -8, 0, 62), BackgroundColor3 = Color3.fromRGB(58, 44, 32), LayoutOrder = order, ZIndex = 10 }, list)
	corner(row, 8)
	label({ Position = UDim2.fromOffset(12, 6), Size = UDim2.new(1, -250, 0, 20), Text = title, Font = FONT_B, TextSize = 15, ZIndex = 10 }, row)
	label({ Position = UDim2.fromOffset(12, 26), Size = UDim2.new(1, -250, 0, 32), Text = desc, TextSize = 12, TextWrapped = true, TextColor3 = C.dim, Font = Enum.Font.Gotham, TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 10 }, row)
	local r = new("Frame", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -10, 0.5, 0), Size = UDim2.fromOffset(236, 34), BackgroundTransparency = 1, ZIndex = 10 }, row)
	new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, HorizontalAlignment = Enum.HorizontalAlignment.Right, VerticalAlignment = Enum.VerticalAlignment.Center, Padding = UDim.new(0, 6) }, r)
	for i, item in ipairs(right) do
		if item.text and not item.fn then
			label({ Size = UDim2.fromOffset(item.w or 110, 30), Text = item.text, TextSize = 12, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Right, TextColor3 = item.color or C.dim, LayoutOrder = i, ZIndex = 10, Font = FONT_B }, r)
		else
			button(item.label, r, item.fn, { Size = UDim2.fromOffset(item.w or 110, 30), LayoutOrder = i, ZIndex = 10, TextSize = 13 })
		end
	end
	return row
end

local function lockText(unlock)
	return "🔒 После победы над стражем №" .. unlock .. ": " .. (Config.BOSS_NAMES[unlock] or "?")
end

local function renderShop()
	for _, c in ipairs(list:GetChildren()) do if not c:IsA("UIListLayout") then c:Destroy() end end
	for id, b in pairs(tabButtons) do b.BackgroundColor3 = (id == currentTab) and C.btnHover or C.btn end
	local gold = attr("Gold", 0)
	local stage = attr("Stage", 0)
	shopGold.Text = "Золото: " .. gold
	if currentTab == "weapon" then
		for i, id in ipairs(Config.WEAPON_ORDER) do
			local w = Config.WEAPONS[id]
			local owned = csvHas(attr("Owned", ""), id)
			local right = {}
			if attr("Weapon", "") == id then
				table.insert(right, { text = "В руках", color = C.green, w = 90 })
				if id ~= "sword" then table.insert(right, { label = "Продать " .. math.floor(w.price / 2), fn = function() Action:FireServer("sell", "weapon", id) end }) end
			elseif owned then
				table.insert(right, { label = "Взять", fn = function() Action:FireServer("equip", "weapon", id) end, w = 90 })
				if id ~= "sword" then table.insert(right, { label = "Продать " .. math.floor(w.price / 2), fn = function() Action:FireServer("sell", "weapon", id) end }) end
			elseif stage < w.unlock then
				table.insert(right, { text = lockText(w.unlock), w = 230 })
			else
				table.insert(right, { label = "Купить · " .. w.price, fn = function() Action:FireServer("buy", "weapon", id) end, w = 130 })
			end
			shopRow(i, w.name .. "  ·  урон ×" .. w.mult, w.desc, right)
		end
	elseif currentTab == "armor" then
		for i, id in ipairs(Config.ARMOR_ORDER) do
			local a = Config.ARMORS[id]
			local owned = csvHas(attr("OwnedArmor", "none"), id)
			local right = {}
			if attr("Armor", "none") == id then
				table.insert(right, { text = "Надето", color = C.green, w = 90 })
				if id ~= "none" then table.insert(right, { label = "Продать " .. math.floor(a.price / 2), fn = function() Action:FireServer("sell", "armor", id) end }) end
			elseif owned then
				table.insert(right, { label = "Надеть", fn = function() Action:FireServer("equip", "armor", id) end, w = 90 })
				if id ~= "none" then table.insert(right, { label = "Продать " .. math.floor(a.price / 2), fn = function() Action:FireServer("sell", "armor", id) end }) end
			elseif stage < a.unlock then
				table.insert(right, { text = lockText(a.unlock), w = 230 })
			else
				table.insert(right, { label = "Купить · " .. a.price, fn = function() Action:FireServer("buy", "armor", id) end, w = 130 })
			end
			local prot = a.reduce > 0 and ("  ·  защита " .. math.floor(a.reduce * 100) .. "%") or ""
			shopRow(i, a.name .. prot, a.desc, right)
		end
	elseif currentTab == "elixir" then
		for i, id in ipairs(Config.ELIX_ORDER) do
			local e = Config.ELIX[id]
			local n = attr("E_" .. id, 0)
			local right = { { label = "Купить · " .. e.price, fn = function() Action:FireServer("buy", "elixir", id) end, w = 116 } }
			if n > 0 then table.insert(right, { label = "Продать " .. e.sell, fn = function() Action:FireServer("sell", "elixir", id) end, w = 104 }) end
			shopRow(i, e.name .. "  ·  в сумке: " .. n, e.desc .. "  Клавиша " .. i .. ".", right)
		end
	else
		local active = attr("Quest", "")
		local prog = attr("QuestProg", 0)
		local done = attr("QuestsDone", "")
		for i, id in ipairs(Config.QUEST_ORDER) do
			local q = Config.QUESTS[id]
			local right = {}
			local desc = q.desc .. "  Награда: " .. q.gold .. " золота, эликсиров: " .. q.elix .. "."
			if csvHas(done, id) then
				table.insert(right, { text = "✔ Выполнено", color = C.green, w = 120 })
			elseif active == id then
				if prog >= q.count then
					table.insert(right, { label = "Получить Вознаграждение", fn = function() Action:FireServer("quest", "claim", id) end, w = 200 })
				else
					table.insert(right, { text = prog .. " / " .. q.count, color = Color3.fromRGB(255, 211, 74), w = 60 })
					table.insert(right, { label = "Отменить", fn = function() Action:FireServer("quest", "cancel", id) end, w = 100 })
				end
			elseif active ~= "" then
				table.insert(right, { text = "Сначала завершите текущее задание", w = 200 })
			else
				table.insert(right, { label = "Взять задание", fn = function() Action:FireServer("quest", "take", id) end, w = 130 })
			end
			shopRow(i, q.name, desc, right)
		end
	end
end

for i, tab in ipairs({ { "weapon", "Оружие" }, { "armor", "Броня" }, { "elixir", "Эликсиры и зелья" }, { "quest", "Задания" } }) do
	tabButtons[tab[1]] = button(tab[2], tabsFrame, function()
		currentTab = tab[1]
		renderShop()
	end, { LayoutOrder = i, Size = UDim2.fromOffset(tab[1] == "elixir" and 160 or 110, 30), ZIndex = 10 })
end

local function openShop(tip)
	shopTip.Text = "Торговец: «" .. (tip or "") .. "»"
	shop.Visible = true
	renderShop()
end

---------------------------------------------------------------- меню-свиток
local menu = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(0, 0, 0), BackgroundTransparency = 0.35, Visible = false, ZIndex = 20, Active = true }, gui)
local scroll = scaled(new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(520, 420), BackgroundColor3 = C.parch, ZIndex = 21 }, menu))
-- номер сборки — на тёмной плашке над пергаментом
local menuBuild = label({ AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 0, -16), Size = UDim2.fromOffset(300, 22), BackgroundTransparency = 0.1, BackgroundColor3 = Color3.fromRGB(16, 12, 8), TextXAlignment = Enum.TextXAlignment.Center, TextSize = 12, TextColor3 = C.dim, Text = "Сборка " .. Config.BUILD .. " · Roblox", ZIndex = 21 }, scroll)
corner(menuBuild, 6)
corner(scroll, 6)
stroke(scroll, Color3.fromRGB(120, 84, 40), 3, 0)
for _, y in ipairs({ 0, 1 }) do
	local rod = new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, y), Size = UDim2.new(1, 36, 0, 18), BackgroundColor3 = Color3.fromRGB(122, 82, 44), ZIndex = 22 }, scroll)
	corner(rod, 9)
	stroke(rod, Color3.fromRGB(70, 44, 20), 2, 0)
end
-- вьющийся орнамент по краям свитка
for _, x in ipairs({ 0.035, 0.965 }) do
	for k = 0, 9 do
		local leaf = new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(x, math.sin(k * 1.3) * 6, 0, 30 + k * 38), Size = UDim2.fromOffset(9, 14), Rotation = (k % 2 == 0) and 35 or -35, BackgroundColor3 = Color3.fromRGB(96, 130, 66), BackgroundTransparency = 0.15, ZIndex = 22 }, scroll)
		corner(leaf, 7)
	end
end
label({ Position = UDim2.fromOffset(30, 20), Size = UDim2.new(1, -60, 0, 36), Text = Config.TITLE, Font = FONT_T, TextSize = 30, TextColor3 = C.ink, TextXAlignment = Enum.TextXAlignment.Center, ZIndex = 22 }, scroll)
local menuSub = label({ Position = UDim2.fromOffset(30, 56), Size = UDim2.new(1, -60, 0, 18), Text = "Глава I. Логово Мортракса", Font = FONT_T, TextSize = 14, TextColor3 = Color3.fromRGB(120, 84, 40), TextXAlignment = Enum.TextXAlignment.Center, ZIndex = 22 }, scroll)
local menuBody = label({ Position = UDim2.fromOffset(40, 84), Size = UDim2.new(1, -80, 0, 210), Text = "", Font = Enum.Font.Merriweather, TextSize = 14, TextColor3 = C.ink, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 22 }, scroll)
local menuButtons = new("Frame", { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -22), Size = UDim2.fromOffset(380, 78), BackgroundTransparency = 1, ZIndex = 22 }, scroll)
new("UIGridLayout", { CellSize = UDim2.fromOffset(186, 34), CellPadding = UDim2.fromOffset(8, 8), HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder }, menuButtons)

local CONTROLS = "Компьютер: WASD — ходьба, мышь — камера, ЛКМ или F — удар (удерживайте для сильного удара), Q — рывок с неуязвимостью, 1–5 — эликсиры и зелья, E — торговать или войти.\n\n"
	.. "Телефон: джойстик слева, кнопка ⚔ — удар (удерживайте для сильного), » — рывок, касание слотов — выпить эликсир.\n\n"
	.. "Геймпад: R2 или X — удар, L1 — рывок.\n\nСоветы: чем ближе враг, тем больнее удар. Красный круг на земле — сейчас будет удар Мортракса, отбегите!"

local function menuPage(kind)
	for _, c in ipairs(menuButtons:GetChildren()) do if c:IsA("TextButton") then c:Destroy() end end
	local function mb(text, order, fn)
		button(text, menuButtons, fn, { LayoutOrder = order, ZIndex = 23, TextSize = 14 })
	end
	if kind == "intro" then
		menuSub.Text = "Глава I. Логово Мортракса"
		menuBody.Text = table.concat(Config.STORY_INTRO, "\n\n")
		mb("В путь", 1, function()
			menu.Visible = false
			Action:FireServer("intro")
		end)
		mb("Управление", 2, function() menuPage("controls") end)
	elseif kind == "controls" then
		menuSub.Text = "Управление"
		menuBody.Text = CONTROLS
		mb("Назад", 1, function() menuPage("main") end)
		mb("Продолжить", 2, function() menu.Visible = false end)
	else
		menuSub.Text = "Глава I. Логово Мортракса"
		local saved = attr("SavedAt", nil)
		local tip = Config.STORY_TIPS[math.min(attr("Stage", 0), 1)]
		menuBody.Text = "Уровень героя: " .. attr("Level", 1) .. "   ·   Золото: " .. attr("Gold", 0) .. "\n\n" .. tip .. "\n\nПоследнее сохранение: " .. (saved or "ещё не было (сохраняется автоматически)")
		mb("Продолжить", 1, function() menu.Visible = false end)
		mb("Управление", 2, function() menuPage("controls") end)
		mb("История", 3, function() menuPage("intro") end)
		mb("Сохранить", 4, function()
			Action:FireServer("save")
			task.delay(1.5, function() if menu.Visible then menuPage("main") end end)
		end)
	end
end
menuBtn.Activated:Connect(function()
	if menu.Visible then menu.Visible = false else menu.Visible = true; menuPage("main") end
end)
task.spawn(function()
	local t = 0
	while player:GetAttribute("IntroSeen") == nil and t < 90 do t = t + task.wait(0.2) end
	if player:GetAttribute("IntroSeen") ~= true then
		menu.Visible = true
		menuPage("intro")
	end
end)

---------------------------------------------------------------- победа
local function victory(title)
	local banner = label({ AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.32), Size = UDim2.new(0.9, 0, 0, 60), Text = title, Font = FONT_T, TextScaled = true, TextColor3 = Color3.fromRGB(255, 214, 110), TextStrokeTransparency = 0.2, TextXAlignment = Enum.TextXAlignment.Center, ZIndex = 15, TextTransparency = 1 }, gui)
	TweenService:Create(banner, TweenInfo.new(0.6), { TextTransparency = 0 }):Play()
	task.delay(4.5, function()
		TweenService:Create(banner, TweenInfo.new(1), { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
		Debris:AddItem(banner, 1.1)
	end)
end

---------------------------------------------------------------- обновление интерфейса из атрибутов
local function refresh()
	lvlLabel.Text = "Ур. " .. attr("Level", 1) .. "  ·  " .. player.DisplayName
	goldLabel.Text = tostring(attr("Gold", 0))
	local xp, xpn = attr("XP", 0), attr("XPNext", 50)
	xpFill.Size = UDim2.fromScale(math.clamp(xp / math.max(1, xpn), 0, 1), 1)
	xpText.Text = "опыт " .. xp .. " / " .. xpn
	local w = Config.WEAPONS[attr("Weapon", "sword")]
	local a = Config.ARMORS[attr("Armor", "none")]
	gearLabel.Text = (w and w.name or "") .. "  ·  " .. (a and a.name or "")
	for _, k in ipairs(Config.ELIX_ORDER) do slots[k].count.Text = tostring(attr("E_" .. k, 0)) end
	-- цель и задание
	local stage = attr("Stage", 0)
	local goal = stage < 1 and "Цель: найдите логово Мортракса (коричневая точка на карте) и победите его" or "Цель: Грот Шорохов — продолжение пути в следующей сборке"
	local q = Config.QUESTS[attr("Quest", "")]
	if q then
		local prog = attr("QuestProg", 0)
		if prog >= q.count then goal = goal .. "\nЗадание «" .. q.name .. "» выполнено — к торговцу (красная точка)"
		else goal = goal .. "\nЗадание: " .. q.name .. " — " .. prog .. "/" .. q.count end
	end
	tracker.Text = goal
	if shop.Visible then renderShop() end
end
player.AttributeChanged:Connect(function(name)
	if name ~= "Zone" then refresh() end
end)
refresh()

---------------------------------------------------------------- атака и рывок
local attackHeld, holdStart, lastSend = false, 0, -1e9
local function weaponDef() return Config.WEAPONS[attr("Weapon", "sword")] or Config.WEAPONS.sword end
local function beginAttack()
	if attackHeld or menu.Visible then return end
	attackHeld = true
	holdStart = os.clock()
end
local function endAttack()
	if not attackHeld then return end
	attackHeld = false
	chargeBg.Visible = false
	local held = os.clock() - holdStart
	local w = weaponDef()
	if os.clock() - lastSend < w.cooldown then return end
	lastSend = os.clock()
	local charged = held >= Config.CHARGE_TIME
	Action:FireServer("attack", charged)
	play(charged and "lunge" or "swing", 0.55, charged and 0.85 or (0.95 + math.random() * 0.1))
end

local dashReady = -1e9
local function dash()
	local ch = player.Character
	local hum = ch and ch:FindFirstChildOfClass("Humanoid")
	local hrp = ch and ch:FindFirstChild("HumanoidRootPart")
	if not hum or not hrp or hum.Health <= 0 or os.clock() < dashReady then return end
	dashReady = os.clock() + Config.DASH.cooldown
	local dir = hum.MoveDirection
	if dir.Magnitude < 0.1 then dir = hrp.CFrame.LookVector end
	dir = Vector3.new(dir.X, 0, dir.Z).Unit
	local bv = new("BodyVelocity", { MaxForce = Vector3.new(1e5, 0, 1e5), P = 1e4, Velocity = dir * Config.DASH.power }, hrp)
	Debris:AddItem(bv, 0.18)
	Action:FireServer("dash")
	play("lunge", 0.4, 1.3)
	for _, p in ipairs(ch:GetDescendants()) do
		if p:IsA("BasePart") and p.Transparency < 0.5 and p.Name ~= "HumanoidRootPart" then
			local ghost = new("Part", { Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false, CastShadow = false,
				Material = Enum.Material.Neon, Color = Color3.fromRGB(150, 200, 255), Transparency = 0.6, Size = p.Size, CFrame = p.CFrame }, workspace)
			TweenService:Create(ghost, TweenInfo.new(0.3), { Transparency = 1 }):Play()
			Debris:AddItem(ghost, 0.32)
		end
	end
end

ContextActionService:BindAction("EldoriaAttack", function(_, state)
	if state == Enum.UserInputState.Begin then beginAttack()
	elseif state == Enum.UserInputState.End or state == Enum.UserInputState.Cancel then endAttack() end
	return Enum.ContextActionResult.Sink
end, true, Enum.KeyCode.F, Enum.KeyCode.ButtonR2, Enum.KeyCode.ButtonX)
ContextActionService:SetTitle("EldoriaAttack", "⚔")
ContextActionService:BindAction("EldoriaDash", function(_, state)
	if state == Enum.UserInputState.Begin then dash() end
	return Enum.ContextActionResult.Sink
end, true, Enum.KeyCode.Q, Enum.KeyCode.ButtonL1)
ContextActionService:SetTitle("EldoriaDash", "»")

UserInputService.InputBegan:Connect(function(input, processed)
	if processed then return end
	local keys = { Enum.KeyCode.One, Enum.KeyCode.Two, Enum.KeyCode.Three, Enum.KeyCode.Four, Enum.KeyCode.Five }
	for i, kc in ipairs(keys) do
		if input.KeyCode == kc then Action:FireServer("elixir", Config.ELIX_ORDER[i]) end
	end
	if input.KeyCode == Enum.KeyCode.Escape and shop.Visible then shop.Visible = false end
end)

-- атака мышью и касанием через инструмент в руке
local function hookTool(tool)
	if not tool:IsA("Tool") or tool:GetAttribute("Hooked") then return end
	tool:SetAttribute("Hooked", true)
	tool.Activated:Connect(beginAttack)
	tool.Deactivated:Connect(endAttack)
	play("equip", 0.35)
end
local function onCharacter(ch)
	for _, c in ipairs(ch:GetChildren()) do hookTool(c) end
	ch.ChildAdded:Connect(hookTool)
	attackHeld = false
end
if player.Character then onCharacter(player.Character) end
player.CharacterAdded:Connect(onCharacter)

---------------------------------------------------------------- эффекты
local function attachAt(pos)
	local a = Instance.new("Attachment")
	a.WorldPosition = pos
	a.Parent = workspace.Terrain
	return a
end

local function floatText(pos, text, color, size)
	local a = attachAt(pos)
	local bg = new("BillboardGui", { Size = UDim2.fromOffset(160, 40), AlwaysOnTop = true, Adornee = a, MaxDistance = 120 }, a)
	local t = label({ Size = UDim2.fromScale(1, 1), Text = text, TextColor3 = color, Font = Enum.Font.GothamBlack, TextSize = size or 22, TextXAlignment = Enum.TextXAlignment.Center, TextStrokeTransparency = 0.2 }, bg)
	TweenService:Create(bg, TweenInfo.new(0.9, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { StudsOffset = Vector3.new(math.random(-10, 10) / 10, 3.5, 0) }):Play()
	TweenService:Create(t, TweenInfo.new(0.9, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
	Debris:AddItem(a, 1)
end

local function burst(pos, colors, n, speed, size, life)
	local a = attachAt(pos)
	local seq = {}
	for i, c in ipairs(colors) do table.insert(seq, ColorSequenceKeypoint.new((i - 1) / math.max(1, #colors - 1), c)) end
	if #seq == 1 then table.insert(seq, ColorSequenceKeypoint.new(1, colors[1])) end
	local pe = new("ParticleEmitter", {
		Color = ColorSequence.new(seq), Rate = 0, Speed = NumberRange.new(speed * 0.5, speed), SpreadAngle = Vector2.new(180, 180),
		Lifetime = NumberRange.new(life * 0.6, life), Size = NumberSequence.new(size, 0), LightEmission = 0.6,
		Acceleration = Vector3.new(0, -speed * 0.8, 0), Drag = 2,
	}, a)
	pe:Emit(n)
	Debris:AddItem(a, life + 0.2)
end

local function slashArc(d)
	local cf = d.cf
	local look = Vector3.new(cf.LookVector.X, 0, cf.LookVector.Z).Unit
	local n = d.arc >= 360 and 16 or 9
	local col = d.charged and Color3.fromRGB(255, 214, 110) or Color3.fromRGB(220, 236, 255)
	local r = d.range * 0.75
	for i = 0, n - 1 do
		local ang
		if d.arc >= 360 then ang = i / n * 360 else ang = -d.arc / 2 + d.arc * i / (n - 1) end
		local dir = CFrame.Angles(0, math.rad(ang), 0):VectorToWorldSpace(look)
		local p = cf.Position + dir * r + Vector3.new(0, 0.6 - i * 0.05, 0)
		local tangent = Vector3.new(-dir.Z, 0, dir.X)
		local seg = new("Part", { Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false, CastShadow = false, Material = Enum.Material.Neon, Color = col,
			Size = Vector3.new(0.2, 0.35, math.max(1, r * 0.5)), CFrame = CFrame.lookAt(p, p + tangent), Transparency = 0.25 }, workspace)
		TweenService:Create(seg, TweenInfo.new(0.22, Enum.EasingStyle.Quad), { Transparency = 1, Size = Vector3.new(0.05, 0.1, math.max(1, r * 0.5)) }):Play()
		Debris:AddItem(seg, 0.25)
	end
end

local function shake(power, dur)
	local cam = workspace.CurrentCamera
	local t0 = os.clock()
	local conn
	conn = RunService.RenderStepped:Connect(function()
		local k = 1 - (os.clock() - t0) / dur
		if k <= 0 then conn:Disconnect(); return end
		cam.CFrame = cam.CFrame * CFrame.new(math.random(-10, 10) / 10 * power * k, math.random(-10, 10) / 10 * power * k, 0)
	end)
end

local function myPos()
	local ch = player.Character
	local hrp = ch and ch:FindFirstChild("HumanoidRootPart")
	return hrp and hrp.Position
end

FxEv.OnClientEvent:Connect(function(kind, d)
	d = d or {}
	if kind == "slash" then
		slashArc(d)
		if d.by ~= player.UserId then
			local p = myPos()
			if p and (p - d.cf.Position).Magnitude < 60 then play("swing", 0.25) end
		end
	elseif kind == "dmg" then
		floatText(d.pos, d.text, d.hero and Color3.fromRGB(255, 90, 80) or (d.big and Color3.fromRGB(255, 214, 80) or Color3.fromRGB(255, 255, 255)), d.big and 28 or 22)
	elseif kind == "death" then
		if d.boss then
			burst(d.pos, { Color3.fromRGB(240, 230, 200), Color3.fromRGB(255, 60, 40) }, 80, 40, 1.6, 1.6)
			shake(0.6, 0.8)
		else
			burst(d.pos, { Color3.fromRGB(230, 222, 200), Color3.fromRGB(120, 110, 100) }, 22, 18, 0.9, 0.9)
		end
	elseif kind == "summon" then
		burst(d.pos, { Color3.fromRGB(150, 90, 255), Color3.fromRGB(40, 20, 60) }, 30, 16, 1.2, 1)
	elseif kind == "boom" then
		burst(d.pos + Vector3.new(0, 0.5, 0), { Color3.fromRGB(255, 220, 120), Color3.fromRGB(255, 70, 30) }, 50, 34, 1.4, 0.8)
		local p = myPos()
		if p and (p - d.pos).Magnitude < 60 then shake(0.35, 0.35) end
	elseif kind == "levelup" then
		burst(d.pos, { Color3.fromRGB(255, 240, 160), Color3.fromRGB(255, 200, 60) }, 60, 22, 1, 1.4)
		local p = myPos()
		if p and (p - d.pos).Magnitude < 3 then play("equip", 0.6, 1.4) end
	elseif kind == "drink" then
		burst(d.pos + Vector3.new(0, 1, 0), { d.color or Color3.new(1, 1, 1), Color3.new(1, 1, 1) }, 18, 10, 0.6, 0.8)
	elseif kind == "loot" then
		if d.gold and d.gold > 0 then floatText(d.pos + Vector3.new(0, 2, 0), "+" .. d.gold .. " золота", Color3.fromRGB(255, 200, 60), 18); play("coin", 0.4, 1.2) end
		if d.xp then floatText(d.pos + Vector3.new(0, 3.5, 0), "+" .. d.xp .. " опыта", Color3.fromRGB(140, 190, 255), 16) end
		if d.item then floatText(d.pos + Vector3.new(0, 2, 0), "+ " .. d.item, Color3.fromRGB(255, 140, 160), 18); play("coin", 0.4, 0.9) end
	elseif kind == "hurt" then
		hurtFlash.BackgroundTransparency = 0.7
		TweenService:Create(hurtFlash, TweenInfo.new(0.35), { BackgroundTransparency = 1 }):Play()
	elseif kind == "openShop" then
		openShop(d.tip)
	elseif kind == "victory" then
		victory(d.title or "Победа!")
		local p = myPos()
		if p then
			for i = 1, 6 do
				task.delay(i * 0.35, function()
					local q = p + Vector3.new(math.random(-14, 14), math.random(10, 18), math.random(-14, 14))
					local cols = { Color3.fromRGB(255, 90, 90), Color3.fromRGB(255, 220, 90), Color3.fromRGB(110, 220, 255), Color3.fromRGB(180, 120, 255) }
					burst(q, { cols[math.random(1, 4)], Color3.new(1, 1, 1) }, 60, 26, 0.8, 1.4)
				end)
			end
		end
	elseif kind == "coin" then
		play("coin", 0.45)
	end
end)

---------------------------------------------------------------- логово: тьма и свет
local lightSaved = nil
local lairCC = new("ColorCorrectionEffect", { Name = "LairTint", Enabled = false, Brightness = -0.04, Saturation = -0.15, TintColor = Color3.fromRGB(226, 214, 236) }, Lighting)
local function applyZone()
	local inLair = player:GetAttribute("Zone") == "lair"
	local atm = Lighting:FindFirstChildOfClass("Atmosphere")
	if inLair and not lightSaved then
		lightSaved = { amb = Lighting.Ambient, out = Lighting.OutdoorAmbient, dens = atm and atm.Density, haze = atm and atm.Haze, col = atm and atm.Color }
		Lighting.Ambient = Color3.fromRGB(34, 30, 40)
		Lighting.OutdoorAmbient = Color3.fromRGB(40, 36, 48)
		if atm then atm.Density = 0.42; atm.Haze = 0; atm.Color = Color3.fromRGB(28, 24, 30) end
		lairCC.Enabled = true
	elseif not inLair and lightSaved then
		Lighting.Ambient = lightSaved.amb
		Lighting.OutdoorAmbient = lightSaved.out
		if atm then atm.Density = lightSaved.dens; atm.Haze = lightSaved.haze; atm.Color = lightSaved.col end
		lightSaved = nil
		lairCC.Enabled = false
	end
	mapInner.Visible = not inLair
	lairMapText.Visible = inLair
end
player:GetAttributeChangedSignal("Zone"):Connect(applyZone)
applyZone()

---------------------------------------------------------------- покадровое обновление
local motorCache = setmetatable({}, { __mode = "k" })
local function motorsOf(model)
	local c = motorCache[model]
	if c then return c end
	c = { legs = {}, armL = nil, armR = nil, body = nil }
	for _, m in ipairs(model:GetDescendants()) do
		if m:IsA("Motor6D") then
			if string.sub(m.Name, 1, 8) == "LegMotor" then table.insert(c.legs, { m = m, ph = m:GetAttribute("Phase") or 0 })
			elseif m.Name == "ArmMotorL" then c.armL = m
			elseif m.Name == "ArmMotorR" then c.armR = m
			elseif m.Name == "BodyMotor" then c.body = m end
		end
	end
	motorCache[model] = c
	return c
end

local enemiesFolder
local revealed = {}
RunService.RenderStepped:Connect(function()
	local t = os.clock()
	local ch = player.Character
	local hum = ch and ch:FindFirstChildOfClass("Humanoid")
	local hrp = ch and ch:FindFirstChild("HumanoidRootPart")
	-- здоровье
	if hum then
		hpFill.Size = UDim2.fromScale(math.clamp(hum.Health / math.max(1, hum.MaxHealth), 0, 1), 1)
		hpText.Text = math.floor(hum.Health + 0.5) .. " / " .. math.floor(hum.MaxHealth)
	end
	-- заряд сильного удара
	if attackHeld then
		local k = (t - holdStart) / Config.CHARGE_TIME
		chargeBg.Visible = k > 0.25
		chargeFill.Size = UDim2.fromScale(math.clamp(k, 0, 1), 1)
		chargeFill.BackgroundColor3 = k >= 1 and Color3.fromRGB(255, 170, 40) or Color3.fromRGB(255, 230, 160)
	end
	-- таймеры зелий
	local now = workspace:GetServerTimeNow()
	for _, k in ipairs({ "speed", "might", "guard" }) do
		local left = attr("Buff_" .. k, 0) - now
		slots[k].timer.Visible = left > 0
		if left > 0 then slots[k].timer.Text = tostring(math.ceil(left)) end
	end
	-- мини-карта и туман
	if hrp and meDot then
		local n = mapN
		local cx = hrp.Position.X / Config.CELL + n / 2 + 0.5
		local cz = hrp.Position.Z / Config.CELL + n / 2 + 0.5
		meDot.Position = UDim2.fromScale(math.clamp((cx - 0.5) / n, 0, 1), math.clamp((cz - 0.5) / n, 0, 1))
		if player:GetAttribute("Zone") ~= "lair" and #fogCells > 0 then
			local fx = math.floor((cx - 1) / n * FOG) + 1
			local fz = math.floor((cz - 1) / n * FOG) + 1
			for dz = -2, 2 do
				for dx = -2, 2 do
					local gx, gz = fx + dx, fz + dz
					if dx * dx + dz * dz <= 5 and fogCells[gz] and fogCells[gz][gx] and not revealed[gz * 100 + gx] then
						revealed[gz * 100 + gx] = true
						TweenService:Create(fogCells[gz][gx], TweenInfo.new(0.8), { BackgroundTransparency = 1 }):Play()
					end
				end
			end
		end
	end
	-- анимация врагов и полоса босса
	enemiesFolder = enemiesFolder or (workspace:FindFirstChild("Eldoria") and workspace.Eldoria:FindFirstChild("Enemies"))
	local bossShown = false
	if enemiesFolder then
		for _, model in ipairs(enemiesFolder:GetChildren()) do
			local root = model.PrimaryPart
			if root then
				local near = hrp and (root.Position - hrp.Position).Magnitude < 160
				if near then
					local c = motorsOf(model)
					local v = root.AssemblyLinearVelocity
					local moving = math.clamp(Vector3.new(v.X, 0, v.Z).Magnitude / 8, 0, 1)
					local seed = (root.Position.X % 7)
					for _, L in ipairs(c.legs) do
						L.m.Transform = CFrame.Angles(math.sin(t * 10 + L.ph + seed) * 0.65 * moving, 0, 0)
					end
					local atk = model:GetAttribute("AtkAt")
					local sinceAtk = atk and (now - atk) or 99
					if c.armR then
						if sinceAtk < 0.5 then
							local k = sinceAtk / 0.5
							local ang = k < 0.4 and (-2.6 * k / 0.4) or (-2.6 + 3.4 * (k - 0.4) / 0.6)
							c.armR.Transform = CFrame.Angles(ang, 0, 0)
						else
							c.armR.Transform = CFrame.Angles(-math.sin(t * 10 + seed) * 0.5 * moving, 0, 0)
						end
					end
					if c.armL then c.armL.Transform = CFrame.Angles(math.sin(t * 10 + seed) * 0.5 * moving, 0, 0) end
					if c.body then
						local hop = math.abs(math.sin(t * 6 + seed)) * (0.25 + 0.9 * moving)
						c.body.Transform = CFrame.new(0, hop, 0)
					end
				end
				if model:GetAttribute("Boss") and player:GetAttribute("Zone") == "lair" then
					local h = model:FindFirstChildOfClass("Humanoid")
					if h and h.Health > 0 and near then
						bossShown = true
						bossFill.Size = UDim2.fromScale(math.clamp(h.Health / h.MaxHealth, 0, 1), 1)
						bossName.Text = "Мортракс — Владыка костей   " .. math.ceil(h.Health) .. " / " .. math.floor(h.MaxHealth)
					end
				end
			end
		end
	end
	bossBar.Visible = bossShown
end)

rescale()
addNote(Config.TITLE .. " · сборка " .. Config.BUILD, C.dim)
