# -*- coding: utf-8 -*-
"""
สร้างไฟล์ภาพเมนูล่างของ LINE — สองหน้า  →  tools/richmenu-p1.png · tools/richmenu-p2.png
ทั้งสองไฟล์ขนาด 2500 x 1686 ตามที่ LINE กำหนดสำหรับเมนูทรงใหญ่

วิธีใช้:  python tools/richmenu-image.py

ทำไมเป็น Python ไม่ใช่ Node: ต้องวาดตัวหนังสือไทยลงบนภาพ ซึ่ง Node ไม่มีมาให้
สคริปต์นี้รันในเครื่องเท่านั้น ไม่ได้ขึ้นเซิร์ฟเวอร์ จึงใช้ Pillow ได้
(กฎ "ห้ามมี dependency" ใช้กับโค้ดใน /api อย่างเดียว)

⚠ Pillow ในเครื่องนี้ไม่มี raqm → วางสระบนกับวรรณยุกต์ "สองชั้น" ไม่เป็น
   คำอย่าง "ที่" "ชื่อ" "เรื่อง" "ทั้ง" "เพิ่ม" "นี้" จะออกมาซ้อนกันอ่านไม่ออก
   ข้อความในไฟล์นี้เลี่ยงคำสองชั้นไว้หมดแล้ว — ถ้าจะแก้คำ ให้เลี่ยงต่อไปด้วย
   (ชั้นเดียวอย่าง "เข้า" "ต้อง" "ใหม่" "ส่ง" "ค่า" ใช้ได้ปกติ)

── โครงหน้า ──
สี่ช่องบน 2x2 คือปุ่มงาน · แถบล่างเต็มความกว้างคือโลโก้ + ทางเข้าเว็บเต็มจอ
แถบล่างเป็นพื้นที่กดได้เหมือนกัน ไม่ใช่ของตกแต่ง — ต้องตรงกับ AREAS ใน richmenu.mjs

ไฟล์ผลลัพธ์ถูก commit ไว้ด้วย จะได้อัปเมนูขึ้น LINE ได้โดยไม่ต้องมี Pillow
ให้รันสคริปต์นี้ใหม่เฉพาะตอนแก้ดีไซน์
"""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 2500, 1686          # ขนาดเต็มของเมนูล่าง LINE ต้องเป๊ะตามนี้
BAR = 300                  # ความสูงของแถบโลโก้ด้านล่าง
COLS, ROWS = 2, 2
CW, CH = W // COLS, (H - BAR) // ROWS

BG     = (10, 45, 56)      # พื้นหลังเข้ม — ตัดกับหน้าจอแชทที่สว่าง
BAR_BG = (7, 33, 41)       # แถบล่างเข้มกว่าอีกนิด ให้อ่านออกว่าเป็นคนละส่วน
LINE_C = (255, 255, 255, 38)
TEXT   = (255, 255, 255)
SUB    = (168, 200, 205)

# หน้าแรก — เรื่องที่ช่างกดทุกวัน
PAGE1 = [
    {"th": "ลงเวลา",          "sub": "เข้า-ออกงาน",              "color": (27, 155, 117), "icon": "clock"},
    {"th": "งานของฉัน",       "sub": "ค้นหา · รายละเอียด",        "color": (20, 128, 128), "icon": "search"},
    {"th": "รายงานประจำวัน",  "sub": "ส่งใบรายงานหน้างาน",        "color": (34, 179, 106), "icon": "pen"},
    {"th": "หน้าถัดไป",       "sub": "ขอ OT · เบิกเงิน · เตือน",  "color": (20, 122, 140), "icon": "next"},
]

# หน้าสอง — เรื่องเอกสาร กดไม่บ่อยเท่า แต่ต้องหาเจอ
PAGE2 = [
    {"th": "ขอ OT",      "sub": "ทำงานล่วงเวลา",            "color": (34, 179, 106), "icon": "plus"},
    {"th": "เบิกเงิน",   "sub": "ค่าใช้จ่ายหน้างาน",         "color": (27, 155, 117), "icon": "wallet"},
    {"th": "แจ้งเตือน",  "sub": "งานใหม่ · เอกสารตีกลับ",    "color": (20, 128, 128), "icon": "bell"},
    {"th": "ย้อนกลับ",   "sub": "ลงเวลา · งาน · รายงาน",     "color": (20, 122, 140), "icon": "back"},
]

