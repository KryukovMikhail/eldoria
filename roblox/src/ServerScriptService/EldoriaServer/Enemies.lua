-- Враги: появление, поведение, урон, смерть, снаряды и удары босса по площади
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")
local Config = require(game:GetService("ReplicatedStorage"):WaitForChild("Eldoria"):WaitForChild("Config"))
local Models = require(script.Parent:WaitForChild("Models"))

local Enemies = {}
local list = {}
Enemies.list = list
Enemies.safeZones = {}              -- { {pos=Vector3, r=число} } — у входа в пещеру, у лавки и на площади враги не нападают
Enemies.hurtPlayer = function(plr, dmg, source) end
Enemies.onKilled = function(rec, killer) end
Enemies.onBossPhase = function(rec, phase) end
Enemies.fx = function(kind, data) end

local rng = Random.new()
local folder, projFolder
local projectiles, aoes = {}, {}

local function now() return os.clock() end
local function flat(v) return Vector3.new(v.X, 0, v.Z) end

local function inSafe(p)
	for _, z in ipairs(Enemies.safeZones) do
		if (flat(p) - flat(z.pos)).Magnitude < z.r then return true end
	end
	return false
end
Enemies.inSafe = inSafe

local function aliveChar(plr)
	local ch = plr.Character
	if not ch then return nil end
	local hum = ch:FindFirstChildOfClass("Humanoid")
	local hrp = ch:FindFirstChild("HumanoidRootPart")
	if hum and hrp and hum.Health > 0 then return hrp, hum end
	return nil
end

function Enemies.init(parentFolder)
	folder = Instance.new("Folder")
	folder.Name = "Enemies"
	folder.Parent = parentFolder
	projFolder = Instance.new("Folder")
	projFolder.Name = "Projectiles"
	projFolder.Parent = parentFolder
	Enemies.folder = folder
	local acc = 0
	RunService.Heartbeat:Connect(function(dt)
		Enemies.stepProjectiles(dt)
		acc = acc + dt
		if acc >= 0.12 then
			local step = acc
			acc = 0
			for i = #list, 1, -1 do
				local rec = list[i]
				if rec and not rec.dead then
					local ok, err = pcall(Enemies.think, rec, step)
					if not ok then warn("Eldoria AI:", err) end
				end
			end
		end
	end)
end

---------------------------------------------------------------- появление
function Enemies.spawn(kind, pos, opts)
	opts = opts or {}
	local def = Config.ENEMY[kind]
	if not def then return nil end
	local model = Models.creature(kind, def.scale)
	model.Name = def.name
	local hum = model:FindFirstChildOfClass("Humanoid")
	local root = model.PrimaryPart
	local hp = def.hp * (opts.hpMul or 1)
	hum.MaxHealth = hp
	hum.Health = hp
	hum.WalkSpeed = Config.walkSpeed(def.speed) * (def.boss and 1.35 or 1)
	hum.DisplayName = def.name
	hum.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.Viewer
	hum.NameDisplayDistance = def.boss and 0 or 55
	hum.HealthDisplayDistance = def.boss and 0 or 55
	hum.HealthDisplayType = Enum.HumanoidHealthDisplayType.DisplayWhenDamaged
	hum.BreakJointsOnDeath = true
	hum.RequiresNeck = false
	hum.AutoRotate = true
	for _, st in ipairs({ Enum.HumanoidStateType.FallingDown, Enum.HumanoidStateType.Ragdoll, Enum.HumanoidStateType.Climbing, Enum.HumanoidStateType.Seated }) do
		hum:SetStateEnabled(st, false)
	end
	local y = hum.HipHeight + root.Size.Y / 2 + 0.6
	local gy = Enemies.groundY(pos) or pos.Y
	model:PivotTo(CFrame.new(pos.X, gy + y, pos.Z) * CFrame.Angles(0, rng:NextNumber(0, 6.28), 0))
	model:SetAttribute("EnemyType", kind)
	if def.boss then model:SetAttribute("Boss", true) end
	model.Parent = folder
	pcall(function() root:SetNetworkOwner(nil) end)
	local rec = {
		kind = kind, def = def, model = model, hum = hum, root = root,
		home = pos, zone = opts.zone or "ow", minion = opts.minion,
		dmg = math.floor(def.dmg * (opts.dmgMul or 1) + 0.5),
		xp = opts.minion and math.floor(def.xp * 0.4) or def.xp,
		gold = opts.minion and 0 or def.gold,
		aggro = Config.aggroStuds(def.aggro),
		reach = (def.body == "quad" and 3.2 or 2.6) * def.scale + 2.4,
		atkT = -1e9, wanderT = -1e9, phase = 1, born = now(),
		lastPos = root.Position, stuckT = now(),
	}
	if def.boss then
		rec.reach = 12
		rec.slamT = 0
		rec.summonT = 0
	end
	hum.Died:Connect(function() Enemies.die(rec) end)
	table.insert(list, rec)
	return rec
