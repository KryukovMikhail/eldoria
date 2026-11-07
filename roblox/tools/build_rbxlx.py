"""Собирает src/ в файл места Roblox (.rbxlx), который открывается в Roblox Studio."""
import pathlib, sys, itertools, xml.dom.minidom

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
_ref = itertools.count(1)

def ref():
    return f"RBX{next(_ref):08X}"

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def script_item(cls, name, source, children=""):
    assert "]]>" not in source, name
    return (f'<Item class="{cls}" referent="{ref()}"><Properties>'
            f'<string name="Name">{esc(name)}</string>'
            f'<bool name="Disabled">false</bool>'
            f'<ProtectedString name="Source"><![CDATA[{source}]]></ProtectedString>'
            f'</Properties>{children}</Item>')

def module(path):
    return script_item("ModuleScript", path.stem, path.read_text(encoding="utf-8"))

def item(cls, name, children="", props=""):
    return (f'<Item class="{cls}" referent="{ref()}"><Properties>'
            f'<string name="Name">{esc(name)}</string>{props}</Properties>{children}</Item>')

def read(p):
    return (SRC / p).read_text(encoding="utf-8")

def build(out):
    srv = SRC / "ServerScriptService" / "EldoriaServer"
    modules = "".join(module(p) for p in sorted(srv.glob("*.lua")) if p.name != "init.server.lua")
    parts = [
        item("Workspace", "Workspace"),
        item("Players", "Players", props='<bool name="CharacterAutoLoads">false</bool>'),
        item("Lighting", "Lighting", props='<token name="Technology">4</token><bool name="GlobalShadows">true</bool>'),
        item("ReplicatedStorage", "ReplicatedStorage",
             item("Folder", "Eldoria", module(SRC / "ReplicatedStorage" / "Eldoria" / "Config.lua"))),
        item("ServerScriptService", "ServerScriptService",
             script_item("Script", "EldoriaServer", read("ServerScriptService/EldoriaServer/init.server.lua"), modules)),
        item("StarterPlayer", "StarterPlayer",
             item("StarterPlayerScripts", "StarterPlayerScripts",
                  script_item("LocalScript", "EldoriaClient", read("StarterPlayer/StarterPlayerScripts/EldoriaClient.client.lua")))
             + item("StarterCharacterScripts", "StarterCharacterScripts",
                    script_item("Script", "Health", read("StarterPlayer/StarterCharacterScripts/Health.server.lua"))),
             props='<float name="CameraMaxZoomDistance">60</float>'),
    ]
    doc = ('<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" '
           'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
           'xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">'
           '<External>null</External><External>nil</External>'
           + "".join(parts) + '</roblox>')
    xml.dom.minidom.parseString(doc.encode("utf-8"))   # проверка, что XML корректен
    out.write_text(doc, encoding="utf-8")
    return out

if __name__ == "__main__":
    out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "Eldoria.rbxlx"
    print("собрано:", build(out), out.stat().st_size, "байт")
