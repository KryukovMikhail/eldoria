"""Запускает tools/mock/run.lua во встроенном Lua 5.4 (через liblua5.4)."""
import ctypes, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
lib = ctypes.CDLL("liblua5.4.so.0")
lib.luaL_newstate.restype = ctypes.c_void_p
lib.luaL_openlibs.argtypes = [ctypes.c_void_p]
lib.luaL_loadstring.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
lib.lua_pcallk.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_void_p, ctypes.c_void_p]
lib.lua_tolstring.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_void_p]
lib.lua_tolstring.restype = ctypes.c_char_p

seed = sys.argv[1] if len(sys.argv) > 1 else "7"
L = lib.luaL_newstate()
lib.luaL_openlibs(L)
code = (f'arg_root = [[{ROOT}]]; arg_seed = "{seed}"; io.stdout:setvbuf("line"); '
        f'local ok, err = xpcall(dofile, debug.traceback, arg_root .. "/tools/mock/run.lua"); '
        f'if not ok then print("!! ПРОГОН ПРЕРВАН: " .. tostring(err)); error("fail") end')
if lib.luaL_loadstring(L, code.encode()) != 0 or lib.lua_pcallk(L, 0, 0, 0, None, None) != 0:
    sys.stdout.flush()
    sys.exit(1)