end

---------------------------------------------------------------- урон по врагу
function Enemies.damage(rec, amount, attacker, fromPos, knock)
	if rec.dead or rec.hum.Health <= 0 then return false end
	amount = math.max(1, math.floor(amount + 0.5))
	-- убийцу запоминаем ДО урона: событие Died может сработать прямо внутри TakeDamage
	rec.lastHitter = attacker
	rec.lastHitT = now()
	rec.forceTarget = attacker
	rec.forceUntil = now() + 6
	rec.hum:TakeDamage(amount)
	local hl = Instance.new("Highlight")
	hl.FillColor = Color3.fromRGB(255, 70, 60)
	hl.FillTransparency = 0.35
	hl.OutlineTransparency = 1
	hl.DepthMode = Enum.HighlightDepthMode.Occluded
	hl.Parent = rec.model
	Debris:AddItem(hl, 0.13)
	if not rec.def.boss and fromPos and rec.root.Parent then
		local d = flat(rec.root.Position - fromPos)
		if d.Magnitude > 0.01 then
			rec.root.AssemblyLinearVelocity = d.Unit * (knock or 26) + Vector3.new(0, 9, 0)
		end
	end
	local head = rec.model:FindFirstChild("Head") or rec.root
	Enemies.fx("dmg", { pos = head.Position + Vector3.new(0, 2, 0), text = tostring(amount), big = knock and knock > 30 })
	if rec.def.boss then
		local r = rec.hum.Health / rec.hum.MaxHealth
		local ph = (r <= 0.25 and 3) or (r <= 0.5 and 2) or 1
		if ph > rec.phase and rec.hum.Health > 0 then
			rec.phase = ph
			Enemies.onBossPhase(rec, ph)
			Enemies.summon(rec, ph == 2 and 2 or 3)
		end
	end
	return true
end

function Enemies.die(rec)
	if rec.dead then return end
	rec.dead = true
	for i, r in ipairs(list) do
		if r == rec then table.remove(list, i); break end
	end
	local killer = nil
	if rec.lastHitter and rec.lastHitter.Parent and now() - (rec.lastHitT or 0) < 15 then killer = rec.lastHitter end
	local pos = rec.root.Position
	Enemies.fx("death", { pos = pos, boss = rec.def.boss and true or false })
	local ok, err = pcall(Enemies.onKilled, rec, killer)
	if not ok then warn("Eldoria onKilled:", err) end
	-- кости рассыпаются: включаем столкновения, через пару секунд всё растворяется
	for _, d in ipairs(rec.model:GetDescendants()) do
		if d:IsA("BasePart") then
			d.CanCollide = d ~= rec.root
			d.Massless = false
			d.AssemblyLinearVelocity = Vector3.new(rng:NextNumber(-12, 12), rng:NextNumber(8, 18), rng:NextNumber(-12, 12))
		elseif d:IsA("PointLight") or d:IsA("BillboardGui") then
			d:Destroy()
		end
	end
	task.delay(1.6, function()
		if not rec.model.Parent then return end
		for _, d in ipairs(rec.model:GetDescendants()) do
			if d:IsA("BasePart") and d.Transparency < 1 then
				TweenService:Create(d, TweenInfo.new(0.8), { Transparency = 1 }):Play()
			end
		end
		Debris:AddItem(rec.model, 0.9)
	end)
end

function Enemies.clearZone(zone)
	for i = #list, 1, -1 do
		local rec = list[i]
		if rec.zone == zone then
			rec.dead = true
			table.remove(list, i)
			rec.model:Destroy()
		end
	end
end

