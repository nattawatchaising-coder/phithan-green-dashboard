#!/usr/bin/env bash
# =====================================================================
# ติดตั้งเซิร์ฟเวอร์ WireGuard สำหรับไซต์ MikroTik (docs/mikrotik.md)
# ใช้กับ VPS Ubuntu 22.04/24.04 ที่ว่างเปล่า · รันด้วย root · รันซ้ำได้ (ไม่สร้างคีย์ใหม่ ไม่ลบ peer เดิม)
#
#   curl -fsSL https://raw.githubusercontent.com/nattawatchaising-coder/phithan-green-dashboard/master/tools/mt-server/setup.sh | sudo bash
#
# ทำอะไร
#   1) ติดตั้ง wireguard-tools + ufw
#   2) สร้างคีย์เซิร์ฟเวอร์ /etc/wireguard/server.key (ครั้งแรกครั้งเดียว — private key ไม่ออกจากเครื่องนี้)
#   3) wg0 = 10.99.0.1/24 พอร์ต UDP 51820 · peer ของแต่ละไซต์แยกไฟล์ /etc/wireguard/peers/site-NNN.conf
#   4) firewall: เปิดแค่ SSH + UDP 51820
#   5) ติดตั้งคำสั่ง mt-peer (เพิ่ม/ลบ/ดู peer) แล้วพิมพ์ค่าที่ต้องเอาไปใส่ env ใน Vercel
# =====================================================================
set -euo pipefail

WG_DIR=/etc/wireguard
PORT=51820
ADDR=10.99.0.1/24

[ "$(id -u)" = 0 ] || { echo "ต้องรันด้วย root (sudo)"; exit 1; }
command -v apt-get >/dev/null || { echo "สคริปต์นี้รองรับ Ubuntu/Debian เท่านั้น"; exit 1; }

echo "== 1) ติดตั้งโปรแกรม"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq wireguard-tools ufw curl >/dev/null

echo "== 2) คีย์เซิร์ฟเวอร์"
install -d -m 700 "$WG_DIR" "$WG_DIR/peers"
umask 077
if [ ! -s "$WG_DIR/server.key" ]; then
  wg genkey > "$WG_DIR/server.key"
  echo "   สร้างคีย์ใหม่แล้ว"
else
  echo "   มีคีย์อยู่แล้ว — ใช้ตัวเดิม"
fi
chmod 600 "$WG_DIR/server.key"
wg pubkey < "$WG_DIR/server.key" > "$WG_DIR/server.pub"

echo "== 3) คอนฟิก wg0 (ส่วนหัว + peer ทุกไฟล์ใน peers/)"
cat > "$WG_DIR/wg0.head" <<EOF
# สร้างโดย tools/mt-server/setup.sh — อย่าแก้ wg0.conf ตรง ๆ ให้ใช้คำสั่ง mt-peer
[Interface]
Address = $ADDR
ListenPort = $PORT
PrivateKey = $(cat "$WG_DIR/server.key")
EOF
chmod 600 "$WG_DIR/wg0.head"

# ---------- คำสั่ง mt-peer ----------
cat > /usr/local/sbin/mt-peer <<'PEER'
#!/usr/bin/env bash
# mt-peer add   ← วาง peer ที่ได้จากหน้าเว็บ (ไซต์ MikroTik → สร้างสคริปต์) แล้วกด Ctrl+D
# mt-peer del N ← ลบ peer ของไซต์ N
# mt-peer list  ← ดูไซต์ทั้งหมด + handshake ล่าสุด
set -euo pipefail
WG_DIR=${MT_WG_DIR:-/etc/wireguard}
[ "$(id -u)" = 0 ] || [ -n "${MT_WG_DIR:-}" ] || { echo "ต้องรันด้วย root (sudo)"; exit 1; }

build() {
  umask 077
  { cat "$WG_DIR/wg0.head"; for f in "$WG_DIR"/peers/site-*.conf; do [ -e "$f" ] && { echo; cat "$f"; }; done; } > "$WG_DIR/wg0.conf.new"
  mv "$WG_DIR/wg0.conf.new" "$WG_DIR/wg0.conf"
  [ -n "${MT_WG_DIR:-}" ] && return 0   # โหมดทดสอบ: ไม่แตะ interface จริง
  if systemctl is-active --quiet wg-quick@wg0; then
    # syncconf ไม่ตัดไซต์อื่นที่ต่ออยู่ · route ของ LAN ไซต์ใหม่ต้องเพิ่มเอง (wg-quick เพิ่มให้แค่ตอน start)
    wg syncconf wg0 <(wg-quick strip wg0)
    for net in $(wg show wg0 allowed-ips | tr '\t ' '\n\n' | grep -E '^[0-9.]+/[0-9]+$'); do
      ip route replace "$net" dev wg0
    done
  else
    systemctl enable --now wg-quick@wg0
  fi
}

