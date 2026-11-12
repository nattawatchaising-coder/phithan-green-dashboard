#!/usr/bin/env bash
# =====================================================================
# ให้คอมแอดมินต่อ VPN (แอป WireGuard บน Windows) แล้วเปิดหน้าเว็บมิเตอร์ / SmartLogger ของทุกไซต์ได้ตรง ๆ
# (ผู้ใช้ขอ 2026-11-12 "ที่ไม่ต้องเข้า PowerShell" · docs/mikrotik.md หัวข้อ "คอมแอดมินต่อ VPN")
# รันบน VPS ที่ติดตั้ง tools/mt-server/setup.sh แล้ว · รันด้วย root · รันซ้ำได้
#
#   curl -fsSL https://raw.githubusercontent.com/nattawatchaising-coder/phithan-green-dashboard/master/tools/mt-server/admin.sh | sudo bash
#
# ทำอะไร
#   1) เปิด ip_forward + กฎ firewall: คอมแอดมิน (10.99.0.2–10.99.0.9) ไปได้แค่ 10.10.N.10 และ 10.10.N.20 พอร์ต 80/443 + ping
#      (ไม่เปิด Modbus 502 · ไม่เปิดเข้าเราเตอร์ · ไซต์คุยกันเองไม่ได้เหมือนเดิม)
#      ออกจาก VPS ด้วย IP 10.99.0.1 (SNAT) → ไม่ต้องแก้อะไรที่ hEX ทุกไซต์
#   2) ติดตั้งคำสั่ง mt-admin (เพิ่ม/ลบ/ดูคอมแอดมิน)
# ไม่แตะคีย์เซิร์ฟเวอร์ · ไม่รีสตาร์ต wg0 (ไซต์ที่ต่ออยู่ไม่หลุด)
# =====================================================================
set -euo pipefail

[ "$(id -u)" = 0 ] || { echo "ต้องรันด้วย root (sudo)"; exit 1; }
[ -s /etc/wireguard/wg0.head ] || { echo "ยังไม่ได้ติดตั้งเซิร์ฟเวอร์ WireGuard (tools/mt-server/setup.sh)"; exit 1; }

echo "== 1) กฎ firewall สำหรับคอมแอดมิน"
cat > /usr/local/sbin/mt-admin-fw <<'FW'
#!/usr/bin/env bash
# กฎส่งต่อของคอมแอดมิน — รันตอนบูต (mt-admin-fw.service) และตอนติดตั้ง · รันซ้ำได้
set -euo pipefail
SRC="10.99.0.2-10.99.0.9"
sysctl -q -w net.ipv4.ip_forward=1
iptables -N MT-ADMIN 2>/dev/null || iptables -F MT-ADMIN
iptables -A MT-ADMIN -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
for last in 10 20; do
  # 10.10.<ไซต์ไหนก็ได้>.<last> — mask 255.255.0.255 = ไม่สนเลขไซต์
  iptables -A MT-ADMIN -m iprange --src-range "$SRC" -d "10.10.0.$last/255.255.0.255" -p tcp -m multiport --dports 80,443 -j ACCEPT
  iptables -A MT-ADMIN -m iprange --src-range "$SRC" -d "10.10.0.$last/255.255.0.255" -p icmp --icmp-type echo-request -j ACCEPT
done
iptables -A MT-ADMIN -j DROP
iptables -C FORWARD -i wg0 -o wg0 -j MT-ADMIN 2>/dev/null || iptables -I FORWARD 1 -i wg0 -o wg0 -j MT-ADMIN
iptables -t nat -C POSTROUTING -o wg0 -m iprange --src-range "$SRC" -d 10.10.0.0/16 -j SNAT --to-source 10.99.0.1 2>/dev/null \
  || iptables -t nat -A POSTROUTING -o wg0 -m iprange --src-range "$SRC" -d 10.10.0.0/16 -j SNAT --to-source 10.99.0.1
FW
chmod 755 /usr/local/sbin/mt-admin-fw
echo "net.ipv4.ip_forward = 1" > /etc/sysctl.d/99-mt-admin.conf
cat > /etc/systemd/system/mt-admin-fw.service <<'UNIT'
[Unit]
Description=Forward rules for admin PCs on the site VPN (tools/mt-server/admin.sh)
After=network-online.target ufw.service wg-quick@wg0.service
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/sbin/mt-admin-fw

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable mt-admin-fw.service >/dev/null 2>&1
systemctl restart mt-admin-fw.service

echo "== 2) คำสั่ง mt-admin"
cat > /usr/local/sbin/mt-admin <<'ADM'
#!/usr/bin/env bash
# mt-admin add <ชื่อคอม>  ← เพิ่มคอมแอดมิน · พิมพ์คอนฟิกให้เอาไปวางในแอป WireGuard (แสดงครั้งเดียว)
# mt-admin del <เลข>      ← ลบคอม (เลข 2–9 จาก mt-admin list)
# mt-admin list           ← ดูคอมทั้งหมด + ต่อล่าสุดเมื่อไหร่
set -euo pipefail
WG_DIR=${MT_WG_DIR:-/etc/wireguard}
PORT=51820
[ "$(id -u)" = 0 ] || [ -n "${MT_WG_DIR:-}" ] || { echo "ต้องรันด้วย root (sudo)"; exit 1; }