function Enemies.count(zone, includeMinions)
	local n = 0
	for _, rec in ipairs(list) do
		if rec.zone == zone and not rec.dead and (includeMinions or not rec.minion) and not rec.def.boss then n = n + 1 end
	end
	return n
end

---------------------------------------------------------------- поведение
local function setMarker(rec, on)
	local head = rec.model:FindFirstChild("Head")
	if not head then return end
	local m = head:FindFirstChild("Alert")
	if on and not m then
		m = Instance.new("BillboardGui")
		m.Name = "Alert"
		m.Size = UDim2.fromOffset(40, 40)
		m.StudsOffset = Vector3.new(0, 3, 0)
		m.AlwaysOnTop = true
		local t = Instance.new("TextLabel")
		t.Size = UDim2.fromScale(1, 1)
		t.BackgroundTransparency = 1
		t.Text = "!"
		t.Font = Enum.Font.GothamBlack
		t.TextScaled = true
		t.TextColor3 = Color3.fromRGB(255, 70, 50)
		t.TextStrokeTransparency = 0
		t.Parent = m
		m.Parent = head
	elseif not on and m then
		m:Destroy()
	end
end

local function findTarget(rec)
	local pos = rec.root.Position
	if rec.forceTarget and now() < (rec.forceUntil or 0) then
		local hrp = aliveChar(rec.forceTarget)
		if hrp and not inSafe(hrp.Position) and (hrp.Position - pos).Magnitude < rec.aggro * 2.2 then return rec.forceTarget, hrp, (hrp.Position - pos).Magnitude end
	end
	local best, bestHrp, bd = nil, nil, rec.aggro
	for _, plr in ipairs(Players:GetPlayers()) do
		local hrp = aliveChar(plr)
		if hrp and not inSafe(hrp.Position) then
			local d = (hrp.Position - pos).Magnitude
			if d < bd then best, bestHrp, bd = plr, hrp, d end
		end
	end
	return best, bestHrp, bd
end

local function face(rec, p)
	local r = rec.root
	local look = flat(p - r.Position)
	if look.Magnitude > 0.1 then
		r.CFrame = CFrame.lookAt(r.Position, r.Position + look)
	end
end

local function meleeSwing(rec, plr, mul, delayS, reachBonus)
	rec.model:SetAttribute("AtkAt", workspace:GetServerTimeNow())
	task.delay(delayS or 0.25, function()
		if rec.dead then return end
		local hrp = aliveChar(plr)
		if hrp and (hrp.Position - rec.root.Position).Magnitude <= rec.reach + (reachBonus or 1.5) then
			Enemies.hurtPlayer(plr, math.floor(rec.dmg * (mul or 1) + 0.5), rec.def.name)
		end
	end)
end

