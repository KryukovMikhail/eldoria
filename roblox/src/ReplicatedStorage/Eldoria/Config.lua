-- Хроники Эльдории для Roblox: общие настройки (сервер и клиент)
local Config = {}

Config.BUILD = "R001.001"
Config.TITLE = "Хроники Эльдории"

-- Мир
Config.CELL = 8            -- размер клетки карты в студах
Config.MAP_N = 96          -- карта N x N клеток
Config.LAIR_ORIGIN = Vector3.new(0, 0, 2600)   -- логово Мортракса строится далеко от поверхности
Config.DAY_LENGTH = 720    -- длина суток в секундах

-- Герой
Config.PLAYER = { hp = 100, atk = 16, xpNext = 50, walkSpeed = 16 }
Config.LEVEL_UP = { hp = 18, atk = 4, xpMul = 1.35 }
Config.CHARGE_TIME = 0.55  -- удержание атаки для сильного удара
Config.DASH = { cooldown = 1.2, invuln = 0.35, power = 75 }

-- Враги. speed/aggro — в пикселях браузерной версии, пересчитываются в студы
Config.ENEMY = {
	wolf     = { name = "Волк",              hp = 28,  dmg = 7,  speed = 75, xp = 14,  gold = 2,  aggro = 150, body = "quad", scale = 1.0 },
	boar     = { name = "Кабан",             hp = 40,  dmg = 10, speed = 88, xp = 17,  gold = 3,  aggro = 150, body = "quad", scale = 1.05 },
	ram      = { name = "Бодун",             hp = 52,  dmg = 12, speed = 70, xp = 20,  gold = 4,  aggro = 210, body = "quad", scale = 1.15, charge = true },
	bandit   = { name = "Разбойник",         hp = 42,  dmg = 9,  speed = 66, xp = 24,  gold = 9,  aggro = 220, body = "biped", scale = 1.0, thrower = true },
	skeleton = { name = "Скелет",            hp = 42,  dmg = 11, speed = 55, xp = 24,  gold = 5,  aggro = 170, body = "biped", scale = 1.0 },
	slime    = { name = "Слизень",           hp = 18,  dmg = 5,  speed = 40, xp = 9,   gold = 2,  aggro = 110, body = "blob",  scale = 1.0 },
	giantrat = { name = "Гигантская крыса",  hp = 28,  dmg = 8,  speed = 92, xp = 15,  gold = 2,  aggro = 160, body = "quad",  scale = 0.75 },
	boss     = { name = "Мортракс",          hp = 220, dmg = 20, speed = 55, xp = 150, gold = 60, aggro = 260, body = "biped", scale = 2.6, boss = true },
}
Config.OVERWORLD_ROSTER = { "wolf", "wolf", "boar", "bandit", "ram" }
Config.OVERWORLD_ENEMIES = 46
Config.LAIR_GUARDS = { "skeleton", "slime", "skeleton", "giantrat" }

function Config.walkSpeed(px) return 16 * px / 140 end
function Config.aggroStuds(px) return px / 32 * 8 * 1.4 end

-- Оружие (mult — множитель к урону героя, cooldown — секунды, range — дальность удара в студах)
Config.WEAPON_ORDER = { "sword", "spear", "bow", "axe" }
Config.WEAPONS = {
	sword = { name = "Меч",          mult = 1.0, price = 0,   cooldown = 0.38, range = 7.5, arc = 110, unlock = 0, anim = "Slash", desc = "Базовое оружие, быстрый удар перед собой." },
	spear = { name = "Копьё",        mult = 1.5, price = 50,  cooldown = 0.38, range = 9.5, arc = 70,  unlock = 1, anim = "Lunge", desc = "Заметно сильнее меча и бьёт дальше." },
	bow   = { name = "Лук",          mult = 1.6, price = 90,  cooldown = 0.56, range = 40,  arc = 0,   unlock = 2, anim = "Slash", ranged = true, desc = "Стреляет стрелами. Откроется после второго стража." },
	axe   = { name = "Боевой топор", mult = 2.5, price = 130, cooldown = 0.62, range = 8.5, arc = 200, unlock = 3, anim = "Slash", desc = "Тяжёлый удар по большой площади. Откроется после третьего стража." },
}
Config.ARMOR_ORDER = { "none", "leather", "chain", "plate" }
Config.ARMORS = {
	none    = { name = "Без брони",     reduce = 0,    price = 0,   unlock = 0, desc = "Простая одежда путника." },
	leather = { name = "Кожаная броня", reduce = 0.20, price = 60,  unlock = 0, desc = "Лёгкая и недорогая.",                     color = Color3.fromRGB(150, 98, 52) },
	chain   = { name = "Кольчуга",      reduce = 0.35, price = 140, unlock = 1, desc = "Надёжная защита от волков и скелетов.",   color = Color3.fromRGB(176, 186, 198) },
	plate   = { name = "Стальные латы", reduce = 0.50, price = 240, unlock = 2, desc = "Лучшая броня в Эльдории.",                color = Color3.fromRGB(222, 202, 120) },
}
Config.BOSS_NAMES = { "Мортракс", "Шелиба", "Ноктурн", "Игнаррок" }

