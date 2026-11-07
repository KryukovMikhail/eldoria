-- Упрощённый макет API Roblox для прогона скриптов вне Studio (Lua 5.4)
local R = {}
local unpack = table.unpack

-------------------------------------------------------------------- math
math.clamp = function(v, a, b) if v < a then return a elseif v > b then return b end return v end
math.sign = function(v) return v > 0 and 1 or (v < 0 and -1 or 0) end
math.round = function(v) return math.floor(v + 0.5) end

-------------------------------------------------------------------- Vector3
local V3 = {}
V3.__index = function(v, k)
	if k == "Magnitude" then return math.sqrt(v.X * v.X + v.Y * v.Y + v.Z * v.Z) end
	if k == "Unit" then
		local m = math.sqrt(v.X * v.X + v.Y * v.Y + v.Z * v.Z)
		if m == 0 then return setmetatable({ X = 0 / 0, Y = 0 / 0, Z = 0 / 0 }, V3) end
		return setmetatable({ X = v.X / m, Y = v.Y / m, Z = v.Z / m }, V3)
	end
	if k == "Dot" then return function(a, b) return a.X * b.X + a.Y * b.Y + a.Z * b.Z end end
	if k == "Cross" then return function(a, b) return Vector3.new(a.Y * b.Z - a.Z * b.Y, a.Z * b.X - a.X * b.Z, a.X * b.Y - a.Y * b.X) end end
	if k == "Lerp" then return function(a, b, t) return a + (b - a) * t end end
	error("Vector3 has no member " .. tostring(k), 2)
end
local function isV3(x) return getmetatable(x) == V3 end
V3.__add = function(a, b) assert(isV3(a) and isV3(b), "Vector3 + non-Vector3"); return Vector3.new(a.X + b.X, a.Y + b.Y, a.Z + b.Z) end
V3.__sub = function(a, b) assert(isV3(a) and isV3(b), "Vector3 - non-Vector3"); return Vector3.new(a.X - b.X, a.Y - b.Y, a.Z - b.Z) end
V3.__mul = function(a, b)
	if type(a) == "number" then return Vector3.new(a * b.X, a * b.Y, a * b.Z) end
	if type(b) == "number" then return Vector3.new(a.X * b, a.Y * b, a.Z * b) end
	return Vector3.new(a.X * b.X, a.Y * b.Y, a.Z * b.Z)
end
V3.__div = function(a, b)
	if type(b) == "number" then return Vector3.new(a.X / b, a.Y / b, a.Z / b) end
	return Vector3.new(a.X / b.X, a.Y / b.Y, a.Z / b.Z)
end
V3.__unm = function(a) return Vector3.new(-a.X, -a.Y, -a.Z) end
V3.__eq = function(a, b) return a.X == b.X and a.Y == b.Y and a.Z == b.Z end
V3.__tostring = function(v) return string.format("(%.2f, %.2f, %.2f)", v.X, v.Y, v.Z) end
V3.__concat = function(a, b) return tostring(a) .. tostring(b) end
Vector3 = {
	new = function(x, y, z)
		x, y, z = x or 0, y or 0, z or 0
		assert(type(x) == "number" and type(y) == "number" and type(z) == "number", "Vector3.new expects numbers")
		return setmetatable({ X = x, Y = y, Z = z }, V3)
	end,
}
Vector3.zero = Vector3.new(0, 0, 0)
Vector3.one = Vector3.new(1, 1, 1)

-------------------------------------------------------------------- CFrame (позиция + матрица 3x3 по строкам)
local CF = {}
local function mk(p, m) return setmetatable({ p = p, m = m }, CF) end
local function matmul(a, b)
	local r = {}
	for i = 0, 2 do for j = 0, 2 do
		local s = 0
		for k = 0, 2 do s = s + a[i * 3 + k + 1] * b[k * 3 + j + 1] end
		r[i * 3 + j + 1] = s
	end end
	return r