FONT_DIR = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, "..", "dashboard", "assets", "flash-mark.png")


def font(name, size):
    """ฟอนต์ไทย — Leelawadee UI มากับ Windows ทุกเครื่อง ถ้าไม่มีค่อยถอยไป Tahoma"""
    for f in (name, "tahomabd.ttf", "tahoma.ttf"):
        p = os.path.join(FONT_DIR, f)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def draw_icon(d, kind, cx, cy, r, color):
    """ไอคอนวาดมือด้วยรูปทรงพื้นฐาน — ไม่พึ่งฟอนต์ไอคอนหรือไฟล์ภาพจากที่อื่น"""
    w = max(6, r // 9)
    if kind == "clock":
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=w)
        d.line([cx, cy, cx, cy - int(r * 0.55)], fill=color, width=w)
        d.line([cx, cy, cx + int(r * 0.42), cy], fill=color, width=w)
    elif kind == "bell":
        d.arc([cx - r, cy - r, cx + r, cy + int(r * 0.5)], 180, 360, fill=color, width=w)
        d.line([cx - r, cy + int(r * 0.25), cx + r, cy + int(r * 0.25)], fill=color, width=w)
        d.line([cx - r, cy + int(r * 0.25), cx - r, cy - int(r * 0.1)], fill=color, width=w)
        d.line([cx + r, cy + int(r * 0.25), cx + r, cy - int(r * 0.1)], fill=color, width=w)
        d.arc([cx - int(r * 0.32), cy + int(r * 0.1), cx + int(r * 0.32), cy + int(r * 0.62)],
              0, 180, fill=color, width=w)
    elif kind == "plus":
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=w)
        d.line([cx - int(r * 0.5), cy, cx + int(r * 0.5), cy], fill=color, width=w)
        d.line([cx, cy - int(r * 0.5), cx, cy + int(r * 0.5)], fill=color, width=w)
    elif kind == "pen":
        # ปากกาเฉียง — ด้ามหนา + ปลายปากกาเป็นสามเหลี่ยมตัน แล้วขีดเส้นบรรทัดรองข้างใต้
        # (ลากเป็นเส้นบาง ๆ อย่างเดียวจะดูเป็นขีดเฉย ๆ ไม่ใช่ปากกา)
        d.line([cx - int(r * 0.34), cy + int(r * 0.34), cx + int(r * 0.62), cy - int(r * 0.62)],
               fill=color, width=int(w * 2.1))
        d.polygon([(cx - int(r * 0.78), cy + int(r * 0.78)),
                   (cx - int(r * 0.5), cy + int(r * 0.2)),
                   (cx - int(r * 0.2), cy + int(r * 0.5))], fill=color)
        d.line([cx - int(r * 0.85), cy + int(r * 0.98), cx + int(r * 0.85), cy + int(r * 0.98)],
               fill=color, width=w)
    elif kind == "wallet":
        d.rounded_rectangle([cx - r, cy - int(r * 0.66), cx + r, cy + int(r * 0.66)],
                            radius=int(r * 0.22), outline=color, width=w)
        d.line([cx - r, cy - int(r * 0.2), cx + r, cy - int(r * 0.2)], fill=color, width=w)
        d.ellipse([cx + int(r * 0.28), cy + int(r * 0.02), cx + int(r * 0.58), cy + int(r * 0.32)],
                  fill=color)
    elif kind in ("next", "back"):
        s = 1 if kind == "next" else -1
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=w)
        for dx in (-0.12, 0.3):
            d.line([cx + s * int(r * dx), cy - int(r * 0.34),
                    cx + s * int(r * (dx + 0.34)), cy], fill=color, width=w)
            d.line([cx + s * int(r * (dx + 0.34)), cy,
                    cx + s * int(r * dx), cy + int(r * 0.34)], fill=color, width=w)
    else:  # search — แว่นขยาย: วงแหวนเปิดมุมล่างขวา + ด้าม
        d.arc([cx - r, cy - r, cx + int(r * 0.1), cy + int(r * 0.1)], 120, 60, fill=color, width=w)
        d.line([cx - int(r * 0.28), cy - int(r * 0.28), cx + int(r * 0.72), cy + int(r * 0.72)],
               fill=color, width=w)