-- Эликсиры лечат, зелья дают силу. Клавиши 1–5 по порядку
Config.ELIX_ORDER = { "small", "big", "speed", "might", "guard" }
Config.ELIX = {
	small = { name = "Эликсир здоровья",         short = "Эликсир",   price = 20, sell = 8,  heal = 40, color = Color3.fromRGB(214, 58, 72),   desc = "Лечит 40 HP." },
	big   = { name = "Большой эликсир здоровья", short = "Б. эликсир", price = 55, sell = 22, heal = 80, color = Color3.fromRGB(224, 80, 138),  desc = "Лечит 80 HP и снимает яд." },
	speed = { name = "Зелье скорости",           short = "Скорость",  price = 45, sell = 18, dur = 20, color = Color3.fromRGB(52, 200, 240),  desc = "+40% к скорости на 20 с." },
	might = { name = "Зелье силы",               short = "Сила",      price = 50, sell = 20, dur = 25, color = Color3.fromRGB(255, 154, 42),  desc = "+50% к урону на 25 с." },
	guard = { name = "Зелье стойкости",          short = "Стойкость", price = 50, sell = 20, dur = 25, color = Color3.fromRGB(138, 122, 255), desc = "Получаемый урон вдвое меньше на 25 с." },
}
Config.ELIX_MAX = 8

-- Задания торговца
Config.QUEST_ORDER = { "wolves", "boars", "bandits", "rams", "king" }
Config.QUESTS = {
	wolves  = { name = "Волчья угроза",       desc = "Волки в округе пугают путников. Убейте 5 волков.",            target = "wolf",   count = 5, gold = 60,  elix = 1 },
	boars   = { name = "Кабанья напасть",     desc = "Кабаны разоряют огороды у тракта. Убейте 4 кабанов.",        target = "boar",   count = 4, gold = 70,  elix = 1 },
	bandits = { name = "Разбойники на тракте", desc = "Разбойники грабят караваны. Убейте 4 разбойников.",          target = "bandit", count = 4, gold = 90,  elix = 1 },
	rams    = { name = "Бодливое стадо",      desc = "Бодуны сбивают путников с ног. Убейте 3 бодунов.",           target = "ram",    count = 3, gold = 60,  elix = 1 },
	king    = { name = "Конец тирана",        desc = "Победите Мортракса в его логове.",                            target = "boss",   count = 1, gold = 220, elix = 2 },
}

Config.STORY_INTRO = {
	"Эльдория погружается во тьму. Эфирий — когда-то страж Обители — похитил Сердце Эльдории, древний камень, хранивший свет королевства, и заперся в Обители Пустых Зеркал на краю мира.",
	"Десять его слуг-стражей запечатали путь: у каждого своё логово, и пока страж жив, врата вглубь закрыты. Первый из них — Мортракс — засел в пещере на поверхности.",
	"Вы — последний, кто решился идти за светом. Закупитесь у торговца, наберитесь сил в бою и найдите логово Мортракса.",
}
Config.STORY_TIPS = {
	[0] = "Путь начинается в пещере на поверхности. Мортракс силён — сперва наберись опыта и купи броню.",
	[1] = "Мортракс пал — отлично! В глубине его логова открылся проход в Грот Шорохов. Копьё и кольчуга теперь продаются у меня.",
}
Config.BOSS_TAUNT = "Мортракс: «Ещё один глупец пришёл умереть…»"
Config.BOSS_LORE = "Мортракс продал душу Эфирию ради вечной жизни. Не стойте на месте — он бьёт по площади, а раненый зовёт скелетов."

return Config
