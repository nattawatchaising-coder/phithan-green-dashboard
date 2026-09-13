# -*- coding: utf-8 -*-
"""
สร้างไฟล์ภาพเมนูล่างของ LINE  →  tools/richmenu.png  (2500 x 1686)

วิธีใช้:  python tools/richmenu-image.py

ทำไมเป็น Python ไม่ใช่ Node: ต้องวาดตัวหนังสือไทยลงบนภาพ ซึ่ง Node ไม่มีมาให้
สคริปต์นี้รันในเครื่องเท่านั้น ไม่ได้ขึ้นเซิร์ฟเวอร์ จึงใช้ Pillow ได้
(กฎ "ห้ามมี dependency" ใช้กับโค้ดใน /api อย่างเดียว)

⚠ Pillow ในเครื่องนี้ไม่มี raqm → วางสระบนกับวรรณยุกต์ "สองชั้น" ไม่เป็น
   คำอย่าง "ที่" "ชื่อ" "เรื่อง" "สิ่ง" จะออกมาซ้อนทับกันอ่านไม่ออก
   เลี่ยงคำพวกนี้ในข้อความบนเมนู (ชั้นเดียวอย่าง "เข้า" "ต้อง" "ใหม่" ใช้ได้ปกติ)

ผลลัพธ์ tools/richmenu.png ถูก commit ไว้ด้วย — จะได้ไม่ต้องมี Pillow
ในเครื่องทุกคนที่อยากอัปเมนูขึ้น LINE  ให้รันสคริปต์นี้ใหม่เฉพาะตอนแก้ดีไซน์
"""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 2500, 1686          # ขนาดเต็มของเมนูล่าง LINE ต้องเป๊ะตามนี้
COLS, ROWS = 2, 2
CW, CH = W // COLS, H // ROWS

BG     = (10, 45, 56)      # พื้นหลังเข้ม — ตัดกับหน้าจอแชทที่สว่าง
LINE_C = (255, 255, 255, 38)
TEXT   = (255, 255, 255)
SUB    = (168, 200, 205)

# สี่ช่อง เรียงจากซ้ายบนไปขวาล่าง
CELLS = [
    {"th": "ลงเวลา",     "sub": "เข้า-ออกงาน",   "color": (27, 155, 117), "icon": "clock"},
    {"th": "งานของฉัน",  "sub": "ค้นหา · รายละเอียด", "color": (20, 128, 128), "icon": "search"},
    {"th": "ขอ OT",      "sub": "ทำงานล่วงเวลา",  "color": (34, 179, 106), "icon": "plus"},
    {"th": "แจ้งเตือน",  "sub": "งานใหม่ · เอกสารตีกลับ", "color": (20, 122, 140), "icon": "bell"},
]

FONT_DIR = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")


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
    else:  # search — แว่นขยาย: วงแหวนเปิดมุมล่างขวา + ด้าม
        d.arc([cx - r, cy - r, cx + int(r * 0.1), cy + int(r * 0.1)], 120, 60, fill=color, width=w)
        d.line([cx - int(r * 0.28), cy - int(r * 0.28), cx + int(r * 0.72), cy + int(r * 0.72)],
               fill=color, width=w)


def main():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img, "RGBA")

    f_title = font("LeelawUI.ttf", 108)
    f_sub = font("leelawad.ttf", 62)

    for i, c in enumerate(CELLS):
        col, row = i % COLS, i // COLS
        x0, y0 = col * CW, row * CH
        cx = x0 + CW // 2

        # แถบสีบาง ๆ ด้านบนของช่อง — บอกว่าแต่ละช่องคนละเรื่องกัน โดยไม่ต้องตีกรอบให้รก
        d.rectangle([x0, y0, x0 + CW, y0 + 14], fill=c["color"])

        draw_icon(d, c["icon"], cx, y0 + int(CH * 0.38), 118, c["color"])

        for txt, fnt, fill, dy in ((c["th"], f_title, TEXT, 0.66), (c["sub"], f_sub, SUB, 0.82)):
            bb = d.textbbox((0, 0), txt, font=fnt)
            d.text((cx - (bb[2] - bb[0]) / 2, y0 + int(CH * dy) - (bb[3] - bb[1]) / 2 - bb[1]),
                   txt, font=fnt, fill=fill)

    # เส้นแบ่งช่อง วาดทีหลังสุดให้ทับทุกอย่าง
    d.line([CW, 0, CW, H], fill=LINE_C, width=4)
    d.line([0, CH, W, CH], fill=LINE_C, width=4)

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "richmenu.png")
    img.save(out, "PNG", optimize=True)
    print("wrote", out, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    main()
