local socket = require("socket")

-- simple static file server
local PORT = 8080
local WWW = "www"

local mime_types = {
  html = "text/html; charset=utf-8",
  htm = "text/html; charset=utf-8",
  css = "text/css; charset=utf-8",
  js = "application/javascript; charset=utf-8",
  png = "image/png",
  jpg = "image/jpeg",
  jpeg = "image/jpeg",
  gif = "image/gif",
  svg = "image/svg+xml",
  txt = "text/plain; charset=utf-8",
}

local function split_path(p)
  if p == "/" or p == "" then return "/index.html" end
  return p
end

local function sanitize(p)
  -- do not allow .. or absolute paths
  p = p:gsub("%../", "")
  p = p:gsub("^/", "")
  return p
end

local function content_type_for(path)
  local ext = path:match("%.([%w]+)$") or ""
  return mime_types[ext:lower()] or "application/octet-stream"
end

local function send_response(client, code, status_text, headers, body)
  headers = headers or {}
  local header_lines = {string.format("HTTP/1.1 %d %s", code, status_text)}
  headers["Content-Length"] = tostring(#(body or ""))
  headers["Connection"] = "close"
  for k,v in pairs(headers) do
    table.insert(header_lines, k .. ": " .. v)
  end
  table.insert(header_lines, "")
  table.insert(header_lines, "")
  client:send(table.concat(header_lines, "\r\n"))
  if body and #body > 0 then client:send(body) end
end

local function handle_client(client)
  client:settimeout(2)
  local line, err = client:receive()
  if not line then client:close(); return end

  -- parse request line
  local method, path = line:match("^(%u+)%s+(%S+)")
  if not method or not path then client:close(); return end

  -- read and discard headers
  while true do
    local h = client:receive()
    if not h or h == "" then break end
  end

  local remote = client:getpeername() or "-"
  local rpath = split_path(path)
  local fpath = sanitize(rpath)
  local full = WWW .. "/" .. fpath

  local f = io.open(full, "rb")
  if f then
    local body = f:read("*a")
    f:close()
    local ctype = content_type_for(full)
    send_response(client, 200, "OK", { ["Content-Type"] = ctype }, body)
    print(string.format("[%s] %s %s - %s %dB", "200", method, path, remote, #body))
  else
    local body = "<html><body><h1>404 Not Found</h1></body></html>"
    send_response(client, 404, "Not Found", { ["Content-Type"] = "text/html; charset=utf-8" }, body)
    print(string.format("[%s] %s %s - %s %dB", "404", method, path, remote, #body))
  end

  client:close()
end

local server = assert(socket.bind("0.0.0.0", PORT))
local ip, port = server:getsockname()
print(string.format("Serving %s on %s:%d", WWW, ip, port))

while true do
  local client = server:accept()
  if client then
    -- handle in simple, sequential way
    local ok, err = pcall(handle_client, client)
    if not ok then
      print("error handling client:", err)
    end
  end
end
