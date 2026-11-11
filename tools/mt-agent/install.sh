#!/usr/bin/env bash
# =====================================================================
# ติดตั้ง/อัปเดต mt-agent (เฟส 2 — ตัวเฝ้าไซต์ MikroTik) บน VPS เซิร์ฟเวอร์ WireGuard · docs/mikrotik.md
# ต้องรัน tools/mt-server/setup.sh มาก่อน · Ubuntu 24.04 · รันซ้ำได้ (อัปเดตโค้ด ไม่เปลี่ยนกุญแจ)
#
#   curl -fsSL https://raw.githubusercontent.com/nattawatchaising-coder/phithan-green-dashboard/master/tools/mt-agent/install.sh | sudo bash
#
# ทำอะไร
#   1) ติดตั้ง nodejs (ต้อง 18+)
#   2) ดาวน์โหลด agent.mjs → /opt/mt-agent/
#   3) สร้าง /etc/mt-agent.env ครั้งแรก: สุ่ม MT_AGENT_KEY + MT_CMD_SECRET (สองค่านี้ต้องไปใส่ Vercel ด้วย)
#   4) service systemd "mt-agent" (ผู้ใช้ชั่วคราวไม่ใช่ root · มีสิทธิ์แค่อ่าน wg + ping) แล้วเปิดเลย
# =====================================================================
set -euo pipefail

REPO_RAW=${MT_REPO_RAW:-https://raw.githubusercontent.com/nattawatchaising-coder/phithan-green-dashboard/master}
API_URL=${MT_API_URL:-https://flashsolar.vercel.app/api/mikrotik/site?agent=1}
ENV_FILE=/etc/mt-agent.env

[ "$(id -u)" = 0 ] || { echo "ต้องรันด้วย root (sudo)"; exit 1; }
command -v wg >/dev/null || { echo "ยังไม่มี WireGuard — รัน tools/mt-server/setup.sh ก่อน"; exit 1; }

echo "== 1) nodejs"
need_node=1
if command -v node >/dev/null; then
  major=$(node -p 'process.versions.node.split(".")[0]')
  [ "$major" -ge 18 ] && need_node=0
fi
if [ $need_node = 1 ]; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq nodejs >/dev/null
  major=$(node -p 'process.versions.node.split(".")[0]')
  [ "$major" -ge 18 ] || { echo "node ที่ติดตั้งได้เป็นรุ่น $major (ต้อง 18+) — ใช้ Ubuntu 24.04"; exit 1; }
fi
echo "   node $(node -v)"

echo "== 2) โค้ด agent"
install -d -m 755 /opt/mt-agent
curl -fsSL "$REPO_RAW/tools/mt-agent/agent.mjs" -o /opt/mt-agent/agent.mjs.new
node --check /opt/mt-agent/agent.mjs.new
mv /opt/mt-agent/agent.mjs.new /opt/mt-agent/agent.mjs
chmod 644 /opt/mt-agent/agent.mjs

echo "== 3) กุญแจ ($ENV_FILE)"
rnd() { head -c 32 /dev/urandom | base64 | tr '+/' '-_' | tr -d '=\n'; }
if [ ! -s "$ENV_FILE" ]; then
  umask 077
  cat > "$ENV_FILE" <<EOF
# สร้างโดย tools/mt-agent/install.sh — สองค่าแรกต้องตรงกับ env ใน Vercel
MT_AGENT_KEY=$(rnd)
MT_CMD_SECRET=$(rnd)
MT_API_URL=$API_URL
MT_WG_IF=wg0
EOF
  echo "   สร้างกุญแจใหม่แล้ว"
else
  echo "   มีอยู่แล้ว — ใช้ของเดิม"
fi
chmod 600 "$ENV_FILE"

echo "== 4) service mt-agent"
cat > /etc/systemd/system/mt-agent.service <<'EOF'
[Unit]
Description=mt-agent - site status for MikroTik sites (flash+solar)
After=network-online.target wg-quick@wg0.service
Wants=network-online.target

[Service]
EnvironmentFile=/etc/mt-agent.env
ExecStart=/usr/bin/env node /opt/mt-agent/agent.mjs
Restart=always
RestartSec=15
DynamicUser=yes
StateDirectory=mt-agent
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_RAW
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_RAW
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
EOF
cat > /usr/local/sbin/mt-agent-once <<'EOF'
#!/usr/bin/env bash
# ทดสอบรอบเดียว: เช็กทุกไซต์แล้วพิมพ์ผล (ไม่บันทึกลงเว็บ ไม่ทำคำสั่ง)
set -a; . /etc/mt-agent.env; set +a
exec node /opt/mt-agent/agent.mjs --once
EOF
chmod 755 /usr/local/sbin/mt-agent-once
systemctl daemon-reload
systemctl enable mt-agent >/dev/null 2>&1
systemctl restart mt-agent

echo
echo "================ เสร็จแล้ว ================"
echo "เอาสองบรรทัดนี้ไปใส่ Vercel → Settings → Environment Variables (Production) แล้ว Redeploy:"
grep -E '^MT_(AGENT_KEY|CMD_SECRET)=' "$ENV_FILE" | sed 's/=/  =  /'
echo
echo "ดูการทำงาน:  journalctl -u mt-agent -f      ทดสอบรอบเดียว:  sudo mt-agent-once"
