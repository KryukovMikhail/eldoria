-- Построение моделей из деталей: деревья, камни, враги, торговец, лавка, оружие, предметы
local Models = {}

local rng = Random.new()

local function rgb(r, g, b) return Color3.fromRGB(r, g, b) end
local function vary(c, k)
	local d = (rng:NextNumber() - 0.5) * (k or 0.12)
	return Color3.new(math.clamp(c.R + d, 0, 1), math.clamp(c.G + d, 0, 1), math.clamp(c.B + d, 0, 1))
end
Models.vary = vary

-- Деталь с разумными значениями по умолчанию
local function part(props)
	local p = Instance.new(props.ClassName or "Part")
	p.Anchored = true
	p.CanCollide = false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = Enum.Material.SmoothPlastic
	p.CastShadow = true
	for k, v in pairs(props) do
		if k ~= "ClassName" and k ~= "Parent" then p[k] = v end
	end
	if props.Parent then p.Parent = props.Parent end
	return p
end
Models.part = part

local function ball(size, color, cf, parent, material)
	return part({ Shape = Enum.PartType.Ball, Size = Vector3.new(size, size, size), Color = color, CFrame = cf, Parent = parent, Material = material or Enum.Material.SmoothPlastic })
end

local function ellipsoid(size, color, cf, parent, material)
	local p = part({ Size = size, Color = color, CFrame = cf, Parent = parent, Material = material or Enum.Material.SmoothPlastic })
	local m = Instance.new("SpecialMesh")
	m.MeshType = Enum.MeshType.Sphere
	m.Parent = p
	return p
end
Models.ellipsoid = ellipsoid

local function cylinderV(height, diam, color, cf, parent, material)
	return part({ Shape = Enum.PartType.Cylinder, Size = Vector3.new(height, diam, diam), Color = color,
		CFrame = cf * CFrame.Angles(0, 0, math.pi / 2), Parent = parent, Material = material or Enum.Material.SmoothPlastic })
end
Models.cylinderV = cylinderV

-- Жёсткое крепление детали к другой по текущему взаимному положению
local function weldTo(p0, p1)
	local w = Instance.new("Weld")
	w.Part0 = p0
	w.Part1 = p1
	w.C0 = p0.CFrame:Inverse() * p1.CFrame
	w.Parent = p1
	return w
end
Models.weldTo = weldTo

local function motor(name, p0, p1, c0, c1)
	local m = Instance.new("Motor6D")
	m.Name = name
	m.Part0 = p0
	m.Part1 = p1
	m.C0 = c0
	m.C1 = c1
	m.Parent = p0
	return m
end

---------------------------------------------------------------- Природа
function Models.tree(pos, parent)
	local m = Instance.new("Model")
	m.Name = "Tree"
	local h = rng:NextNumber(7, 12)
	local trunkColor = vary(rgb(98, 70, 44), 0.08)
	cylinderV(h, rng:NextNumber(1.3, 2), trunkColor, CFrame.new(pos + Vector3.new(0, h / 2 - 0.3, 0)), m, Enum.Material.Wood).CanCollide = true
	local base = rgb(58, 118, 44)
	if rng:NextNumber() < 0.3 then base = rgb(46, 98, 52) end
	if rng:NextNumber() < 0.12 then base = rgb(122, 140, 46) end
	local crown = rng:NextNumber(6.5, 9.5)
	local top = pos + Vector3.new(0, h, 0)
	ball(crown, vary(base, 0.08), CFrame.new(top), m, Enum.Material.Grass)
	for i = 1, 3 do
		local a = rng:NextNumber(0, math.pi * 2)
		local off = Vector3.new(math.cos(a) * crown * 0.38, rng:NextNumber(-1.6, 1.4), math.sin(a) * crown * 0.38)
		ball(crown * rng:NextNumber(0.55, 0.75), vary(base, 0.1), CFrame.new(top + off), m, Enum.Material.Grass)
	end
	for _, p in ipairs(m:GetChildren()) do
		if p:IsA("BasePart") and p.Material == Enum.Material.Grass then p.CastShadow = true end
	end
	m.Parent = parent
	return m
end

function Models.pine(pos, parent)
	local m = Instance.new("Model")
	m.Name = "Pine"
	local h = rng:NextNumber(9, 14)
	cylinderV(h, 1.3, vary(rgb(84, 58, 38), 0.06), CFrame.new(pos + Vector3.new(0, h / 2, 0)), m, Enum.Material.Wood).CanCollide = true
	local c = vary(rgb(38, 82, 50), 0.06)
	for i = 0, 3 do
		local w = 8 - i * 1.7
		local y = 3 + i * (h - 3) / 4
		ellipsoid(Vector3.new(w, 3.4, w), vary(c, 0.05), CFrame.new(pos + Vector3.new(0, y, 0)), m, Enum.Material.Grass)
	end
	m.Parent = parent
	return m
end

function Models.bush(pos, parent)
	local m = Instance.new("Model")
	m.Name = "Bush"
	local c = vary(rgb(52, 104, 40), 0.1)
	for i = 1, 3 do
		local s = rng:NextNumber(2.4, 3.6)
		ball(s, vary(c, 0.06), CFrame.new(pos + Vector3.new(rng:NextNumber(-1.4, 1.4), s * 0.32, rng:NextNumber(-1.4, 1.4))), m, Enum.Material.Grass)
	end
	if rng:NextNumber() < 0.4 then
		for i = 1, 4 do
			ball(0.45, rgb(196, 40, 52), CFrame.new(pos + Vector3.new(rng:NextNumber(-1.6, 1.6), rng:NextNumber(1, 2.2), rng:NextNumber(-1.6, 1.6))), m, Enum.Material.SmoothPlastic)
		end
	end
	m.Parent = parent
	return m