function Enemies.think(rec, dt)
	local t = now()
	local hum, root = rec.hum, rec.root
	if not root.Parent then rec.dead = true; return end
	-- особые состояния бодуна
	if rec.state == "windup" then
		if t >= rec.stateEnd then
			rec.state = "dash"
			rec.stateEnd = t + 0.6
			rec.dashHit = false
			hum.WalkSpeed = 36
			hum:MoveTo(root.Position + rec.dashDir * 32)
		end
		return
	elseif rec.state == "dash" then
		if not rec.dashHit then
			for _, plr in ipairs(Players:GetPlayers()) do
				local hrp = aliveChar(plr)
				if hrp and (hrp.Position - root.Position).Magnitude < rec.reach + 1 then
					rec.dashHit = true
					Enemies.hurtPlayer(plr, math.floor(rec.dmg * 2.4 + 0.5), rec.def.name)
					hrp.AssemblyLinearVelocity = rec.dashDir * 40 + Vector3.new(0, 20, 0)
				end
			end
		end
		if t >= rec.stateEnd or rec.dashHit then
			rec.state = nil
			hum.WalkSpeed = Config.walkSpeed(rec.def.speed)
			setMarker(rec, false)
			rec.chargeCd = t + 3.2
			hum:MoveTo(root.Position)
		end
		return
	end

	local plr, hrp, dist = findTarget(rec)
	if plr then
		rec.engaged = true
		local tp = hrp.Position
		-- застревание: прыжок и шаг в сторону
		if (root.Position - rec.lastPos).Magnitude > 1 then rec.lastPos = root.Position; rec.stuckT = t
		elseif dist > rec.reach + 1 and t - rec.stuckT > 1.3 then
			hum.Jump = true
			local side = flat(tp - root.Position)
			if side.Magnitude > 0.1 then
				side = Vector3.new(-side.Z, 0, side.X).Unit * (rng:NextNumber() < 0.5 and -10 or 10)
				hum:MoveTo(root.Position + side)
			end
			rec.stuckT = t
			return
		end
		if rec.def.boss then
			Enemies.bossThink(rec, plr, hrp, dist, t)
			return
		end
		if rec.def.charge and dist < 30 and dist > 7 and t >= (rec.chargeCd or 0) then
			rec.state = "windup"
			rec.stateEnd = t + 0.65
			rec.dashDir = flat(tp - root.Position).Unit
			hum:MoveTo(root.Position)
			face(rec, tp)
			setMarker(rec, true)
			return
		end
		if rec.def.thrower and dist < 28 and dist > 8 then
			if dist > 20 then hum:MoveTo(tp) else hum:MoveTo(root.Position); face(rec, tp) end
			if t >= (rec.throwCd or 0) then
				rec.throwCd = t + 2.6
				rec.model:SetAttribute("AtkAt", workspace:GetServerTimeNow())
				local from = root.Position + Vector3.new(0, 1.5, 0)
				local aim = tp + hrp.AssemblyLinearVelocity * 0.25
				Enemies.projectile(from, (aim - from).Unit * 48, math.floor(rec.dmg * 0.9 + 0.5), rec.def.name, "knife")
			end
			return
		end
		if dist > rec.reach then
			hum:MoveTo(tp)
		else
			hum:MoveTo(root.Position)
			face(rec, tp)
			if t >= rec.atkT then
				rec.atkT = t + 1.1
				meleeSwing(rec, plr, 1, 0.25)
			end
		end
	else
		rec.engaged = false
		local fromHome = flat(root.Position - rec.home).Magnitude
		if fromHome > (rec.def.boss and 30 or 70) then
			hum:MoveTo(rec.home)
			rec.wanderT = t + 4
		elseif t >= rec.wanderT then
			rec.wanderT = t + rng:NextNumber(3, 7)
			if not rec.def.boss and rec.zone == "ow" then
				hum:MoveTo(rec.home + Vector3.new(rng:NextNumber(-18, 18), 0, rng:NextNumber(-18, 18)))
			end
		end
	end
end

---------------------------------------------------------------- Мортракс
function Enemies.bossThink(rec, plr, hrp, dist, t)
	local hum, root = rec.hum, rec.root
	local tp = hrp.Position
	if not rec.taunted then
		rec.taunted = true
		rec.slamT = t + 2.6
		rec.summonT = t + 4
	end
	-- удар по площади: круг на земле, через 1.15 с — взрыв
	if t >= rec.slamT then
		local cds = { 6.5, 4.8, 3.4 }
		rec.slamT = t + cds[rec.phase]
		local R = (54 + 6 * rec.phase) / 32 * 8
		rec.model:SetAttribute("AtkAt", workspace:GetServerTimeNow())
		Enemies.aoe(tp, R, 1.15, math.floor(rec.dmg * 1.2 + 0.5), rec.def.name)
		if rec.phase >= 3 then
			local a = rng:NextNumber(0, 6.28)
			task.delay(0.25, function()
				if not rec.dead then Enemies.aoe(tp + Vector3.new(math.cos(a) * 22, 0, math.sin(a) * 22), R, 1.15, math.floor(rec.dmg * 1.2 + 0.5), rec.def.name) end
			end)
		end
	end
	if rec.phase >= 2 and t >= rec.summonT then
		rec.summonT = t + 7.5
		Enemies.summon(rec, 1)
	end
	if dist > rec.reach then
		hum:MoveTo(tp)
	else
		hum:MoveTo(root.Position)
		face(rec, tp)
		if t >= rec.atkT then
			rec.atkT = t + 1.6
			meleeSwing(rec, plr, 1, 0.45, 3)
		end
	end
end