end
local function mulv(m, v) return Vector3.new(m[1] * v.X + m[2] * v.Y + m[3] * v.Z, m[4] * v.X + m[5] * v.Y + m[6] * v.Z, m[7] * v.X + m[8] * v.Y + m[9] * v.Z) end
local function transpose(m) return { m[1], m[4], m[7], m[2], m[5], m[8], m[3], m[6], m[9] } end
local ID = { 1, 0, 0, 0, 1, 0, 0, 0, 1 }
CF.__index = function(c, k)
	if k == "Position" then return c.p end
	if k == "X" then return c.p.X end
	if k == "Y" then return c.p.Y end
	if k == "Z" then return c.p.Z end
	if k == "LookVector" then return Vector3.new(-c.m[3], -c.m[6], -c.m[9]) end
	if k == "RightVector" then return Vector3.new(c.m[1], c.m[4], c.m[7]) end
	if k == "UpVector" then return Vector3.new(c.m[2], c.m[5], c.m[8]) end
	if k == "Inverse" then return function(s) local mt = transpose(s.m); return mk(-mulv(mt, s.p), mt) end end
	if k == "VectorToWorldSpace" then return function(s, v) return mulv(s.m, v) end end
	if k == "VectorToObjectSpace" then return function(s, v) return mulv(transpose(s.m), v) end end
	if k == "PointToWorldSpace" then return function(s, v) return s * v end end
	if k == "PointToObjectSpace" then return function(s, v) return s:Inverse() * v end end
	if k == "Lerp" then return function(a, b, t) return mk(a.p + (b.p - a.p) * t, b.m) end end
	error("CFrame has no member " .. tostring(k), 2)
end
CF.__mul = function(a, b)
	if getmetatable(b) == CF then return mk(a.p + mulv(a.m, b.p), matmul(a.m, b.m)) end
	assert(isV3(b), "CFrame * expects CFrame or Vector3")
	return a.p + mulv(a.m, b)
end
CF.__add = function(a, v) assert(isV3(v), "CFrame + expects Vector3"); return mk(a.p + v, a.m) end
CF.__sub = function(a, v) assert(isV3(v), "CFrame - expects Vector3"); return mk(a.p - v, a.m) end
local function rx(a) local c, s = math.cos(a), math.sin(a); return { 1, 0, 0, 0, c, -s, 0, s, c } end
local function ry(a) local c, s = math.cos(a), math.sin(a); return { c, 0, s, 0, 1, 0, -s, 0, c } end
local function rz(a) local c, s = math.cos(a), math.sin(a); return { c, -s, 0, s, c, 0, 0, 0, 1 } end
CFrame = {
	new = function(x, y, z)
		if x == nil then return mk(Vector3.new(), ID) end
		if isV3(x) then return mk(x, ID) end
		assert(type(x) == "number" and type(y) == "number" and type(z) == "number", "CFrame.new expects numbers or Vector3")
		return mk(Vector3.new(x, y, z), ID)
	end,
	Angles = function(a, b, c)
		assert(type(a) == "number" and type(b) == "number" and type(c) == "number", "CFrame.Angles expects numbers")
		return mk(Vector3.new(), matmul(matmul(rx(a), ry(b)), rz(c)))
	end,
	lookAt = function(pos, target)
		assert(isV3(pos) and isV3(target), "CFrame.lookAt expects Vector3s")
		local f = (target - pos).Unit
		if f.X ~= f.X then return mk(pos, ID) end
		local up = Vector3.new(0, 1, 0)
		local r = f:Cross(up)
		if r.Magnitude < 1e-6 then r = Vector3.new(1, 0, 0) end
		r = r.Unit
		local u = r:Cross(f)
		return mk(pos, { r.X, u.X, -f.X, r.Y, u.Y, -f.Y, r.Z, u.Z, -f.Z })
	end,
}
CFrame.fromEulerAnglesXYZ = CFrame.Angles
CFrame.identity = CFrame.new()

-------------------------------------------------------------------- прочие типы
local function valueType(name, fields)
	return setmetatable({}, { __index = function(_, k) return function(...) local t = { __type = name, k, ... }; return t end end })
