"""Ищет обращения к неизвестным глобальным именам и к локальным до их объявления (грубый анализ областей видимости)."""
import re, sys, pathlib

KW = set("and break do else elseif end false for function if in local nil not or repeat return then true until while".split())
ALLOW = set("""game workspace script Instance Vector3 Vector2 CFrame Color3 UDim UDim2 Enum Random task math string table os
pairs ipairs print warn type typeof tostring tonumber pcall xpcall require setmetatable getmetatable select error next unpack
NumberRange NumberSequence NumberSequenceKeypoint ColorSequence ColorSequenceKeypoint TweenInfo RaycastParams rawget rawset
OverlapParams Rect PhysicalProperties Region3 utf8 bit32 tick time delay spawn wait self""".split())

TOK = re.compile(r"""
 (?P<ws>\s+)
|(?P<lcomment>--\[(?P<eq1>=*)\[.*?\](?P=eq1)\])
|(?P<comment>--[^\n]*)
|(?P<lstr>\[(?P<eq2>=*)\[.*?\](?P=eq2)\])
|(?P<str>"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')
|(?P<num>0[xX][0-9a-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+)
|(?P<name>[A-Za-z_][A-Za-z0-9_]*)
|(?P<op>\.\.\.|\.\.|==|~=|<=|>=|::|[-+*/%^#<>=(){}\[\];:,.])
""", re.S | re.X)

def tokens(src):
    pos, line = 0, 1
    out = []
    while pos < len(src):
        m = TOK.match(src, pos)
        if not m:
            raise SyntaxError(f"bad char at line {line}: {src[pos:pos+20]!r}")
        kind = m.lastgroup
        text = m.group(0)
        if kind in ("name", "op", "num", "str", "lstr"):
            out.append((("str" if kind == "lstr" else kind), text, line))
        line += text.count("\n")
        pos = m.end()
    return out

def check(path):
    toks = tokens(pathlib.Path(path).read_text(encoding="utf-8"))
    declared = set()
    problems = []
    stack = []
    i = 0
    n = len(toks)
    def declare_list(j):
        while j < n and toks[j][0] == "name":
            declared.add(toks[j][1])
            if j + 1 < n and toks[j + 1][1] == ",":
                j += 2
            else:
                return j + 1
        return j
    while i < n:
        kind, text, line = toks[i]
        prev = toks[i - 1][1] if i > 0 else ""
        nxt = toks[i + 1][1] if i + 1 < n else ""
        if kind == "op" and text in "({[":
            stack.append(text)
        elif kind == "op" and text in ")}]":
            if stack: stack.pop()
        if kind == "name":
            if text == "local":
                if nxt == "function":
                    declared.add(toks[i + 2][1])
                    i += 1          # дальше разберём как обычную функцию с параметрами
                    continue
                i = declare_list(i + 1)
                continue
            if text == "function":
                # параметры
                j = i + 1
                while j < n and toks[j][1] != "(":
                    j += 1
                if i + 1 < n and toks[i + 1][0] == "name" and toks[i + 2][1] not in (".", ":"):
                    declared.add(toks[i + 1][1])  # глобальная функция (не используем, но не ругаемся)
                k = j + 1
                while k < n and toks[k][1] != ")":
                    if toks[k][0] == "name":
                        declared.add(toks[k][1])
                    k += 1
                if i + 1 < n and toks[i + 1][0] == "name":
                    nm = toks[i + 1][1]
                    if nm not in declared and nm not in ALLOW:
                        problems.append((toks[i + 1][2], nm))
                i = j
                continue
            if text == "for":
                j = i + 1
                while j < n and toks[j][1] not in ("in", "="):
                    if toks[j][0] == "name":
                        declared.add(toks[j][1])
                    j += 1
                i = j
                continue
            if text in KW:
                i += 1
                continue
            if prev in (".", ":"):
                i += 1
                continue
            if nxt == "=" and stack and stack[-1] == "{" and prev in ("{", ",", ";"):
                i += 1
                continue
            if text not in declared and text not in ALLOW:
                problems.append((line, text))
        i += 1
    return problems

if __name__ == "__main__":
    bad = 0
    for a in sys.argv[1:]:
        p = pathlib.Path(a)
        files = list(p.rglob("*.lua")) if p.is_dir() else [p]
        for f in files:
            for line, name in check(f):
                print(f"{f}:{line}: неизвестное имя или использование до объявления: {name}")
                bad += 1
    print("проблем:", bad)
    sys.exit(1 if bad else 0)