def centered(d, txt, fnt, cx, cy, fill):
    bb = d.textbbox((0, 0), txt, font=fnt)
    d.text((cx - (bb[2] - bb[0]) / 2, cy - (bb[3] - bb[1]) / 2 - bb[1]), txt, font=fnt, fill=fill)


def brand_bar(img, d, page):
    """แถบล่าง — โลโก้ + ทางเข้าเว็บเต็มจอ กดได้จริง ไม่ใช่ของตกแต่ง"""
    y0 = H - BAR
    d.rectangle([0, y0, W, H], fill=BAR_BG)
    d.line([0, y0, W, y0], fill=(34, 179, 106, 210), width=6)

    f_word = font("LeelawUI.ttf", 96)
    f_note = font("leelawad.ttf", 58)
    f_page = font("leelawad.ttf", 52)

    mark_h = 150
    word = "flash+solar"
    note = "เปิดเว็บเต็มจอ"
    bw = d.textbbox((0, 0), word, font=f_word)
    bn = d.textbbox((0, 0), note, font=f_note)
    gap = 44
    total = mark_h + gap + (bw[2] - bw[0]) + gap + (bn[2] - bn[0])
    x = (W - total) // 2
    cy = y0 + BAR // 2

    if os.path.exists(LOGO):
        mark = Image.open(LOGO).convert("RGBA").resize((mark_h, mark_h), Image.LANCZOS)
        img.paste(mark, (x, cy - mark_h // 2), mark)
    x += mark_h + gap
    d.text((x, cy - (bw[3] - bw[1]) / 2 - bw[1]), word, font=f_word, fill=TEXT)
    x += (bw[2] - bw[0]) + gap
    d.line([x - gap // 2, cy - 46, x - gap // 2, cy + 46], fill=(255, 255, 255, 60), width=4)
    d.text((x, cy - (bn[3] - bn[1]) / 2 - bn[1]), note, font=f_note, fill=SUB)

    # เลขหน้า มุมขวา — บอกว่ามีสองหน้าให้สลับ ไม่ใช่เมนูเดียวที่เปลี่ยนรูปเอง
    centered(d, "หน้า " + str(page) + "/2", f_page, W - 150, cy, (120, 150, 156))


def build(cells, page, out):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img, "RGBA")

    f_title = font("LeelawUI.ttf", 100)
    f_sub = font("leelawad.ttf", 56)

    for i, c in enumerate(cells):
        col, row = i % COLS, i // COLS
        x0, y0 = col * CW, row * CH
        cx = x0 + CW // 2

        # แถบสีบาง ๆ ด้านบนของช่อง — บอกว่าแต่ละช่องคนละเรื่องกัน โดยไม่ต้องตีกรอบให้รก
        d.rectangle([x0, y0, x0 + CW, y0 + 14], fill=c["color"])

        draw_icon(d, c["icon"], cx, y0 + int(CH * 0.36), 112, c["color"])
        centered(d, c["th"], f_title, cx, y0 + int(CH * 0.66), TEXT)
        centered(d, c["sub"], f_sub, cx, y0 + int(CH * 0.83), SUB)

    # เส้นแบ่งช่อง วาดทีหลังสุดให้ทับทุกอย่าง
    d.line([CW, 0, CW, H - BAR], fill=LINE_C, width=4)
    d.line([0, CH, W, CH], fill=LINE_C, width=4)

    brand_bar(img, d, page)
    img.save(out, "PNG", optimize=True)
    print("wrote", out, os.path.getsize(out), "bytes")


def main():
    build(PAGE1, 1, os.path.join(HERE, "richmenu-p1.png"))
    build(PAGE2, 2, os.path.join(HERE, "richmenu-p2.png"))
    print("cell = %dx%d | bar = %dx%d" % (CW, CH, W, BAR))


if __name__ == "__main__":
    main()
