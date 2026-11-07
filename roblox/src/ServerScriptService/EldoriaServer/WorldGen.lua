-- Генерация мира: Оверворлд (поверхность) и логово Мортракса
local Config = require(game:GetService("ReplicatedStorage"):WaitForChild("Eldoria"):WaitForChild("Config"))
local Models = require(script.Parent:WaitForChild("Models"))

local WorldGen = {}
local rng = Random.new()
local N, CELL = Config.MAP_N, Config.CELL
local terrain = workspace.Terrain
local M = Enum.Material

local grid, reserved = {}, {}
WorldGen.grid = grid

local function inMap(x, z) return x >= 1 and z >= 1 and x <= N and z <= N end
local function cellPos(x, z) return Vector3.new((x - N / 2 - 0.5) * CELL, 0, (z - N / 2 - 0.5) * CELL) end
WorldGen.cellPos = cellPos
function WorldGen.worldToCell(p)
	return math.floor(p.X / CELL + N / 2 + 1), math.floor(p.Z / CELL + N / 2 + 1)
end

-- высота земли (только рельеф) в точке
local groundParams = RaycastParams.new()
groundParams.FilterType = Enum.RaycastFilterType.Include
groundParams.FilterDescendantsInstances = { terrain }
local function onGround(p)
	local res = workspace:Raycast(Vector3.new(p.X, 80, p.Z), Vector3.new(0, -160, 0), groundParams)
	return Vector3.new(p.X, res and res.Position.Y or p.Y, p.Z)
end
WorldGen.onGround = onGround

local function each(cx, cz, r, fn)
	for z = math.floor(cz - r), math.ceil(cz + r) do
		for x = math.floor(cx - r), math.ceil(cx + r) do
			if inMap(x, z) and (x - cx) ^ 2 + (z - cz) ^ 2 <= r * r then fn(x, z) end
		end
	end
end

-- Плавно меняющаяся глубина полосы гор (как в браузерной версии)
local function bandDepth()
	local a, b, c = rng:NextNumber(0, 6.3), rng:NextNumber(0, 6.3), rng:NextNumber(0, 6.3)
	return function(i)
		local v = 0.5 + 0.5 * (0.5 * math.sin(i * 0.13 + a) + 0.3 * math.sin(i * 0.31 + b) + 0.2 * math.sin(i * 0.77 + c))
		return 2 + math.floor(v * 3)
	end
end

local function carveRoad(x1, z1, x2, z2)
	local x, z = x1, z1
	local horizFirst = rng:NextNumber() < 0.5
	local function mark(px, pz)
		for dz = 0, 1 do
			for dx = 0, 1 do
				if inMap(px + dx, pz + dz) and grid[pz + dz][px + dx] ~= "^" then grid[pz + dz][px + dx] = "P" end
			end
		end
	end
	local function walkX() while x ~= x2 do mark(x, z); x = x + (x2 > x and 1 or -1) end end
	local function walkZ() while z ~= z2 do mark(x, z); z = z + (z2 > z and 1 or -1) end end
	if horizFirst then walkX(); walkZ() else walkZ(); walkX() end
	mark(x, z)
end