end
Color3 = {
	new = function(r, g, b) return { R = r or 0, G = g or 0, B = b or 0, __type = "Color3" } end,
	fromRGB = function(r, g, b)
		assert(type(r) == "number" and type(g) == "number" and type(b) == "number", "Color3.fromRGB expects numbers")
		return { R = r / 255, G = g / 255, B = b / 255, __type = "Color3" }
	end,
}
UDim = { new = function(s, o) return { Scale = s, Offset = o } end }
UDim2 = {
	new = function(a, b, c, d) return { X = { Scale = a or 0, Offset = b or 0 }, Y = { Scale = c or 0, Offset = d or 0 } } end,
	fromOffset = function(x, y) return UDim2.new(0, x or 0, 0, y or 0) end,
	fromScale = function(x, y) return UDim2.new(x or 0, 0, y or 0, 0) end,
}
Vector2 = { new = function(x, y) return { X = x or 0, Y = y or 0 } end }
NumberRange = { new = function(a, b) return { Min = a, Max = b or a } end }
NumberSequence = { new = function(a, b) return { a, b } end }
NumberSequenceKeypoint = { new = function(t, v) return { t, v } end }
ColorSequence = { new = function(a, b)
	if type(a) == "table" and a.__type ~= "Color3" then for _, kp in ipairs(a) do assert(kp.__kp, "ColorSequence needs keypoints") end end
	return { a, b }
end }
ColorSequenceKeypoint = { new = function(t, c) assert(type(t) == "number" and c.__type == "Color3"); return { __kp = true, t, c } end }
TweenInfo = { new = function(...) return { ... } end }
RaycastParams = { new = function() return {} end }
Random = { new = function(seed)
	local r = {}
	function r:NextNumber(a, b) a = a or 0; b = b or 1; return a + math.random() * (b - a) end
	function r:NextInteger(a, b) return math.random(a, b) end
	return r
end }

-- Enum: Enum.Material.Grass и т. п.
local enumItemMT = { __tostring = function(e) return "Enum." .. e.EnumType .. "." .. e.Name end }
Enum = setmetatable({}, { __index = function(_, typ)
	local t = setmetatable({}, { __index = function(tt, name)
		local item = setmetatable({ Name = name, EnumType = typ }, enumItemMT)
		rawset(tt, name, item)
		return item
	end })
	rawset(Enum, typ, t)
	return t
end })

-------------------------------------------------------------------- сигналы
local Signal = {}
Signal.__index = Signal
function Signal.new(name) return setmetatable({ name = name, fns = {} }, Signal) end
function Signal:Connect(fn)
	table.insert(self.fns, fn)
	local sig = self
	return { Disconnect = function() for i, f in ipairs(sig.fns) do if f == fn then table.remove(sig.fns, i) end end end, Connected = true }
end
Signal.connect = Signal.Connect
function Signal:Once(fn) return self:Connect(fn) end
function Signal:Fire(...)
	for _, fn in ipairs({ table.unpack(self.fns) }) do
		local ok, err = xpcall(fn, debug.traceback, ...)
		if not ok then R.errors = R.errors + 1; print("!! ОШИБКА в обработчике " .. self.name .. ": " .. err) end
	end
end
function Signal:Wait() return nil end
R.Signal = Signal
R.errors = 0

local SIGNALS = {
	Died = 1, Touched = 1, Triggered = 1, Changed = 1, Activated = 1, Deactivated = 1, Heartbeat = 1, RenderStepped = 1, Stepped = 1,
	OnServerEvent = 1, OnClientEvent = 1, PlayerAdded = 1, PlayerRemoving = 1, CharacterAdded = 1, ChildAdded = 1, ChildRemoved = 1,
	AttributeChanged = 1, InputBegan = 1, InputEnded = 1, Unequipped = 1, Equipped = 1, DescendantAdded = 1, AncestryChanged = 1,
	MouseButton1Click = 1, Completed = 1,
}

-------------------------------------------------------------------- экземпляры
local Inst = {}
local instData = setmetatable({}, { __mode = "k" })
local CLASS_IS = {
	Part = { "BasePart", "PVInstance" }, WedgePart = { "BasePart", "PVInstance" }, SpawnLocation = { "BasePart", "Part", "PVInstance" },
	MeshPart = { "BasePart" }, Terrain = { "BasePart" }, Model = { "PVInstance" }, Workspace = { "Model" },
	TextLabel = { "GuiObject", "GuiBase2d" }, TextButton = { "GuiObject", "GuiButton", "GuiBase2d" }, Frame = { "GuiObject", "GuiBase2d" },
	ScrollingFrame = { "GuiObject", "GuiBase2d" }, ImageLabel = { "GuiObject" }, Script = { "LuaSourceContainer", "BaseScript" },
	LocalScript = { "LuaSourceContainer", "BaseScript", "Script" }, ModuleScript = { "LuaSourceContainer" },
	PointLight = { "Light" }, Weld = { "JointInstance" }, Motor6D = { "JointInstance", "Motor" }, Tool = { "BackpackItem" },
	Backpack = {}, Humanoid = {}, Player = {},
}
local DEFAULTS = {
	Transparency = 0, Anchored = false, CanCollide = true, Health = 100, MaxHealth = 100, WalkSpeed = 16, HipHeight = 0,
	Visible = true, Enabled = true, Value = nil, Density = 0.3, Haze = 0, BackgroundTransparency = 0, TextTransparency = 0,
	ClockTime = 14, Massless = false, UserId = 1, DisplayName = "Тестер", MoveDirection = nil,
}

