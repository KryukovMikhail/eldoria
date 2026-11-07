"""Проверка синтаксиса Luau-скриптов через liblua5.4 (код пишется в общем подмножестве Lua/Luau)."""
import ctypes, sys, pathlib, re

lib = ctypes.CDLL("liblua5.4.so.0")
lib.luaL_newstate.restype = ctypes.c_void_p
lib.luaL_loadbufferx.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_size_t, ctypes.c_char_p, ctypes.c_char_p]
lib.lua_tolstring.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_void_p]
lib.lua_tolstring.restype = ctypes.c_char_p
lib.lua_settop.argtypes = [ctypes.c_void_p, ctypes.c_int]

# Конструкции, которых нет в Luau (или есть только в Luau) — запрещаем, чтобы проверка была честной
BAD = [(r"\+=|-=|\*=|/=|\.\.=", "составное присваивание (только Luau)"),
       (r"\bcontinue\b", "continue (только Luau)"),
       (r"\bgoto\b", "goto (нет в Luau)"),
       (r"//", "целочисленное деление (нет в Luau 5.1-синтаксисе)"),
       (r"`", "строковая интерполяция"),
       (r"<const>|<close>", "атрибуты Lua 5.4")]

def check(path):
    src = pathlib.Path(path).read_bytes()
    L = lib.luaL_newstate()
    ok = True
    if lib.luaL_loadbufferx(L, src, len(src), ("@" + str(path)).encode(), b"t") != 0:
        print("SYNTAX", lib.lua_tolstring(L, -1, None).decode())
        ok = False
    text = src.decode("utf-8")
    for i, line in enumerate(text.splitlines(), 1):
        code = re.sub(r'"(\\.|[^"\\])*"', '""', line)
        code = re.sub(r"'(\\.|[^'\\])*'", "''", code)
        code = code.split("--")[0]
        for pat, why in BAD:
            if re.search(pat, code):
                print(f"{path}:{i}: {why}: {line.strip()}")
                ok = False
    return ok

if __name__ == "__main__":
    files = [p for a in sys.argv[1:] for p in (pathlib.Path(a).rglob("*.lua") if pathlib.Path(a).is_dir() else [pathlib.Path(a)])]
    bad = [f for f in files if not check(f)]
    print(f"проверено {len(files)} файлов, ошибок: {len(bad)}")
    sys.exit(1 if bad else 0)
