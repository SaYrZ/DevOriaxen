
Simple Lua static server

Quick steps to run (Linux / macOS):

1. Install Lua and LuaRocks if you do not have them:

```bash
sudo apt update
sudo apt install lua5.3 luarocks -y
```

2. Install luasocket:

```bash
sudo luarocks install luasocket
```

3. Make sure the `www` folder exists (it is included).

4. Start server:

```bash
lua server.lua
```

5. Open your browser at http://localhost:8080

Windows (PowerShell / CMD) quick steps:

Option A - using Chocolatey (if you have it):

```powershell
choco install lua luarocks -y
luarocks install luasocket
lua server.lua
```

Option B - manual installer:
- Install Lua for Windows (or Lua binaries) and LuaRocks using their installers.
- Then open CMD or PowerShell and run:

```powershell
luarocks install luasocket
lua server.lua
```

You can also use the provided Windows runner `run_server.bat` by double-clicking it or running it from CMD.

What it does:
- Serves files from the `www` folder.
- Prints console logs like `[200] GET / - 127.0.0.1 512B` or `[404] ...`.

Notes:
- Simple single-threaded server for development and testing.
- Change the `PORT` value in `server.lua` to use a different port.
- If you get "module not found" for `socket`, install `luasocket` with `luarocks`.