local function newInstance(class)
	local o = setmetatable({}, Inst)
	instData[o] = { class = class, props = { Name = class }, children = {}, attrs = {}, signals = {}, attrSignals = {}, propSignals = {} }
	local d = instData[o]
	if class == "Part" or class == "WedgePart" or class == "SpawnLocation" or class == "MeshPart" or class == "Terrain" then
		d.props.CFrame = CFrame.new()
		d.props.Size = Vector3.new(4, 1, 2)
		d.props.AssemblyLinearVelocity = Vector3.new()
		d.props.Color = Color3.new(0.6, 0.6, 0.6)
	end
	if class == "Humanoid" then d.props.MoveDirection = Vector3.new() end
	return o
end
R.newInstance = newInstance

local function isA(o, c)
	local d = instData[o]
	if d.class == c or c == "Instance" then return true end
	for _, b in ipairs(CLASS_IS[d.class] or {}) do if b == c then return true end end
	return false
end

local methods = {}
function methods:IsA(c) return isA(self, c) end
function methods:GetChildren() local t = {}; for _, c in ipairs(instData[self].children) do table.insert(t, c) end; return t end
function methods:GetDescendants()
	local t = {}
	local function rec(o) for _, c in ipairs(instData[o].children) do table.insert(t, c); rec(c) end end
	rec(self)
	return t
end
function methods:FindFirstChild(n, recursive)
	for _, c in ipairs(instData[self].children) do if instData[c].props.Name == n then return c end end
	if recursive then for _, c in ipairs(self:GetDescendants()) do if instData[c].props.Name == n then return c end end end
	return nil
end
function methods:FindFirstChildOfClass(cl)
	for _, c in ipairs(instData[self].children) do if instData[c].class == cl then return c end end
	return nil
end
function methods:FindFirstChildWhichIsA(cl)
	for _, c in ipairs(instData[self].children) do if isA(c, cl) then return c end end
	return nil
end
function methods:FindFirstAncestorOfClass(cl)
	local p = instData[self].props.Parent
	while p do if instData[p].class == cl then return p end; p = instData[p].props.Parent end
	return nil
end
function methods:FindFirstAncestor(n)
	local p = instData[self].props.Parent
	while p do if instData[p].props.Name == n then return p end; p = instData[p].props.Parent end
	return nil
end
function methods:WaitForChild(n)
	local c = self:FindFirstChild(n)
	if not c then error("WaitForChild: нет дочернего «" .. tostring(n) .. "» у " .. tostring(instData[self].props.Name), 2) end
	return c
end
function methods:Destroy()
	local d = instData[self]
	if d.props.Parent then
		local sib = instData[d.props.Parent].children
		for i, c in ipairs(sib) do if c == self then table.remove(sib, i); break end end
	end
	d.props.Parent = nil
	d.destroyed = true
	for _, c in ipairs(self:GetChildren()) do c:Destroy() end
end
function methods:ClearAllChildren() for _, c in ipairs(self:GetChildren()) do c:Destroy() end end
function methods:Clone()
	local d = instData[self]
	local o = newInstance(d.class)
	for k, v in pairs(d.props) do if k ~= "Parent" then instData[o].props[k] = v end end
	for k, v in pairs(d.attrs) do instData[o].attrs[k] = v end
	for _, c in ipairs(d.children) do c:Clone().Parent = o end
	return o