function WorldGen.buildOverworld(folder)
	local layout = {}
	for z = 1, N do
		grid[z], reserved[z] = {}, {}
		for x = 1, N do grid[z][x] = "."; reserved[z][x] = false end
	end
	-- горы по краям
	local dT, dB, dL, dR = bandDepth(), bandDepth(), bandDepth(), bandDepth()
	for i = 1, N do
		for k = 1, dT(i) do grid[k][i] = "^" end
		for k = 1, dB(i) do grid[N + 1 - k][i] = "^" end
		for k = 1, dL(i) do grid[i][k] = "^" end
		for k = 1, dR(i) do grid[i][N + 1 - k] = "^" end
	end
	local c = math.floor(N / 2)
	each(c, c, 6, function(x, z) reserved[z][x] = true end)
	-- лавка в случайном углу
	local corners = { { 11, 11 }, { N - 10, 11 }, { 11, N - 10 }, { N - 10, N - 10 } }
	local sc = corners[rng:NextInteger(1, 4)]
	local shopX, shopZ = sc[1], sc[2]
	each(shopX, shopZ, 7, function(x, z) reserved[z][x] = true; if grid[z][x] ~= "^" then grid[z][x] = "." end end)
	-- вход в логово: далеко от центра и от лавки
	local caveX, caveZ
	for t = 1, 400 do
		local x, z = rng:NextInteger(12, N - 11), rng:NextInteger(12, N - 11)
		local dc = math.sqrt((x - c) ^ 2 + (z - c) ^ 2)
		local ds = math.sqrt((x - shopX) ^ 2 + (z - shopZ) ^ 2)
		if dc >= 26 and ds >= 30 then caveX, caveZ = x, z; break end
	end
	if not caveX then caveX, caveZ = N - shopX + 1, shopZ end
	each(caveX, caveZ, 6, function(x, z) reserved[z][x] = true end)
	-- тропы от центра к лавке и к пещере
	carveRoad(c, c, shopX, shopZ + 3)
	carveRoad(c, c, caveX, caveZ)
	-- озёра неправильной формы: несколько перекрывающихся кругов
	local circles = {}
	local lakes = 0
	for t = 1, 120 do
		if lakes >= 13 then break end
		local lx, lz, r = rng:NextInteger(9, N - 8), rng:NextInteger(9, N - 8), rng:NextInteger(3, 6)
		local parts = { { lx, lz, r } }
		for k = 1, rng:NextInteger(1, 3) do
			local a = rng:NextNumber(0, 6.28)
			table.insert(parts, { lx + math.cos(a) * r * 0.7, lz + math.sin(a) * r * 0.7, r * rng:NextNumber(0.5, 0.8) })
		end
		local ok = true
		for _, p in ipairs(parts) do
			each(p[1], p[2], p[3] + 2, function(x, z)
				if reserved[z][x] or grid[z][x] ~= "." then ok = false end
			end)
		end
		if ok then
			lakes = lakes + 1
			for _, p in ipairs(parts) do
				each(p[1], p[2], p[3], function(x, z) grid[z][x] = "~" end)
				table.insert(circles, { pos = cellPos(p[1], p[2]), r = p[3] * CELL })
			end
		end
	end

	---------------------------------------------------------------- рельеф
	terrain:Clear()
	local span = N * CELL
	terrain:FillBlock(CFrame.new(0, -8, 0), Vector3.new(span + 240, 16, span + 240), M.Grass)
	-- пологие бугры и пятна сочной травы
	for i = 1, 70 do
		local x, z = rng:NextInteger(6, N - 5), rng:NextInteger(6, N - 5)
		local free = true
		each(x, z, 3, function(px, pz) if reserved[pz][px] or grid[pz][px] == "P" or grid[pz][px] == "~" then free = false end end)
		if free then
			local r = rng:NextNumber(8, 15)
			local p = cellPos(x, z)
			terrain:FillBall(Vector3.new(p.X, -(r - rng:NextNumber(0.8, 1.8)), p.Z), r, rng:NextNumber() < 0.5 and M.LeafyGrass or M.Grass)
		end
	end
	-- тропы
	for z = 1, N do
		for x = 1, N do
			if grid[z][x] == "P" then
				local p = cellPos(x, z)
				terrain:FillBlock(CFrame.new(p.X, -0.7, p.Z), Vector3.new(CELL + 1, 1.4, CELL + 1), M.Ground)
			end
		end
	end
	-- озёра с песчаным берегом
	for _, ci in ipairs(circles) do
		terrain:FillCylinder(CFrame.new(ci.pos.X, -0.8, ci.pos.Z), 1.6, ci.r + 4, M.Sand)
	end
	for _, ci in ipairs(circles) do
		terrain:FillCylinder(CFrame.new(ci.pos.X, -4, ci.pos.Z), 8, ci.r, M.Water)
	end
	-- горы: тёмный базальт, у части вершин ледники
	local half = span / 2
	local function mountain(pos, r)
		local cx, cz = WorldGen.worldToCell(pos)
		each(cx, cz, r * 0.8 / CELL, function(x, z) if not reserved[z][x] then grid[z][x] = "^" end end)
		local cy = -r * 0.32
		terrain:FillBall(Vector3.new(pos.X, cy, pos.Z), r, rng:NextNumber() < 0.7 and M.Basalt or M.Rock)
		terrain:FillBall(Vector3.new(pos.X, cy - r * 0.15, pos.Z), r * 0.9, M.Slate)
		if rng:NextNumber() < 0.55 then
			terrain:FillBall(Vector3.new(pos.X, cy + r * 0.62, pos.Z), r * 0.4, rng:NextNumber() < 0.5 and M.Snow or M.Glacier)
		end
	end
	local step = 22
	for d = -half - 10, half + 10, step do
		for side = 1, 4 do
			local inward = rng:NextNumber(-10, 4)
			local r = rng:NextNumber(26, 38)
			local along = d + rng:NextNumber(-6, 6)
			local p
			if side == 1 then p = Vector3.new(along, 0, -half + inward)
			elseif side == 2 then p = Vector3.new(along, 0, half - inward)
			elseif side == 3 then p = Vector3.new(-half + inward, 0, along)
			else p = Vector3.new(half - inward, 0, along) end
			mountain(p, r)
		end
	end
	-- невидимые стены по краю карты
	for i = 1, 4 do
		local w = Models.part({ Name = "Boundary", Transparency = 1, CanCollide = true, Size = (i <= 2) and Vector3.new(span + 40, 300, 4) or Vector3.new(4, 300, span + 40),
			CFrame = CFrame.new((i == 3 and -half) or (i == 4 and half) or 0, 140, (i == 1 and -half) or (i == 2 and half) or 0), Parent = folder })
		w.CanQuery = false
	end

	---------------------------------------------------------------- растительность
	local nature = Instance.new("Folder")
	nature.Name = "Nature"
	nature.Parent = folder
	for z = 2, N - 1 do
		for x = 2, N - 1 do
			if grid[z][x] == "." and not reserved[z][x] then
				local roll = rng:NextNumber()
				local p = onGround(cellPos(x, z) + Vector3.new(rng:NextNumber(-2.5, 2.5), 0, rng:NextNumber(-2.5, 2.5)))
				if roll < 0.06 then
					grid[z][x] = "#"
					Models.tree(p, nature)
				elseif roll < 0.075 then
					grid[z][x] = "#"
					Models.pine(p, nature)
				elseif roll < 0.10 then
					Models.bush(p, nature)
				elseif roll < 0.112 then
					Models.rock(p, nature, rng:NextNumber(0.7, 1.4))
				elseif roll < 0.16 then
					Models.flowers(p, nature)
				end
			end
		end
	end
	-- у подножия гор — валуны
	for z = 1, N do
		for x = 1, N do
			if grid[z][x] == "^" and rng:NextNumber() < 0.03 then Models.rock(onGround(cellPos(x, z)), nature, rng:NextNumber(1.5, 2.6)) end
		end
	end

	---------------------------------------------------------------- центр: место появления
	local center = cellPos(c, c)
	local plaza = Instance.new("Folder")
	plaza.Name = "Plaza"
	plaza.Parent = folder
	terrain:FillCylinder(CFrame.new(center.X, -0.7, center.Z), 1.4, 16, M.Cobblestone)
	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "EldoriaSpawn"
	spawn.Anchored = true
	spawn.Size = Vector3.new(8, 0.6, 8)
	spawn.CFrame = CFrame.new(center + Vector3.new(0, 0.3, 0))
	spawn.Material = M.Cobblestone
	spawn.Color = Color3.fromRGB(150, 146, 136)
	spawn.Neutral = true
	spawn.Duration = 0
	spawn.Transparency = 1
	spawn.CanCollide = false
	spawn.Parent = plaza
	for k = 0, 7 do
		local a = k / 8 * math.pi * 2
		local h = rng:NextNumber(4, 7)
		Models.part({ Size = Vector3.new(2.2, h, 1.4), Color = Models.vary(Color3.fromRGB(128, 126, 118), 0.08), Material = M.Slate, CanCollide = true,
			CFrame = CFrame.new(center + Vector3.new(math.cos(a) * 14, h / 2 - 0.4, math.sin(a) * 14)) * CFrame.Angles(0, -a, rng:NextNumber(-0.06, 0.06)), Parent = plaza })
	end
	layout.spawn = center + Vector3.new(0, 4, 0)

	---------------------------------------------------------------- лавка
	local shopCenter = cellPos(shopX, shopZ)
	terrain:FillCylinder(CFrame.new(shopCenter.X, -0.7, shopCenter.Z), 1.4, 20, M.Ground)
	local toCenter = Vector3.new(center.X - shopCenter.X, 0, center.Z - shopCenter.Z).Unit
	local stallCF = CFrame.lookAt(shopCenter, shopCenter + toCenter)
	local shopFolder = Instance.new("Folder")
	shopFolder.Name = "Shop"
	shopFolder.Parent = folder
	Models.stall(stallCF, shopFolder)
	local merchant = Models.merchant(stallCF * CFrame.new(0, 3, 0.4), shopFolder)
	Models.label(merchant:FindFirstChild("Head"), "Торговец", Color3.fromRGB(255, 220, 140), 2.2, 60)
	layout.shopPos = shopCenter
	layout.merchant = merchant

	---------------------------------------------------------------- вход в логово
	local cavePos = cellPos(caveX, caveZ)
	local dir = Vector3.new(center.X - cavePos.X, 0, center.Z - cavePos.Z).Unit
	local side = Vector3.new(-dir.Z, 0, dir.X)
	terrain:FillBall(Vector3.new(cavePos.X, -8, cavePos.Z) - dir * 18, 22, M.Basalt)
	terrain:FillBall(Vector3.new(cavePos.X, -14, cavePos.Z) - dir * 24, 24, M.Rock)
	terrain:FillCylinder(CFrame.new(cavePos.X, -0.7, cavePos.Z) + dir * 3, 1.4, 9, M.Slate)
	local caveFolder = Instance.new("Folder")
	caveFolder.Name = "CaveEntrance"
	caveFolder.Parent = folder
	local doorCF = CFrame.lookAt(cavePos - dir * 0.3 + Vector3.new(0, 5, 0), cavePos - dir * 0.3 + Vector3.new(0, 5, 0) + dir)
	local door = Models.part({ Name = "Door", Size = Vector3.new(9, 10, 1), Color = Color3.fromRGB(8, 6, 10), Material = M.SmoothPlastic, CFrame = doorCF, Parent = caveFolder, CanCollide = true })
	-- каменная арка из глыб
	for k = 0, 8 do
		local a = math.pi * k / 8
		local p = doorCF * CFrame.new(math.cos(a) * 6, -5 + math.sin(a) * 9.5, 0.6)
		Models.part({ Size = Vector3.new(rng:NextNumber(2.6, 3.6), rng:NextNumber(2.6, 3.6), rng:NextNumber(2.6, 3.6)), Color = Models.vary(Color3.fromRGB(70, 66, 64), 0.06), Material = M.Slate, CanCollide = true,
			CFrame = p * CFrame.Angles(rng:NextNumber(0, 1), rng:NextNumber(0, 1), rng:NextNumber(0, 1)), Parent = caveFolder })
	end
	-- черепа у входа
	for k = -1, 1, 2 do
		Models.part({ Shape = Enum.PartType.Ball, Size = Vector3.new(1.2, 1.2, 1.2), Color = Color3.fromRGB(226, 220, 200), CFrame = CFrame.new(cavePos + dir * 2.5 + side * k * 3.2 + Vector3.new(0, 0.5, 0)), Parent = caveFolder })
	end
	Models.torch(cavePos + dir * 1.5 + side * 6.5, caveFolder)
	Models.torch(cavePos + dir * 1.5 - side * 6.5, caveFolder)
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = "Войти"
	prompt.ObjectText = "Логово Мортракса"
	prompt.HoldDuration = 0.3
	prompt.MaxActivationDistance = 14
	prompt.RequiresLineOfSight = false
	prompt.Parent = door
	Models.label(door, "Логово Мортракса", Color3.fromRGB(255, 170, 120), 7, 120)
	layout.cavePos = cavePos
	layout.caveDoor = door
	layout.caveReturn = cavePos + dir * 9 + Vector3.new(0, 4, 0)

	---------------------------------------------------------------- данные для мини-карты
	local rows = {}
	for z = 1, N do rows[z] = table.concat(grid[z]) end
	layout.mapString = table.concat(rows)
	layout.shopCell = { shopX, shopZ }
	layout.caveCell = { caveX, caveZ }
	layout.centerCell = { c, c }
	return layout