function Enemies.summon(boss, n)
	local alive = 0
	for _, r in ipairs(list) do if r.minion and not r.dead and r.zone == boss.zone then alive = alive + 1 end end
	local want = math.min(n, 3 - alive)
	for i = 1, want do
		local a = rng:NextNumber(0, 6.28)
		local p = boss.root.Position + Vector3.new(math.cos(a) * 12, 0, math.sin(a) * 12)
		local ground = Enemies.groundY(p) or boss.home.Y
		local m = Enemies.spawn("skeleton", Vector3.new(p.X, ground, p.Z), { zone = boss.zone, minion = true })
		if m then
			Enemies.fx("summon", { pos = Vector3.new(p.X, ground + 1, p.Z) })
		end
	end
end

---------------------------------------------------------------- удары по площади
function Enemies.groundY(p)
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.RespectCanCollide = true   -- кроны деревьев и декор не считаются землёй
	local ex = { folder, projFolder }
	for _, plr in ipairs(Players:GetPlayers()) do if plr.Character then table.insert(ex, plr.Character) end end
	params.FilterDescendantsInstances = ex
	local res = workspace:Raycast(p + Vector3.new(0, 12, 0), Vector3.new(0, -60, 0), params)
	return res and res.Position.Y or nil
end

function Enemies.aoe(center, r, delayS, dmg, source)
	local gy = Enemies.groundY(center) or (center.Y - 3)
	local c = Vector3.new(center.X, gy + 0.15, center.Z)
	local ring = Models.cylinderV(0.25, r * 2, Color3.fromRGB(255, 60, 40), CFrame.new(c), projFolder, Enum.Material.Neon)
	ring.Transparency = 0.75
	ring.CastShadow = false
	ring.CanQuery = false
	local inner = Models.cylinderV(0.3, 0.5, Color3.fromRGB(255, 120, 60), CFrame.new(c), projFolder, Enum.Material.Neon)
	inner.Transparency = 0.35
	inner.CastShadow = false
	inner.CanQuery = false
	TweenService:Create(inner, TweenInfo.new(delayS, Enum.EasingStyle.Linear), { Size = Vector3.new(0.3, r * 2, r * 2) }):Play()
	task.delay(delayS, function()
		ring:Destroy()
		inner:Destroy()
		Enemies.fx("boom", { pos = c, r = r })
		for _, plr in ipairs(Players:GetPlayers()) do
			local hrp = aliveChar(plr)
			if hrp and flat(hrp.Position - c).Magnitude < r and math.abs(hrp.Position.Y - c.Y) < 10 then
				Enemies.hurtPlayer(plr, dmg, source)
			end
		end
	end)
end

---------------------------------------------------------------- снаряды
function Enemies.projectile(from, vel, dmg, source, kind)
	local p = Models.part({ Name = "Knife", Size = Vector3.new(0.25, 0.25, 1.3), Color = Color3.fromRGB(205, 210, 218), Material = Enum.Material.Metal,
		CFrame = CFrame.lookAt(from, from + vel), Parent = projFolder })
	p.CanQuery = false
	p.CastShadow = false
	table.insert(projectiles, { part = p, pos = from, vel = vel, life = 1.4, dmg = dmg, source = source, spin = 0 })
end

function Enemies.stepProjectiles(dt)
	if #projectiles == 0 then return end
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	local ex = { folder, projFolder }
	for _, plr in ipairs(Players:GetPlayers()) do if plr.Character then table.insert(ex, plr.Character) end end
	params.FilterDescendantsInstances = ex
	for i = #projectiles, 1, -1 do
		local pr = projectiles[i]
		local nextPos = pr.pos + pr.vel * dt
		local done = false
		pr.life = pr.life - dt
		if pr.life <= 0 then done = true end
		if not done and workspace:Raycast(pr.pos, nextPos - pr.pos, params) then done = true end
		if not done then
			for _, plr in ipairs(Players:GetPlayers()) do
				local hrp = aliveChar(plr)
				if hrp and (hrp.Position - nextPos).Magnitude < 2.6 then
					Enemies.hurtPlayer(plr, pr.dmg, pr.source)
					done = true
					break
				end
			end
		end
		if done then
			pr.part:Destroy()
			table.remove(projectiles, i)
		else
			pr.pos = nextPos
			pr.spin = pr.spin + dt * 20
			pr.part.CFrame = CFrame.lookAt(nextPos, nextPos + pr.vel) * CFrame.Angles(pr.spin, 0, 0)
		end
	end
end

return Enemies