end
function methods:SetAttribute(k, v)
	local d = instData[self]
	assert(type(k) == "string", "SetAttribute: имя должно быть строкой")
	local tv = type(v)
	assert(v == nil or tv == "number" or tv == "string" or tv == "boolean" or isV3(v) or (tv == "table" and (v.__type == "Color3")), "SetAttribute: неподдерживаемый тип " .. tv .. " для " .. k)
	d.attrs[k] = v
	if d.signals.AttributeChanged then d.signals.AttributeChanged:Fire(k) end
	if d.attrSignals[k] then d.attrSignals[k]:Fire() end
end
function methods:GetAttribute(k) return instData[self].attrs[k] end
function methods:GetAttributes() return instData[self].attrs end
function methods:GetAttributeChangedSignal(k)
	local d = instData[self]
	d.attrSignals[k] = d.attrSignals[k] or Signal.new("Attr:" .. k)
	return d.attrSignals[k]
end
function methods:GetPropertyChangedSignal(k)
	local d = instData[self]
	d.propSignals[k] = d.propSignals[k] or Signal.new("Prop:" .. k)
	return d.propSignals[k]
end
function methods:GetFullName()
	local parts = {}
	local o = self
	while o do table.insert(parts, 1, instData[o].props.Name); o = instData[o].props.Parent end
	return table.concat(parts, ".")
end
-- модели и детали
function methods:GetPivot()
	local d = instData[self]
	if d.props.CFrame then return d.props.CFrame end
	local pp = d.props.PrimaryPart
	if pp then return pp.CFrame end
	for _, c in ipairs(self:GetDescendants()) do if instData[c].props.CFrame then return instData[c].props.CFrame end end
	return CFrame.new()
end
function methods:PivotTo(cf)
	assert(getmetatable(cf) == CF, "PivotTo expects CFrame")
	local d = instData[self]
	if d.class ~= "Model" then self.CFrame = cf; return end
	local old = self:GetPivot()
	local delta = cf * old:Inverse()
	for _, c in ipairs(self:GetDescendants()) do
		local cd = instData[c]
		if cd.props.CFrame then cd.props.CFrame = delta * cd.props.CFrame end
	end
end
function methods:SetNetworkOwner() end
function methods:GetMass() return 1 end
function methods:ApplyImpulse() end
-- Humanoid
function methods:TakeDamage(n)
	assert(type(n) == "number", "TakeDamage expects number")
	local d = instData[self]
	local before = d.props.Health or 100
	d.props.Health = math.max(0, before - n)
	if before > 0 and d.props.Health <= 0 then self.Died:Fire() end
end
function methods:MoveTo(p) assert(isV3(p), "MoveTo expects Vector3"); instData[self].moveTarget = p end
function methods:SetStateEnabled(st, on) assert(type(on) == "boolean") end
function methods:EquipTool(t) t.Parent = instData[self].props.Parent end
function methods:UnequipTools() end
function methods:LoadAnimation() return { Play = function() end, Stop = function() end } end
function methods:GetState() return Enum.HumanoidStateType.Running end
-- ParticleEmitter, Sound, Tween
function methods:Emit(n) assert(type(n) == "number") end
function methods:Play() end
function methods:Stop() end
-- Remote
function methods:FireServer(...) R.onFireServer(self, ...) end
function methods:FireClient(plr, ...) R.onFireClient(self, plr, ...) end
function methods:FireAllClients(...) R.onFireClient(self, nil, ...) end
-- Terrain
for _, n in ipairs({ "FillBlock", "FillBall", "FillCylinder", "FillWedge", "Clear", "FillRegion" }) do
	methods[n] = function(self, a, b, c, d)
		R.terrainOps = (R.terrainOps or 0) + 1
		if n == "FillBlock" then assert(getmetatable(a) == CF and isV3(b) and type(c) == "table", "FillBlock(cf, size, material)") end
		if n == "FillBall" then assert(isV3(a) and type(b) == "number" and type(c) == "table", "FillBall(center, r, material)") end
		if n == "FillCylinder" then assert(getmetatable(a) == CF and type(b) == "number" and type(c) == "number" and type(d) == "table", "FillCylinder(cf, h, r, material)") end
	end
end
-- Player
function methods:LoadCharacter() R.loadCharacter(self) end
function methods:GetMouse() return newInstance("Mouse") end