end

function Models.rock(pos, parent, scale)
	local s = scale or 1
	local p = part({ Size = Vector3.new(rng:NextNumber(2, 4.5), rng:NextNumber(1.4, 3), rng:NextNumber(2, 4.5)) * s,
		Color = vary(rgb(118, 116, 110), 0.1), Material = Enum.Material.Slate, CanCollide = true,
		CFrame = CFrame.new(pos + Vector3.new(0, 0.5 * s, 0)) * CFrame.Angles(rng:NextNumber(-0.3, 0.3), rng:NextNumber(0, 6.28), rng:NextNumber(-0.3, 0.3)) })
	p.Name = "Rock"
	p.Parent = parent
	return p
end

local FLOWER_COLORS = { rgb(238, 232, 120), rgb(240, 240, 240), rgb(208, 92, 160), rgb(132, 120, 230), rgb(230, 90, 70) }
function Models.flowers(pos, parent)
	local col = FLOWER_COLORS[rng:NextInteger(1, #FLOWER_COLORS)]
	for i = 1, rng:NextInteger(3, 6) do
		local p = ball(0.55, vary(col, 0.06), CFrame.new(pos + Vector3.new(rng:NextNumber(-2, 2), 0.35, rng:NextNumber(-2, 2))), parent)
		p.CastShadow = false
		p.Name = "Flower"
	end
end

---------------------------------------------------------------- Существа
-- Палитры: основной цвет, второй цвет, цвет головы, глаза
local PAL = {
	wolf     = { a = rgb(122, 124, 128), b = rgb(178, 176, 170), eye = rgb(255, 214, 60) },
	boar     = { a = rgb(92, 64, 44), b = rgb(60, 42, 30), eye = rgb(255, 90, 40) },
	ram      = { a = rgb(222, 212, 186), b = rgb(52, 44, 40), eye = rgb(255, 170, 40), horn = rgb(150, 120, 84) },
	giantrat = { a = rgb(112, 98, 86), b = rgb(214, 150, 150), eye = rgb(255, 40, 40) },
	bandit   = { a = rgb(96, 70, 48), b = rgb(52, 50, 58), head = rgb(214, 170, 132), hood = rgb(120, 34, 34), eye = rgb(30, 20, 20) },
	skeleton = { a = rgb(222, 216, 192), b = rgb(200, 194, 170), head = rgb(232, 226, 204), eye = rgb(255, 40, 40) },
	boss     = { a = rgb(210, 202, 176), b = rgb(70, 60, 64), head = rgb(226, 218, 192), eye = rgb(255, 30, 30), cape = rgb(110, 20, 28), gold = rgb(220, 176, 52) },
	merchant = { a = rgb(74, 98, 64), b = rgb(70, 54, 40), head = rgb(220, 178, 140), eye = rgb(30, 20, 20) },
}

local function finishCreature(model, root, hum, hip)
	hum.HipHeight = hip
	hum.Parent = model
	model.PrimaryPart = root
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("BasePart") then
			d.Anchored = false
			if d ~= root then
				d.CanCollide = false
				d.Massless = true
			end
		end
	end
	return model
end

-- Четвероногие: волк, кабан, бодун, крыса
local function buildQuad(kind, s)
	local pal = PAL[kind]
	local m = Instance.new("Model")
	local base = CFrame.new(0, 50, 0)
	local root = part({ Name = "HumanoidRootPart", Size = Vector3.new(2, 1.6, 3.6) * s, Transparency = 1, CFrame = base, Parent = m, CanCollide = true })
	local bodyMat = Enum.Material.Fabric
	local body = ellipsoid(Vector3.new(2.1, 1.8, 3.8) * s, pal.a, base, m, bodyMat)
	body.Name = "Body"
	weldTo(root, body)
	local head = ellipsoid(Vector3.new(1.4, 1.3, 1.5) * s, pal.a, base * CFrame.new(0, 0.55 * s, -2.1 * s), m, bodyMat)
	head.Name = "Head"
	weldTo(body, head)
	local snoutColor = kind == "ram" and pal.b or pal.a
	local snout = part({ Size = Vector3.new(0.8, 0.7, 0.9) * s, Color = snoutColor, CFrame = base * CFrame.new(0, 0.35 * s, -2.9 * s), Parent = m, Material = bodyMat })
	weldTo(head, snout)
	part({ Size = Vector3.new(0.35, 0.3, 0.2) * s, Color = rgb(30, 24, 22), CFrame = base * CFrame.new(0, 0.5 * s, -3.35 * s), Parent = m })
	for _, sx in ipairs({ -1, 1 }) do
		local eye = part({ Size = Vector3.new(0.22, 0.22, 0.1) * s, Color = pal.eye, Material = Enum.Material.Neon, CFrame = base * CFrame.new(sx * 0.38 * s, 0.85 * s, -2.8 * s), Parent = m })
		weldTo(head, eye)
		if kind == "wolf" or kind == "giantrat" then
			local ear = part({ ClassName = "WedgePart", Size = Vector3.new(0.2, 0.6, 0.45) * s, Color = pal.a, CFrame = base * CFrame.new(sx * 0.45 * s, 1.35 * s, -1.85 * s), Parent = m, Material = bodyMat })
			weldTo(head, ear)
		end
		if kind == "boar" then
			local tusk = part({ Size = Vector3.new(0.18, 0.55, 0.18) * s, Color = rgb(240, 234, 214), CFrame = base * CFrame.new(sx * 0.4 * s, 0.25 * s, -3.15 * s) * CFrame.Angles(0.5, 0, sx * 0.3), Parent = m })
			weldTo(head, tusk)
		end
		if kind == "ram" then
			for k = 0, 2 do
				local hp = ball((0.7 - k * 0.12) * s, pal.horn, base * CFrame.new(sx * (0.75 + k * 0.25) * s, (1.15 - k * 0.32) * s, (-1.9 + k * 0.35) * s), m, Enum.Material.Slate)
				weldTo(head, hp)
			end
		end
	end
	if kind == "boar" then
		for i = 0, 4 do
			local bristle = part({ Size = Vector3.new(0.3, 0.5, 0.5) * s, Color = pal.b, CFrame = base * CFrame.new(0, 0.95 * s, (-1.2 + i * 0.6) * s), Parent = m, Material = bodyMat })
			weldTo(body, bristle)
		end
	end
	if kind == "wolf" then
		local belly = ellipsoid(Vector3.new(1.4, 0.8, 2.6) * s, pal.b, base * CFrame.new(0, -0.55 * s, 0), m, bodyMat)
		weldTo(body, belly)
	end
	-- хвост
	local tailLen = kind == "giantrat" and 3.2 or (kind == "wolf" and 1.8 or 0.6)
	local tailColor = kind == "giantrat" and pal.b or pal.a
	local tail = part({ Size = Vector3.new(0.3, 0.3, tailLen) * s, Color = tailColor, CFrame = base * CFrame.new(0, 0.4 * s, (1.9 + tailLen / 2) * s) * CFrame.Angles(0.35, 0, 0), Parent = m, Material = bodyMat })
	tail.Name = "Tail"
	weldTo(body, tail)
	-- ноги на шарнирах (клиент их анимирует)
	local legLen = 1.6
	local legColor = kind == "ram" and pal.b or (kind == "boar" and pal.b or pal.a)
	local i = 0
	for _, lz in ipairs({ -1.25, 1.2 }) do
		for _, lx in ipairs({ -0.6, 0.6 }) do
			i = i + 1
			local leg = part({ Name = "Leg" .. i, Size = Vector3.new(0.45, legLen, 0.45) * s, Color = legColor, Parent = m, Material = bodyMat,
				CFrame = base * CFrame.new(lx * s, (-0.6 - legLen / 2) * s, lz * s) })
			local mo = motor("LegMotor" .. i, body, leg, CFrame.new(lx * s, -0.6 * s, lz * s), CFrame.new(0, legLen / 2 * s, 0))
			mo:SetAttribute("Phase", (i == 1 or i == 4) and 0 or math.pi)
		end
	end
	local hum = Instance.new("Humanoid")
	return finishCreature(m, root, hum, 1.4 * s)
end

-- Двуногие: разбойник, скелет, Мортракс, торговец
local function buildBiped(kind, s)
	local pal = PAL[kind]
	local m = Instance.new("Model")
	local base = CFrame.new(0, 50, 0)
	local bony = kind == "skeleton" or kind == "boss"
	local root = part({ Name = "HumanoidRootPart", Size = Vector3.new(2, 2, 1) * s, Transparency = 1, CFrame = base, Parent = m, CanCollide = true })
	local torsoSize = bony and Vector3.new(1.5, 2, 0.8) or Vector3.new(2, 2, 1)
	local torso = part({ Name = "Torso", Size = torsoSize * s, Color = pal.a, CFrame = base, Parent = m, Material = bony and Enum.Material.SmoothPlastic or Enum.Material.Fabric })
	weldTo(root, torso)
	if bony then
		torso.Transparency = 0.15
		for r = 0, 3 do
			local rib = part({ Size = Vector3.new(2, 0.22, 1) * s, Color = pal.b, CFrame = base * CFrame.new(0, (0.7 - r * 0.42) * s, 0), Parent = m })
			weldTo(torso, rib)
		end
	end
	local headSize = bony and 1.35 or 1.2
	local head = part({ Name = "Head", Size = Vector3.new(headSize, headSize, headSize) * s, Color = pal.head, CFrame = base * CFrame.new(0, 1.65 * s, 0), Parent = m })
	weldTo(torso, head)
	for _, sx in ipairs({ -1, 1 }) do
		local socket = part({ Size = Vector3.new(0.34, 0.3, 0.12) * s, Color = bony and rgb(24, 18, 18) or rgb(250, 250, 250), CFrame = base * CFrame.new(sx * 0.3 * s, 1.75 * s, -headSize / 2 * s), Parent = m })
		weldTo(head, socket)
		local eye = part({ Size = Vector3.new(0.16, 0.16, 0.08) * s, Color = pal.eye, Material = bony and Enum.Material.Neon or Enum.Material.SmoothPlastic, CFrame = base * CFrame.new(sx * 0.3 * s, 1.75 * s, (-headSize / 2 - 0.05) * s), Parent = m })
		weldTo(head, eye)
	end
	if bony then
		local jaw = part({ Size = Vector3.new(1.0, 0.35, 0.9) * s, Color = pal.b, CFrame = base * CFrame.new(0, 1.0 * s, -0.15 * s), Parent = m })
		weldTo(head, jaw)
		for t = -2, 2 do
			local tooth = part({ Size = Vector3.new(0.12, 0.2, 0.08) * s, Color = rgb(250, 248, 236), CFrame = base * CFrame.new(t * 0.17 * s, 1.22 * s, -0.62 * s), Parent = m })
			weldTo(head, tooth)
		end
	end
	if kind == "bandit" then
		local hood = part({ Size = Vector3.new(1.36, 0.7, 1.36) * s, Color = pal.hood, CFrame = base * CFrame.new(0, 2.15 * s, 0.05 * s), Parent = m, Material = Enum.Material.Fabric })
		weldTo(head, hood)
		local mask = part({ Size = Vector3.new(1.24, 0.5, 0.1) * s, Color = rgb(40, 34, 34), CFrame = base * CFrame.new(0, 1.35 * s, -0.62 * s), Parent = m, Material = Enum.Material.Fabric })
		weldTo(head, mask)
		local belt = part({ Size = Vector3.new(2.05, 0.3, 1.05) * s, Color = rgb(40, 30, 22), CFrame = base * CFrame.new(0, -0.7 * s, 0), Parent = m, Material = Enum.Material.Leather })
		weldTo(torso, belt)
	elseif kind == "merchant" then
		local hat = cylinderV(0.25 * s, 2.4 * s, rgb(120, 82, 46), base * CFrame.new(0, 2.3 * s, 0), m, Enum.Material.Fabric)
		weldTo(head, hat)
		local hatTop = cylinderV(0.7 * s, 1.3 * s, rgb(120, 82, 46), base * CFrame.new(0, 2.7 * s, 0), m, Enum.Material.Fabric)
		weldTo(head, hatTop)
		local beard = part({ Size = Vector3.new(1.0, 0.8, 0.35) * s, Color = rgb(150, 140, 130), CFrame = base * CFrame.new(0, 1.15 * s, -0.55 * s), Parent = m, Material = Enum.Material.Fabric })
		weldTo(head, beard)
		local apron = part({ Size = Vector3.new(1.6, 1.8, 0.1) * s, Color = rgb(196, 180, 140), CFrame = base * CFrame.new(0, -0.3 * s, -0.55 * s), Parent = m, Material = Enum.Material.Fabric })
		weldTo(torso, apron)
	elseif kind == "boss" then
		local crownBase = cylinderV(0.45 * s, 1.5 * s, pal.gold, base * CFrame.new(0, 2.45 * s, 0), m, Enum.Material.Metal)
		weldTo(head, crownBase)
		for k = 0, 4 do
			local a = k / 5 * math.pi * 2
			local spike = part({ ClassName = "WedgePart", Size = Vector3.new(0.18, 0.7, 0.4) * s, Color = pal.gold, Material = Enum.Material.Metal,
				CFrame = base * CFrame.new(math.cos(a) * 0.62 * s, 2.95 * s, math.sin(a) * 0.62 * s) * CFrame.Angles(0, -a + math.pi / 2, 0), Parent = m })
			weldTo(head, spike)
		end
		local gem = part({ Size = Vector3.new(0.25, 0.25, 0.1) * s, Color = rgb(200, 20, 40), Material = Enum.Material.Neon, CFrame = base * CFrame.new(0, 2.5 * s, -0.78 * s), Parent = m })
		weldTo(head, gem)
		local cape = part({ Size = Vector3.new(2.6, 3.8, 0.15) * s, Color = pal.cape, Material = Enum.Material.Fabric, CFrame = base * CFrame.new(0, -0.4 * s, 0.6 * s) * CFrame.Angles(0.12, 0, 0), Parent = m })
		weldTo(torso, cape)
		for _, sx in ipairs({ -1, 1 }) do
			local pad = ellipsoid(Vector3.new(1.4, 0.9, 1.3) * s, pal.b, base * CFrame.new(sx * 1.15 * s, 1.05 * s, 0), m, Enum.Material.Metal)
			weldTo(torso, pad)
			for k = 0, 1 do
				local sp = part({ ClassName = "WedgePart", Size = Vector3.new(0.15, 0.6, 0.3) * s, Color = rgb(190, 184, 160), CFrame = base * CFrame.new(sx * (1.0 + k * 0.35) * s, 1.65 * s, 0), Parent = m })
				weldTo(torso, sp)
			end
		end
		local glow = Instance.new("PointLight")
		glow.Color = rgb(255, 40, 40)
		glow.Range = 16
		glow.Brightness = 2
		glow.Parent = head
	end
	-- руки и ноги
	local limbColor = bony and pal.a or pal.a
	local legColor = bony and pal.a or pal.b
	local armW = bony and 0.45 or 0.85
	local legW = bony and 0.5 or 0.9
	local arms = {}
	for _, sx in ipairs({ -1, 1 }) do
		local name = sx < 0 and "L" or "R"
		local arm = part({ Name = "Arm" .. name, Size = Vector3.new(armW, 2, armW) * s, Color = limbColor, Parent = m, Material = bony and Enum.Material.SmoothPlastic or Enum.Material.Fabric,
			CFrame = base * CFrame.new(sx * 1.35 * s, 0, 0) })
		motor("ArmMotor" .. name, torso, arm, CFrame.new(sx * 1.35 * s, 0.9 * s, 0), CFrame.new(0, 0.9 * s, 0))
		arms[name] = arm
		local hand = part({ Size = Vector3.new(armW + 0.1, 0.4, armW + 0.1) * s, Color = bony and pal.b or (pal.head or limbColor), CFrame = base * CFrame.new(sx * 1.35 * s, -0.95 * s, 0), Parent = m })
		weldTo(arm, hand)
		local leg = part({ Name = "Leg" .. name, Size = Vector3.new(legW, 2, legW) * s, Color = legColor, Parent = m, Material = bony and Enum.Material.SmoothPlastic or Enum.Material.Fabric,
			CFrame = base * CFrame.new(sx * 0.5 * s, -2 * s, 0) })
		local mo = motor("LegMotor" .. name, torso, leg, CFrame.new(sx * 0.5 * s, -1 * s, 0), CFrame.new(0, 1 * s, 0))
		mo:SetAttribute("Phase", sx < 0 and 0 or math.pi)
		local boot = part({ Size = Vector3.new(legW + 0.1, 0.4, legW + 0.35) * s, Color = bony and pal.b or rgb(40, 30, 24), CFrame = base * CFrame.new(sx * 0.5 * s, -2.8 * s, -0.12 * s), Parent = m })
		weldTo(leg, boot)
	end
	-- оружие в правой руке
	local armR = arms.R
	local handCF = base * CFrame.new(1.35 * s, -1.1 * s, 0)
	if kind == "boss" then
		local shaft = part({ Size = Vector3.new(0.35, 5.5, 0.35) * s, Color = rgb(60, 44, 36), Material = Enum.Material.Wood, CFrame = handCF * CFrame.new(0, 0, -1.6 * s) * CFrame.Angles(math.pi / 2, 0, 0), Parent = m })
		weldTo(armR, shaft)
		local headP = part({ Size = Vector3.new(1.3, 1.3, 1.6) * s, Color = rgb(70, 70, 78), Material = Enum.Material.Metal, CFrame = handCF * CFrame.new(0, 0, -4.2 * s), Parent = m })
		weldTo(armR, headP)
		for k = -1, 1, 2 do
			local spike = part({ ClassName = "WedgePart", Size = Vector3.new(0.3, 0.8, 0.5) * s, Color = rgb(200, 196, 180), CFrame = handCF * CFrame.new(k * 0.85 * s, 0, -4.2 * s) * CFrame.Angles(0, 0, -k * math.pi / 2), Parent = m })
			weldTo(armR, spike)
		end
	elseif kind == "skeleton" then
		local blade = part({ Size = Vector3.new(0.18, 0.5, 2.8) * s, Color = rgb(150, 140, 120), Material = Enum.Material.Metal, CFrame = handCF * CFrame.new(0, 0, -1.4 * s), Parent = m })
		weldTo(armR, blade)
		local shield = cylinderV(0.25 * s, 1.8 * s, rgb(92, 70, 50), base * CFrame.new(-1.6 * s, -0.3 * s, -0.3 * s) * CFrame.Angles(0, 0, math.pi / 2), m, Enum.Material.Wood)
		weldTo(arms.L, shield)
	elseif kind == "bandit" then
		local knife = part({ Size = Vector3.new(0.15, 0.3, 1.3) * s, Color = rgb(200, 204, 210), Material = Enum.Material.Metal, CFrame = handCF * CFrame.new(0, 0, -0.7 * s), Parent = m })
		weldTo(armR, knife)
	end
	local hum = Instance.new("Humanoid")
	return finishCreature(m, root, hum, 2 * s)
end

-- Слизень: полупрозрачный сгусток с клыками
local function buildBlob(s)
	local m = Instance.new("Model")
	local base = CFrame.new(0, 50, 0)
	local root = part({ Name = "HumanoidRootPart", Size = Vector3.new(2.6, 1.8, 2.6) * s, Transparency = 1, CFrame = base, Parent = m, CanCollide = true })
	local body = ellipsoid(Vector3.new(3.2, 2.4, 3.2) * s, rgb(70, 170, 70), base, m, Enum.Material.Glass)
	body.Name = "Head"
	body.Transparency = 0.2
	motor("BodyMotor", root, body, CFrame.new(0, 0, 0), CFrame.new(0, 0, 0))
	local core = ball(1.2 * s, rgb(30, 90, 30), base * CFrame.new(0, -0.2 * s, 0.3 * s), m, Enum.Material.SmoothPlastic)
	weldTo(body, core)
	for _, sx in ipairs({ -1, 1 }) do
		local eye = ball(0.55 * s, rgb(255, 220, 40), base * CFrame.new(sx * 0.6 * s, 0.4 * s, -1.25 * s), m, Enum.Material.Neon)
		weldTo(body, eye)
		local pupil = part({ Size = Vector3.new(0.12, 0.45, 0.1) * s, Color = rgb(10, 10, 10), CFrame = base * CFrame.new(sx * 0.6 * s, 0.4 * s, -1.52 * s), Parent = m })
		weldTo(body, pupil)
		local brow = part({ Size = Vector3.new(0.7, 0.15, 0.15) * s, Color = rgb(20, 60, 20), CFrame = base * CFrame.new(sx * 0.6 * s, 0.85 * s, -1.25 * s) * CFrame.Angles(0, 0, sx * 0.45), Parent = m })
		weldTo(body, brow)
	end
	for t = -2, 2 do
		local fang = part({ ClassName = "WedgePart", Size = Vector3.new(0.12, 0.35, 0.15) * s, Color = rgb(240, 240, 220), CFrame = base * CFrame.new(t * 0.22 * s, -0.4 * s, -1.4 * s) * CFrame.Angles(math.pi, 0, 0), Parent = m })
		weldTo(body, fang)
	end
	local hum = Instance.new("Humanoid")
	return finishCreature(m, root, hum, 0.3 * s)
end

function Models.creature(kind, scale)
	local s = scale or 1
	if kind == "wolf" or kind == "boar" or kind == "ram" or kind == "giantrat" then
		return buildQuad(kind, s)
	elseif kind == "slime" then
		return buildBlob(s)
	end
	return buildBiped(kind, s)
end

---------------------------------------------------------------- Торговая лавка
-- Рыночный навес из дерева и холста в приглушённых тонах. cf смотрит лицом к покупателю
function Models.stall(cf, parent)
	local m = Instance.new("Model")
	m.Name = "Stall"
	local wood = rgb(110, 82, 56)
	local dark = rgb(78, 58, 40)
	local function at(x, y, z) return cf * CFrame.new(x, y, z) end
	for _, x in ipairs({ -6, 6 }) do
		for _, z in ipairs({ -2.5, 2.5 }) do
			local h = z < 0 and 9 or 7.6
			part({ Size = Vector3.new(0.7, h, 0.7), Color = vary(wood, 0.04), Material = Enum.Material.Wood, CFrame = at(x, h / 2, z), Parent = m, CanCollide = true })
		end
	end
	-- прилавок
	part({ Size = Vector3.new(11, 0.5, 2.6), Color = wood, Material = Enum.Material.WoodPlanks, CFrame = at(0, 3.4, -2.2), Parent = m, CanCollide = true })
	part({ Size = Vector3.new(11, 3.2, 0.4), Color = dark, Material = Enum.Material.WoodPlanks, CFrame = at(0, 1.6, -3.3), Parent = m, CanCollide = true })
	-- полосатый холст крыши, наклонён назад
	for i = 0, 5 do
		local c = (i % 2 == 0) and rgb(186, 170, 136) or rgb(146, 84, 66)
		part({ Size = Vector3.new(2.1, 0.2, 6.6), Color = c, Material = Enum.Material.Fabric, CFrame = at(-5.25 + i * 2.1, 8.4, 0) * CFrame.Angles(-0.22, 0, 0), Parent = m })
	end
	-- бахрома спереди
	for i = 0, 10 do
		part({ ClassName = "WedgePart", Size = Vector3.new(0.1, 0.6, 1.05), Color = (i % 2 == 0) and rgb(146, 84, 66) or rgb(186, 170, 136),
			Material = Enum.Material.Fabric, CFrame = at(-5.25 + i * 1.05, 8.75, -3.35) * CFrame.Angles(0, math.pi / 2, math.pi), Parent = m })
	end
	-- товары на прилавке: бутылочки и мешочек
	local cols = { rgb(214, 58, 72), rgb(52, 200, 240), rgb(255, 154, 42), rgb(138, 122, 255) }
	for i, c in ipairs(cols) do
		local b = ball(0.8, c, at(-3.5 + i * 1.1, 4.05, -2.2), m, Enum.Material.Glass)
		b.Transparency = 0.15
		cylinderV(0.5, 0.3, rgb(220, 228, 232), at(-3.5 + i * 1.1, 4.6, -2.2), m, Enum.Material.Glass)
	end
	ellipsoid(Vector3.new(1.4, 1.1, 1.2), rgb(160, 130, 90), at(3, 4.1, -2.1), m, Enum.Material.Fabric)
	-- стойка с мечом и копьём сбоку
	part({ Size = Vector3.new(0.2, 3.5, 0.5), Color = rgb(190, 196, 204), Material = Enum.Material.Metal, CFrame = at(7.5, 2.4, -1) * CFrame.Angles(0, 0, 0.15), Parent = m })
	part({ Size = Vector3.new(0.25, 6, 0.25), Color = wood, Material = Enum.Material.Wood, CFrame = at(8.1, 3.1, -1) * CFrame.Angles(0, 0, -0.1), Parent = m })
	-- бочки и ящики
	for _, x in ipairs({ -8.3, 9.2 }) do
		local barrel = cylinderV(3.2, 2.6, rgb(120, 84, 50), at(x, 1.6, 1.5), m, Enum.Material.Wood)
		barrel.CanCollide = true
		cylinderV(0.25, 2.7, rgb(70, 70, 74), at(x, 0.7, 1.5), m, Enum.Material.Metal)
		cylinderV(0.25, 2.7, rgb(70, 70, 74), at(x, 2.5, 1.5), m, Enum.Material.Metal)
	end
	part({ Size = Vector3.new(2.6, 2.6, 2.6), Color = rgb(150, 112, 70), Material = Enum.Material.WoodPlanks, CFrame = at(-8.6, 1.3, -1.6) * CFrame.Angles(0, 0.3, 0), Parent = m, CanCollide = true })
	part({ Size = Vector3.new(1.8, 1.8, 1.8), Color = rgb(140, 104, 64), Material = Enum.Material.WoodPlanks, CFrame = at(-8.4, 3.5, -1.5) * CFrame.Angles(0, -0.2, 0), Parent = m, CanCollide = true })
	-- фонарь
	local lamp = part({ Size = Vector3.new(0.8, 1.1, 0.8), Color = rgb(255, 196, 110), Material = Enum.Material.Neon, CFrame = at(-5.6, 7, -2.9), Parent = m })
	local light = Instance.new("PointLight")
	light.Color = rgb(255, 190, 120)
	light.Range = 22
	light.Brightness = 1.6
	light.Shadows = true
	light.Parent = lamp
	-- вывеска
	local sign = part({ Size = Vector3.new(5, 1.6, 0.25), Color = dark, Material = Enum.Material.Wood, CFrame = at(0, 9.6, -3.2) * CFrame.Angles(-0.22, 0, 0), Parent = m })
	local sg = Instance.new("SurfaceGui")
	sg.Face = Enum.NormalId.Front
	sg.PixelsPerStud = 40
	sg.Parent = sign
	local t = Instance.new("TextLabel")
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundTransparency = 1
	t.Text = "ЛАВКА"
	t.TextScaled = true
	t.Font = Enum.Font.Merriweather
	t.TextColor3 = rgb(236, 210, 150)
	t.Parent = sg
	m.Parent = parent
	return m
end

function Models.merchant(cf, parent)
	local m = Models.creature("merchant", 1)
	m.Name = "Торговец"
	m:PivotTo(cf)
	for _, d in ipairs(m:GetDescendants()) do
		if d:IsA("BasePart") then d.Anchored = true end
	end
	local hum = m:FindFirstChildOfClass("Humanoid")
	if hum then hum.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None end
	m.Parent = parent
	return m
end

---------------------------------------------------------------- Подписи
function Models.label(adornee, text, color, offsetY, maxDist)
	local bg = Instance.new("BillboardGui")
	bg.Size = UDim2.fromOffset(220, 40)
	bg.StudsOffset = Vector3.new(0, offsetY or 3, 0)
	bg.AlwaysOnTop = false
	bg.MaxDistance = maxDist or 90
	bg.Adornee = adornee
	local t = Instance.new("TextLabel")
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundTransparency = 1
	t.Text = text
	t.Font = Enum.Font.GothamBold
	t.TextSize = 18
	t.TextColor3 = color or rgb(255, 230, 170)
	t.TextStrokeTransparency = 0.3
	t.Parent = bg
	bg.Parent = adornee
	return bg
end

function Models.torch(pos, parent)
	local stick = part({ Size = Vector3.new(0.4, 3, 0.4), Color = rgb(80, 56, 36), Material = Enum.Material.Wood, CFrame = CFrame.new(pos + Vector3.new(0, 1.5, 0)), Parent = parent })
	local head = part({ Size = Vector3.new(0.7, 0.6, 0.7), Color = rgb(255, 160, 60), Material = Enum.Material.Neon, CFrame = CFrame.new(pos + Vector3.new(0, 3.2, 0)), Parent = parent })
	local fire = Instance.new("Fire")
	fire.Size = 2.5
	fire.Heat = 6
	fire.Parent = head
	local light = Instance.new("PointLight")
	light.Color = rgb(255, 170, 90)
	light.Range = 24
	light.Brightness = 1.8
	light.Shadows = true
	light.Parent = head
	return stick
end

---------------------------------------------------------------- Предметы на земле
function Models.coins(pos, parent)
	local m = Instance.new("Model")
	m.Name = "Gold"
	local gold = rgb(255, 176, 30)
	local core
	for i = 1, 7 do
		local c = cylinderV(0.18, 0.9, vary(gold, 0.05), CFrame.new(pos + Vector3.new(rng:NextNumber(-0.7, 0.7), 0.15 + (i % 3) * 0.17, rng:NextNumber(-0.7, 0.7))) * CFrame.Angles(rng:NextNumber(-0.25, 0.25), 0, rng:NextNumber(-0.25, 0.25)), m, Enum.Material.Metal)
		c.CastShadow = false
		if not core then core = c end
	end
	local hit = part({ Name = "Hitbox", Size = Vector3.new(3.4, 3, 3.4), Transparency = 1, CFrame = CFrame.new(pos + Vector3.new(0, 1.2, 0)), Parent = m, CanCollide = false })
	hit.CanTouch = true
	local sp = Instance.new("Sparkles")
	sp.SparkleColor = rgb(255, 210, 80)
	sp.Parent = core
	local light = Instance.new("PointLight")
	light.Color = rgb(255, 196, 80)
	light.Range = 8
	light.Brightness = 1.2
	light.Parent = core
	m.PrimaryPart = hit
	m.Parent = parent
	return m, hit
end

function Models.bottle(pos, color, parent)
	local m = Instance.new("Model")
	m.Name = "Elixir"
	local b = ball(1.3, color, CFrame.new(pos + Vector3.new(0, 0.7, 0)), m, Enum.Material.Glass)
	b.Transparency = 0.1
	cylinderV(0.7, 0.45, rgb(220, 228, 232), CFrame.new(pos + Vector3.new(0, 1.55, 0)), m, Enum.Material.Glass)
	cylinderV(0.35, 0.55, rgb(138, 90, 43), CFrame.new(pos + Vector3.new(0, 2.0, 0)), m, Enum.Material.Wood)
	local hit = part({ Name = "Hitbox", Size = Vector3.new(3, 3, 3), Transparency = 1, CFrame = CFrame.new(pos + Vector3.new(0, 1.2, 0)), Parent = m, CanCollide = false })
	hit.CanTouch = true
	local light = Instance.new("PointLight")
	light.Color = color
	light.Range = 8
	light.Brightness = 1.4
	light.Parent = b
	m.PrimaryPart = hit
	m.Parent = parent
	return m, hit
end

---------------------------------------------------------------- Оружие героя (инструменты)
local function toolPart(tool, name, size, color, material, offset, handle)
	local p = part({ Name = name, Size = size, Color = color, Material = material, CFrame = handle.CFrame * offset, Parent = tool })
	p.Anchored = false
	p.Massless = true
	p.CanCollide = false
	local w = Instance.new("WeldConstraint")
	w.Part0 = handle
	w.Part1 = p
	w.Parent = p
	return p
end

function Models.weaponTool(id, displayName)
	local tool = Instance.new("Tool")
	tool.Name = displayName or id
	tool.CanBeDropped = false
	tool.RequiresHandle = true
	tool:SetAttribute("WeaponId", id)
	local handle = part({ Name = "Handle", Size = Vector3.new(0.35, 1.2, 0.35), Color = rgb(84, 54, 34), Material = Enum.Material.Leather, CFrame = CFrame.new(0, 100, 0), Parent = tool })
	handle.Anchored = false
	handle.Massless = true
	if id == "spear" then
		handle.Size = Vector3.new(0.3, 7, 0.3)
		handle.Material = Enum.Material.Wood
		handle.Color = rgb(122, 88, 56)
		toolPart(tool, "Tip", Vector3.new(0.18, 1.4, 0.5), rgb(196, 200, 208), Enum.Material.Metal, CFrame.new(0, 4.1, 0), handle)
		toolPart(tool, "Wrap", Vector3.new(0.4, 0.5, 0.4), rgb(140, 40, 36), Enum.Material.Fabric, CFrame.new(0, 3.2, 0), handle)
		tool.Grip = CFrame.new(0, -1.2, 0)
	elseif id == "axe" then
		handle.Size = Vector3.new(0.35, 4.2, 0.35)
		handle.Material = Enum.Material.Wood
		toolPart(tool, "Blade", Vector3.new(0.25, 1.6, 1.8), rgb(170, 176, 184), Enum.Material.Metal, CFrame.new(0, 1.6, -0.9), handle)
		tool.Grip = CFrame.new(0, -1.2, 0)
	elseif id == "bow" then
		handle.Size = Vector3.new(0.3, 1, 0.3)
		toolPart(tool, "LimbTop", Vector3.new(0.25, 2.2, 0.25), rgb(110, 76, 44), Enum.Material.Wood, CFrame.new(0, 1.5, 0.35) * CFrame.Angles(-0.35, 0, 0), handle)
		toolPart(tool, "LimbBottom", Vector3.new(0.25, 2.2, 0.25), rgb(110, 76, 44), Enum.Material.Wood, CFrame.new(0, -1.5, 0.35) * CFrame.Angles(0.35, 0, 0), handle)
		toolPart(tool, "String", Vector3.new(0.05, 4.6, 0.05), rgb(230, 230, 220), Enum.Material.Fabric, CFrame.new(0, 0, 0.8), handle)
	else -- меч
		toolPart(tool, "Guard", Vector3.new(1.5, 0.22, 0.4), rgb(214, 172, 60), Enum.Material.Metal, CFrame.new(0, 0.7, 0), handle)
		toolPart(tool, "Blade", Vector3.new(0.18, 3.4, 0.5), rgb(204, 210, 218), Enum.Material.Metal, CFrame.new(0, 2.5, 0), handle)
		toolPart(tool, "Tip", Vector3.new(0.18, 0.4, 0.35), rgb(204, 210, 218), Enum.Material.Metal, CFrame.new(0, 4.35, 0), handle)
		toolPart(tool, "Pommel", Vector3.new(0.4, 0.4, 0.4), rgb(214, 172, 60), Enum.Material.Metal, CFrame.new(0, -0.75, 0), handle)
	end
	return tool
end

-- Доспех поверх торса героя
function Models.armorPiece(char, color)
	local torso = char:FindFirstChild("UpperTorso") or char:FindFirstChild("Torso")
	if not torso then return nil end
	local r15 = torso.Name == "UpperTorso"
	local size = r15 and Vector3.new(2.15, 1.75, 1.25) or Vector3.new(2.15, 2.1, 1.2)
	local p = part({ Name = "EldoriaArmor", Size = size, Color = color, Material = Enum.Material.Metal, CFrame = torso.CFrame, Parent = char })
	p.Anchored = false
	p.Massless = true
	p.CanCollide = false
	p.CanQuery = false
	local w = Instance.new("WeldConstraint")
	w.Part0 = torso
	w.Part1 = p
	w.Parent = p
	for _, sx in ipairs({ -1, 1 }) do
		local pad = ellipsoid(Vector3.new(1.2, 0.7, 1.3), color, torso.CFrame * CFrame.new(sx * 1.15, size.Y / 2 - 0.15, 0), char, Enum.Material.Metal)
		pad.Name = "EldoriaArmor"
		pad.Anchored = false
		pad.Massless = true
		pad.CanQuery = false
		local w2 = Instance.new("WeldConstraint")
		w2.Part0 = torso
		w2.Part1 = pad
		w2.Parent = pad
	end
	return p
end

return Models