end

-- Случайная свободная точка на поверхности вдали от заданных мест
function WorldGen.randomGround(avoid, minDist)
	for t = 1, 300 do
		local x, z = rng:NextInteger(4, N - 3), rng:NextInteger(4, N - 3)
		if grid[z] and grid[z][x] == "." and not reserved[z][x] then
			local p = cellPos(x, z)
			local ok = true
			for _, a in ipairs(avoid or {}) do
				if (p - a.pos).Magnitude < (a.r or minDist or 40) then ok = false; break end
			end
			if ok then return onGround(p) end
		end
	end
	return nil
end

---------------------------------------------------------------- Логово Мортракса
function WorldGen.buildLair(folder)
	local O = Config.LAIR_ORIGIN
	local function at(x, y, z) return O + Vector3.new(x, y, z) end
	local L = {}
	terrain:FillBlock(CFrame.new(at(105, 14, 0)), Vector3.new(272, 52, 156), M.Rock)
	-- передняя комната, коридор, круглый зал, туннель к гроту
	terrain:FillBlock(CFrame.new(at(18, 11, 0)), Vector3.new(36, 22, 36), M.Air)
	terrain:FillBlock(CFrame.new(at(52, 8, 0)), Vector3.new(36, 16, 18), M.Air)
	terrain:FillCylinder(CFrame.new(at(115, 13, 0)), 26, 47, M.Air)
	for k = 1, 9 do
		local a = rng:NextNumber(0.7, math.pi * 2 - 0.7)   -- не у решётки (угол 0)
		terrain:FillBall(at(115 + math.cos(a) * 44, 12, math.sin(a) * 44), rng:NextNumber(9, 15), M.Air)
	end
	terrain:FillBlock(CFrame.new(at(177, 8, 0)), Vector3.new(34, 16, 16), M.Air)
	terrain:FillBall(at(206, 10, 0), 16, M.Air)
	-- колонны по кругу
	for k = 0, 5 do
		local a = k / 6 * math.pi * 2 + 0.5
		terrain:FillCylinder(CFrame.new(at(115 + math.cos(a) * 27, 13, math.sin(a) * 27)), 26, 3.4, M.Basalt)
	end
	-- каменистый пол
	terrain:FillBlock(CFrame.new(at(105, -1, 0)), Vector3.new(272, 2, 156), M.Slate)
	for k = 1, 40 do
		terrain:FillBall(at(rng:NextNumber(10, 210), -1.2, rng:NextNumber(-40, 40)), rng:NextNumber(2, 4), M.Rock)
	end

	local deco = Instance.new("Folder")
	deco.Name = "LairDeco"
	deco.Parent = folder
	-- факелы
	local torches = { { 4, -14 }, { 30, 14 }, { 40, -7 }, { 64, 7 }, { 80, -30 }, { 80, 30 }, { 115, -44 }, { 115, 44 }, { 150, -30 }, { 150, 30 }, { 160, -10 }, { 160, 10 } }
	for _, t in ipairs(torches) do Models.torch(at(t[1], 0, t[2]), deco) end
	-- кости и черепа в зале
	for k = 1, 26 do
		local p = at(rng:NextNumber(76, 156), 0.2, rng:NextNumber(-38, 38))
		if rng:NextNumber() < 0.35 then
			Models.part({ Shape = Enum.PartType.Ball, Size = Vector3.new(1.1, 1.1, 1.1), Color = Color3.fromRGB(222, 216, 194), CFrame = CFrame.new(p + Vector3.new(0, 0.4, 0)), Parent = deco })
		else
			Models.part({ Size = Vector3.new(0.35, 0.35, rng:NextNumber(1.4, 2.6)), Color = Color3.fromRGB(214, 208, 186), CFrame = CFrame.new(p) * CFrame.Angles(0, rng:NextNumber(0, 6.28), 0), Parent = deco })
		end
	end
	-- выход на поверхность
	local exitCF = CFrame.lookAt(at(2.2, 5, 0), at(10, 5, 0))
	local exitPart = Models.part({ Name = "Exit", Size = Vector3.new(8, 10, 0.6), Color = Color3.fromRGB(150, 200, 255), Material = M.Neon, Transparency = 0.35, CFrame = exitCF, Parent = folder })
	local el = Instance.new("PointLight")
	el.Color = Color3.fromRGB(150, 200, 255)
	el.Range = 20
	el.Parent = exitPart
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = "Выйти"
	prompt.ObjectText = "На поверхность"
	prompt.HoldDuration = 0.3
	prompt.MaxActivationDistance = 12
	prompt.RequiresLineOfSight = false
	prompt.Parent = exitPart
	L.exitPart = exitPart
	L.spawn = at(12, 4, 0)
	-- решётка в Грот Шорохов
	local gate = Instance.new("Model")
	gate.Name = "Gate"
	for k = -3, 3 do
		Models.cylinderV(17, 0.7, Color3.fromRGB(60, 58, 62), CFrame.new(at(161, 8.3, k * 2.1)), gate, M.Metal).CanCollide = true
	end
	for _, y in ipairs({ 3, 13 }) do
		Models.part({ Size = Vector3.new(0.6, 0.6, 15), Color = Color3.fromRGB(70, 66, 70), Material = M.Metal, CFrame = CFrame.new(at(161, y, 0)), Parent = gate, CanCollide = true })
	end
	gate.Parent = folder
	L.gate = gate
	-- грот: светящиеся кристаллы и табличка
	for k = 1, 6 do
		local a = k / 6 * math.pi * 2
		local cr = Models.part({ Size = Vector3.new(1.2, rng:NextNumber(2.5, 5), 1.2), Color = Color3.fromRGB(110, 170, 255), Material = M.Neon, Transparency = 0.15,
			CFrame = CFrame.new(at(206 + math.cos(a) * 10, 1.5, math.sin(a) * 10)) * CFrame.Angles(rng:NextNumber(-0.4, 0.4), 0, rng:NextNumber(-0.4, 0.4)), Parent = deco })
		if k % 2 == 0 then
			local pl = Instance.new("PointLight")
			pl.Color = Color3.fromRGB(110, 170, 255)
			pl.Range = 18
			pl.Parent = cr
		end
	end
	local sign = Models.part({ Size = Vector3.new(8, 4, 0.4), Color = Color3.fromRGB(70, 52, 36), Material = M.Wood, CFrame = CFrame.lookAt(at(214, 4, 0), at(150, 4, 0)), Parent = deco, CanCollide = true })
	local sg = Instance.new("SurfaceGui")
	sg.Face = Enum.NormalId.Front
	sg.PixelsPerStud = 30
	sg.Parent = sign
	local t = Instance.new("TextLabel")
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundTransparency = 1
	t.TextScaled = true
	t.Font = Enum.Font.Merriweather
	t.TextColor3 = Color3.fromRGB(236, 214, 160)
	t.Text = "Грот Шорохов\nпуть к Шелибе откроется в следующей сборке"
	t.Parent = sg
	L.bossPos = at(118, 6, 0)
	L.hallCenter = at(115, 0, 0)
	L.guardSpots = { at(84, 4, -18), at(84, 4, 18), at(142, 4, -24), at(142, 4, 24) }
	return L
end

return WorldGen