case "${1:-}" in
  add)
    [ -t 0 ] && echo "วาง peer จากหน้าเว็บ แล้วกด Ctrl+D:"
    txt="$(cat | tr -d '\r')"
    pub="$(printf '%s\n' "$txt" | sed -n 's/^PublicKey *= *\([A-Za-z0-9+/]\{43\}=\) *$/\1/p' | head -1)"
    allowed="$(printf '%s\n' "$txt" | sed -n 's/^AllowedIPs *= *//p' | head -1)"
    tun="$(printf '%s\n' "$allowed" | grep -o '10\.99\.0\.[0-9]\{1,3\}/32' | head -1 || true)"
    if [ -z "$pub" ] || [ -z "$tun" ]; then echo "ไม่ใช่ peer จากหน้าเว็บ (ต้องมี PublicKey และ AllowedIPs 10.99.0.x/32)"; exit 1; fi
    host="${tun#10.99.0.}"; host="${host%/32}"; n=$((host - 10))
    if [ "$n" -lt 1 ] || [ "$n" -gt 244 ]; then echo "เลขไซต์ผิด ($tun)"; exit 1; fi
    if ! printf '%s\n' "$allowed" | grep -Eq "^10\.99\.0\.$host/32, 10\.10\.$n\.0/24 *$"; then echo "AllowedIPs ไม่ตรงแผน IP: $allowed"; exit 1; fi
    f="$WG_DIR/peers/site-$(printf '%03d' "$n").conf"
    [ -e "$f" ] && echo "ไซต์ $n มี peer อยู่แล้ว — แทนที่ด้วยคีย์ใหม่"
    umask 077
    printf '%s\n' "$txt" | grep -E '^(#|\[Peer\]|PublicKey|AllowedIPs)' > "$f"
    build
    echo "เพิ่มไซต์ $n แล้ว ($tun · 10.10.$n.0/24)"
    ;;
  del)
    n="${2:-}"
    if ! [[ "$n" =~ ^[0-9]+$ ]]; then echo "ใช้: mt-peer del <เลขไซต์>"; exit 1; fi
    f="$WG_DIR/peers/site-$(printf '%03d' "$n").conf"
    [ -e "$f" ] || { echo "ไม่มีไซต์ $n"; exit 1; }
    rm -f "$f"
    [ -n "${MT_WG_DIR:-}" ] || ip route del "10.10.$n.0/24" dev wg0 2>/dev/null || true
    build
    echo "ลบไซต์ $n แล้ว"
    ;;
  list)
    now="$(date +%s)"
    for f in "$WG_DIR"/peers/site-*.conf; do
      [ -e "$f" ] || continue
      k="$(sed -n 's/^PublicKey *= *//p' "$f")"
      t="$(wg show wg0 latest-handshakes 2>/dev/null | awk -v k="$k" '$1 == k {print $2}' || true)"
      if [ -z "$t" ] || [ "$t" = 0 ]; then w="ยังไม่เคยต่อ"; else w="ต่อล่าสุด $(( now - t )) วินาทีที่แล้ว"; fi
      echo "$(head -1 "$f") : $w"
    done
    ;;
  *) echo "ใช้: mt-peer add | mt-peer del <เลขไซต์> | mt-peer list"; exit 1 ;;
esac
PEER
chmod 755 /usr/local/sbin/mt-peer

echo "== 4) firewall (ufw): SSH + UDP $PORT"
SSH_PORT="$(echo "${SSH_CONNECTION:-}" | awk '{print $4}')"
ufw allow OpenSSH >/dev/null
if [ -n "$SSH_PORT" ] && [ "$SSH_PORT" != 22 ]; then ufw allow "$SSH_PORT/tcp" >/dev/null; fi
ufw allow "$PORT/udp" >/dev/null
ufw --force enable >/dev/null

echo "== 5) เปิด wg0"
{ cat "$WG_DIR/wg0.head"; for f in "$WG_DIR"/peers/site-*.conf; do [ -e "$f" ] && { echo; cat "$f"; }; done; } > "$WG_DIR/wg0.conf"
chmod 600 "$WG_DIR/wg0.conf"
systemctl enable wg-quick@wg0 >/dev/null 2>&1
systemctl restart wg-quick@wg0

IP="$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')"
cat <<EOF

=====================================================================
 เสร็จแล้ว — เอาค่าข้างล่างไปใส่ Vercel → Settings → Environment Variables
=====================================================================
 MT_WG_ENDPOINT      = $IP:$PORT
 MT_WG_SERVER_PUBKEY = $(cat "$WG_DIR/server.pub")
 MT_ENC_KEY          = (สร้างเองครั้งเดียว ดู docs/mikrotik.md — ไม่ใช่ค่าจากเครื่องนี้)

 ⚠ เปิด UDP $PORT ใน firewall ของผู้ให้บริการด้วย (Hostinger: hPanel → VPS → Firewall)
 ⚠ สำรองไฟล์ $WG_DIR/server.key ไว้ที่ปลอดภัย — หายแล้วต้องรันสคริปต์ใหม่ทุกไซต์

 เพิ่มไซต์:  sudo mt-peer add   (วาง peer จากหน้าเว็บ แล้ว Ctrl+D)
 ดูสถานะ:   sudo mt-peer list
=====================================================================
EOF