# ไฟล์ชื่อ site-adm-N.conf → คำสั่ง mt-peer (glob site-*.conf) รวมให้เองเวลาเพิ่ม/ลบไซต์ ไม่ทำ peer คอมแอดมินหาย
build() {
  umask 077
  { cat "$WG_DIR/wg0.head"; for f in "$WG_DIR"/peers/site-*.conf; do [ -e "$f" ] && { echo; cat "$f"; }; done; } > "$WG_DIR/wg0.conf.new"
  mv "$WG_DIR/wg0.conf.new" "$WG_DIR/wg0.conf"
  [ -n "${MT_WG_DIR:-}" ] && return 0   # โหมดทดสอบ: ไม่แตะ interface จริง
  wg syncconf wg0 <(wg-quick strip wg0)
}

case "${1:-}" in
  add)
    name="$(printf '%s' "${2:-}" | tr -cd 'A-Za-z0-9_-' | cut -c1-30)"
    [ -n "$name" ] || { echo "ใช้: mt-admin add <ชื่อคอม>  (อังกฤษ/ตัวเลข/ขีด เช่น office-pc)"; exit 1; }
    ip=""
    for i in 2 3 4 5 6 7 8 9; do [ -e "$WG_DIR/peers/site-adm-$i.conf" ] || { ip=$i; break; }; done
    [ -n "$ip" ] || { echo "เต็มแล้ว (8 เครื่อง) — ลบเครื่องที่ไม่ใช้ด้วย mt-admin del <เลข>"; exit 1; }
    umask 077
    key="$(wg genkey)"; pub="$(printf '%s' "$key" | wg pubkey)"
    printf '# คอมแอดมิน %s (10.99.0.%s) เพิ่ม %s\n[Peer]\nPublicKey = %s\nAllowedIPs = 10.99.0.%s/32\n' "$name" "$ip" "$(date +%F)" "$pub" "$ip" > "$WG_DIR/peers/site-adm-$ip.conf"
    build
    host="${MT_PUBLIC_IP:-$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')}"
    cat <<EOF

เพิ่มคอม "$name" แล้ว (เลข $ip) — คัดลอกตั้งแต่ [Interface] ถึงบรรทัดสุดท้าย ไปวางในแอป WireGuard
(Add Tunnel ▾ → Add empty tunnel… → ลบของเดิมในกล่องทิ้ง → วาง → ตั้งชื่อ flashsolar → Save → Activate)
⚠ คอนฟิกนี้มีกุญแจลับของคอมเครื่องนี้ แสดงครั้งเดียว ห้ามส่งในแชต · ทำหาย = mt-admin del $ip แล้ว add ใหม่

[Interface]
PrivateKey = $key
Address = 10.99.0.$ip/32

[Peer]
PublicKey = $(cat "$WG_DIR/server.pub")
Endpoint = $host:$PORT
AllowedIPs = 10.10.0.0/16
PersistentKeepalive = 25

EOF
    ;;
  del)
    ip="${2:-}"
    [[ "$ip" =~ ^[2-9]$ ]] || { echo "ใช้: mt-admin del <เลข 2–9>  (ดูเลขจาก mt-admin list)"; exit 1; }
    f="$WG_DIR/peers/site-adm-$ip.conf"
    [ -e "$f" ] || { echo "ไม่มีคอมเลข $ip"; exit 1; }
    rm -f "$f"
    build
    echo "ลบคอมเลข $ip แล้ว — คอมเครื่องนั้นต่อ VPN ไม่ได้อีก"
    ;;
  list)
    now="$(date +%s)"; any=""
    for f in "$WG_DIR"/peers/site-adm-*.conf; do
      [ -e "$f" ] || continue
      any=1
      k="$(sed -n 's/^PublicKey *= *//p' "$f")"
      t="$(wg show wg0 latest-handshakes 2>/dev/null | awk -v k="$k" '$1 == k {print $2}' || true)"
      if [ -z "$t" ] || [ "$t" = 0 ]; then w="ยังไม่เคยต่อ"; else w="ต่อล่าสุด $(( now - t )) วินาทีที่แล้ว"; fi
      echo "$(head -1 "$f") : $w"
    done
    [ -n "$any" ] || echo "ยังไม่มีคอมแอดมิน — เพิ่มด้วย mt-admin add <ชื่อคอม>"
    ;;
  *) echo "ใช้: mt-admin add <ชื่อคอม> | mt-admin del <เลข> | mt-admin list"; exit 1 ;;
esac
ADM
chmod 755 /usr/local/sbin/mt-admin

cat <<'EOF'

=====================================================================
 เสร็จแล้ว — เพิ่มคอมเครื่องแรก:   sudo mt-admin add office-pc
 ดูคอมทั้งหมด:  sudo mt-admin list      ลบ:  sudo mt-admin del <เลข>
 คอมที่เพิ่มแล้วเข้าได้: http(s)://10.10.N.10 (SmartLogger) · http(s)://10.10.N.20 (มิเตอร์) ของทุกไซต์
=====================================================================
EOF