Inst.__index = function(o, k)
	local d = instData[o]
	if methods[k] then return methods[k] end
	if k == "ClassName" then return d.class end
	if k == "Position" and d.props.CFrame then return d.props.CFrame.Position end
	if k == "WorldPosition" then return d.props.WorldPosition or d.props.Position or Vector3.new() end
	if k == "PrimaryPart" then return d.props.PrimaryPart end
	if d.props[k] ~= nil then return d.props[k] end
	if SIGNALS[k] then
		d.signals[k] = d.signals[k] or Signal.new(d.class .. "." .. k)
		return d.signals[k]
	end
	local c = o:FindFirstChild(k)
	if c then return c end
	if DEFAULTS[k] ~= nil then return DEFAULTS[k] end
	return nil
end
Inst.__newindex = function(o, k, v)
	local d = instData[o]
	if k == "Parent" then
		if d.destroyed and v ~= nil then error("Parent: экземпляр уже уничтожен", 2) end
		local old = d.props.Parent
		if old then
			local sib = instData[old].children
			for i, c in ipairs(sib) do if c == o then table.remove(sib, i); break end end
		end
		d.props.Parent = v
		if v then
			assert(instData[v], "Parent must be an Instance")
			table.insert(instData[v].children, o)
			local pd = instData[v]
			if pd.signals.ChildAdded then pd.signals.ChildAdded:Fire(o) end
		end
		return
	end
	if k == "Position" and d.props.CFrame then
		assert(isV3(v), "Position expects Vector3")
		d.props.CFrame = CFrame.new(v) * CFrame.new()
		return
	end
	if k == "CFrame" then assert(getmetatable(v) == CF, "CFrame property expects CFrame, got " .. type(v)) end
	if k == "Size" and (d.class == "Part" or d.class == "WedgePart" or d.class == "SpawnLocation") then assert(isV3(v), "Size expects Vector3") end
	if ((k == "Color" and d.class ~= "ParticleEmitter") or k == "BackgroundColor3" or k == "TextColor3") then assert(type(v) == "table" and v.__type == "Color3", k .. " expects Color3") end
	if k == "Health" and type(v) == "number" then
		local before = d.props.Health or 100
		d.props.Health = v
		if before > 0 and v <= 0 then o.Died:Fire() end
		return
	end
	if k == "Text" then assert(type(v) == "string", "Text expects string, got " .. type(v)) end
	d.props[k] = v
	if d.propSignals[k] then d.propSignals[k]:Fire() end
end
Inst.__tostring = function(o) return instData[o].props.Name end

Instance = { new = function(class, parent)
	local o = newInstance(class)
	if parent then o.Parent = parent end
	return o
end }
R.instData = instData

-------------------------------------------------------------------- задачи
local pendingDelays = {}
R.pendingDelays = pendingDelays
task = {
	wait = function(t)
		if coroutine.isyieldable() then coroutine.yield() end
		return t or 0
	end,
	spawn = function(fn, ...)
		local co = coroutine.create(fn)
		local ok, err = coroutine.resume(co, ...)
		if not ok then R.errors = R.errors + 1; print("!! ОШИБКА в task.spawn: " .. debug.traceback(co, err)) end
		return co
	end,
	defer = function(fn, ...) table.insert(pendingDelays, { fn = fn, args = { ... } }) end,
	delay = function(t, fn, ...) table.insert(pendingDelays, { fn = fn, args = { ... } }) end,
	cancel = function() end,
}
function R.runDelays(rounds)
	for r = 1, rounds or 3 do
		local list = {}
		for i = #pendingDelays, 1, -1 do table.insert(list, 1, table.remove(pendingDelays, i)) end
		for _, item in ipairs(list) do
			local co = coroutine.create(item.fn)
			local ok, err = coroutine.resume(co, table.unpack(item.args))
			if not ok then R.errors = R.errors + 1; print("!! ОШИБКА в task.delay: " .. debug.traceback(co, err)) end
		end
	end
end
wait = task.wait
spawn = task.spawn
delay = task.delay
tick = os.clock
warn = function(...) print("WARN:", ...) end
typeof = function(v)
	if getmetatable(v) == V3 then return "Vector3" end
	if getmetatable(v) == CF then return "CFrame" end
	if getmetatable(v) == Inst then return "Instance" end
	return type(v)
end

return R
