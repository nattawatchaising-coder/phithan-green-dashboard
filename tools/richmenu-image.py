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

การ์ดมีระยะร่นเข้ามาจากขอบช่อง แต่ "พื้นที่กด" ยังเป็นสี่เหลี่ยมเต็มช่องเสมอ
คนที่กดพลาดไปโดนช่องว่างระหว่างการ์ดจึงยังได้ผลลัพธ์ที่ตั้งใจ

ไฟล์ผลลัพธ์ถูก commit ไว้ด้วย จะได้อัปเมนูขึ้น LINE ได้โดยไม่ต้องมี Pillow
ให้รันสคริปต์นี้ใหม่เฉพาะตอนแก้ดีไซน์
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 2500, 1686          # ขนาดเต็มของเมนูล่าง LINE ต้องเป๊ะตามนี้
BAR = 300                  # ความสูงของแถบโลโก้ด้านล่าง
COLS, ROWS = 2, 2
CW, CH = W // COLS, (H - BAR) // ROWS

PAD = 30                   # ระยะจากขอบช่องถึงขอบการ์ด
RAD = 44                   # ความมนของมุมการ์ด

TOP    = (14, 58, 70)      # พื้นไล่สีแนวตั้ง — สีเดียวทั้งใบทำให้ภาพดูแบนเหมือนกล่องทึบ
BOTTOM = (8, 34, 43)
CARD   = (255, 255, 255, 13)
CARD_E = (255, 255, 255, 28)
TEXT   = (255, 255, 255)
SUB    = (152, 188, 195)
BAR_BG = (5, 26, 33)

# หน้าแรก — เรื่องที่ช่างกดทุกวัน
PAGE1 = [
    {"th": "ลงเวลา",          "sub": "เข้า-ออกงาน",              "color": (32, 197, 138), "icon": "clock"},
    {"th": "งานของฉัน",       "sub": "ค้นหา · รายละเอียด",        "color": (56, 189, 208), "icon": "search"},
    {"th": "รายงานประจำวัน",  "sub": "ส่งใบรายงานหน้างาน",        "color": (122, 205, 122), "icon": "pen"},
    {"th": "หน้าถัดไป",       "sub": "ขอ OT · เบิกเงิน · เตือน",  "color": (154, 180, 188), "icon": "next", "nav": True},
]

# หน้าสอง — เรื่องเอกสาร กดไม่บ่อยเท่า แต่ต้องหาเจอ
PAGE2 = [
    {"th": "ขอ OT",      "sub": "ทำงานล่วงเวลา",            "color": (245, 183, 66),  "icon": "plus"},
    {"th": "เบิกเงิน",   "sub": "ค่าใช้จ่ายหน้างาน",         "color": (32, 197, 138),  "icon": "wallet"},
    {"th": "แจ้งเตือน",  "sub": "งานใหม่ · เอกสารตีกลับ",    "color": (56, 189, 208),  "icon": "bell"},
    {"th": "ย้อนกลับ",   "sub": "ลงเวลา · งาน · รายงาน",     "color": (154, 180, 188), "icon": "back", "nav": True},
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


def seg(d, x1, y1, x2, y2, color, w):
    """เส้นปลายมน — ImageDraw ลากเส้นปลายตัดตรงเสมอ ไอคอนเลยดูแข็งกว่าที่ควร
       เติมวงกลมที่ปลายทั้งสองข้างเอง ให้เข้าชุดกับไอคอนเส้นในหน้าเว็บ"""
    d.line([x1, y1, x2, y2], fill=color, width=w)
    r = w // 2
    for x, y in ((x1, y1), (x2, y2)):
        d.ellipse([x - r, y - r, x + r, y + r], fill=color)


def draw_icon(d, kind, cx, cy, r, color):
    """ไอคอนวาดมือด้วยรูปทรงพื้นฐาน — ไม่พึ่งฟอนต์ไอคอนหรือไฟล์ภาพจากที่อื่น"""
    w = max(7, int(r * 0.14))
    if kind == "clock":
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=w)
        seg(d, cx, cy, cx, cy - int(r * 0.52), color, w)
        seg(d, cx, cy, cx + int(r * 0.4), cy, color, w)
    elif kind == "bell":
        d.arc([cx - r, cy - r, cx + r, cy + int(r * 0.5)], 180, 360, fill=color, width=w)
        seg(d, cx - r, cy + int(r * 0.25), cx - r, cy - int(r * 0.12), color, w)
        seg(d, cx + r, cy + int(r * 0.25), cx + r, cy - int(r * 0.12), color, w)
        seg(d, cx - int(r * 1.14), cy + int(r * 0.28), cx + int(r * 1.14), cy + int(r * 0.28), color, w)
        d.arc([cx - int(r * 0.3), cy + int(r * 0.16), cx + int(r * 0.3), cy + int(r * 0.72)],
              0, 180, fill=color, width=w)
    elif kind == "plus":
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=w)
        seg(d, cx - int(r * 0.44), cy, cx + int(r * 0.44), cy, color, w)
        seg(d, cx, cy - int(r * 0.44), cx, cy + int(r * 0.44), color, w)
    elif kind == "pen":
        # ปากกาเฉียง — วาดเป็นรูปทรงจริง (ด้ามสี่เหลี่ยม + ปลายสามเหลี่ยม) ไม่ใช่เส้นหนา
        # เส้นหนาเฉียง ๆ กับสามเหลี่ยมเล็กรวมกันแล้วตาอ่านเป็น "ลูกศร" ไม่ใช่ปากกา
        k = 0.7071
        ux, uy = k, -k          # ทิศจากปลายปากกาไปทางด้าม
        nx, ny = k, k           # ตั้งฉาก ใช้วัดความหนาด้าม
        hw = r * 0.2
        tipx, tipy = cx - r * 0.72, cy + r * 0.72

        def at(s, o):
            return (tipx + ux * r * s + nx * o, tipy + uy * r * s + ny * o)

        d.polygon([(tipx, tipy), at(0.4, -hw), at(0.4, hw)], fill=color)          # ปลายปากกา
        d.polygon([at(0.46, -hw), at(1.5, -hw), at(1.5, hw), at(0.46, hw)], fill=color)   # ด้าม
        # ขีดคาดด้าม — ให้เห็นว่าเป็นปากกาไม่ใช่แท่งเปล่า ใช้สีพื้นการ์ดเจาะเป็นร่อง
        seg(d, at(0.72, -hw)[0], at(0.72, -hw)[1], at(0.72, hw)[0], at(0.72, hw)[1], BOTTOM, w)
        seg(d, cx - int(r * 0.82), cy + int(r * 1.02), cx + int(r * 0.82), cy + int(r * 1.02), color, w)
    elif kind == "wallet":
        d.rounded_rectangle([cx - r, cy - int(r * 0.66), cx + r, cy + int(r * 0.66)],
                            radius=int(r * 0.26), outline=color, width=w)
        seg(d, cx - int(r * 0.86), cy - int(r * 0.2), cx + int(r * 0.86), cy - int(r * 0.2), color, w)
        d.ellipse([cx + int(r * 0.24), cy + int(r * 0.04), cx + int(r * 0.56), cy + int(r * 0.36)],
                  fill=color)
    elif kind in ("next", "back"):
        # ปุ่มนำทางใช้ลูกศรเปล่า ไม่มีวงกลมล้อม — ให้ต่างจากไอคอนฟีเจอร์ที่เป็นทรงปิด
        s = 1 if kind == "next" else -1
        for dx in (-0.1, 0.3):
            seg(d, cx + s * int(r * dx), cy - int(r * 0.38),
                cx + s * int(r * (dx + 0.38)), cy, color, w)
            seg(d, cx + s * int(r * (dx + 0.38)), cy,
                cx + s * int(r * dx), cy + int(r * 0.38), color, w)
    else:  # search — แว่นขยาย: วงแหวนเปิดมุมล่างขวา + ด้าม
        d.arc([cx - r, cy - r, cx + int(r * 0.1), cy + int(r * 0.1)], 120, 60, fill=color, width=w)
        seg(d, cx - int(r * 0.24), cy - int(r * 0.24), cx + int(r * 0.72), cy + int(r * 0.72), color, w)


def centered(d, txt, fnt, cx, cy, fill):
    bb = d.textbbox((0, 0), txt, font=fnt)
    d.text((cx - (bb[2] - bb[0]) / 2, cy - (bb[3] - bb[1]) / 2 - bb[1]), txt, font=fnt, fill=fill)


def gradient_bg():
    """พื้นไล่สีแนวตั้ง วาดทีละแถว — ไม่ต้องมี numpy"""
    img = Image.new("RGB", (W, H), BOTTOM)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        d.line([0, y, W, y], fill=tuple(int(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3)))
    return img


def overlay(img, fn, blur=0):
    """วาดของโปร่งแสงลงเลเยอร์แยกแล้วค่อยผสมเข้าภาพ

    ⚠ อย่าเผลอใช้ ImageDraw.Draw(img, "RGBA") วาดสีที่มีอัลฟาลงภาพนี้ตรง ๆ
       โหมด "RGBA" ของ ImageDraw ผสมอัลฟาให้เฉพาะตอนภาพฐานเป็น RGB เท่านั้น
       ภาพฐานที่นี่เป็น RGBA มันจะเขียนค่าดิบทับ — วงกลมอัลฟา 26 จะออกมาทึบ 100%
    """
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    fn(ImageDraw.Draw(lay))
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(blur)) if blur else lay)


def glow(img, cx, cy, r, color):
    """แสงนวลหลังไอคอน — เบลอไว้ ไม่งั้นจะเป็นวงขอบแข็ง ๆ"""
    overlay(img, lambda dl: dl.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (52,)),
            blur=r * 0.45)


def build(cells, page, out):
    img = gradient_bg().convert("RGBA")

    f_title = font("LeelawUI.ttf", 96)
    f_sub = font("leelawad.ttf", 52)

    for i, c in enumerate(cells):
        col, row = i % COLS, i // COLS
        x0, y0 = col * CW, row * CH
        cx = x0 + CW // 2
        nav = c.get("nav")

        # การ์ด — ปุ่มนำทางเป็นการ์ดโปร่งขอบสี ให้อ่านออกว่าเป็นทางไปอีกหน้า ไม่ใช่ฟีเจอร์
        overlay(img, lambda dl: dl.rounded_rectangle(
            [x0 + PAD, y0 + PAD, x0 + CW - PAD, y0 + CH - PAD], radius=RAD,
            fill=(0, 0, 0, 0) if nav else CARD,
            outline=(c["color"] + (72,)) if nav else CARD_E, width=4 if nav else 3))

        icy = y0 + int(CH * 0.34)
        if not nav:
            glow(img, cx, icy, 140, c["color"])
        # วงกลมรองไอคอน — ไอคอนเส้นบางลอยเดี่ยว ๆ สู้ตัวหนังสือ 96px ไม่ไหว
        overlay(img, lambda dl: dl.ellipse([cx - 104, icy - 104, cx + 104, icy + 104],
                                           fill=c["color"] + (26,), outline=c["color"] + (112,), width=4))
        d = ImageDraw.Draw(img)
        draw_icon(d, c["icon"], cx, icy, 60, c["color"])

        centered(d, c["th"], f_title, cx, y0 + int(CH * 0.67), TEXT if not nav else (216, 231, 234))
        centered(d, c["sub"], f_sub, cx, y0 + int(CH * 0.845), SUB)

    brand_bar(img, page)
    img.convert("RGB").save(out, "PNG", optimize=True)
    print("wrote", out, os.path.getsize(out), "bytes")


def brand_bar(img, page):
    """แถบล่าง — โลโก้ + ทางเข้าเว็บเต็มจอ กดได้จริง ไม่ใช่ของตกแต่ง"""
    y0 = H - BAR
    d = ImageDraw.Draw(img)
    d.rectangle([0, y0, W, H], fill=BAR_BG)

    # เส้นคั่นไล่สีเขียว→ฟ้า — สิ่งเดียวที่กันไม่ให้แถบล่างดูเหมือนขอบดำของรูป
    for x in range(W):
        t = x / (W - 1)
        d.line([x, y0, x, y0 + 7],
               fill=(int(32 + 24 * t), int(197 - 8 * t), int(138 + 70 * t)))

    f_word = font("LeelawUI.ttf", 92)
    f_note = font("leelawad.ttf", 54)

    mark_h = 132
    word, note = "flash+solar", "เปิดเว็บเต็มจอ"
    bw = d.textbbox((0, 0), word, font=f_word)
    bn = d.textbbox((0, 0), note, font=f_note)
    gap = 40
    total = mark_h + gap + (bw[2] - bw[0]) + gap + (bn[2] - bn[0])
    x = (W - total) // 2
    cy = y0 + (BAR + 7) // 2

    if os.path.exists(LOGO):
        mark = Image.open(LOGO).convert("RGBA").resize((mark_h, mark_h), Image.LANCZOS)
        img.alpha_composite(mark, (x, cy - mark_h // 2))
    x += mark_h + gap
    d.text((x, cy - (bw[3] - bw[1]) / 2 - bw[1]), word, font=f_word, fill=TEXT)
    x += (bw[2] - bw[0]) + gap
    overlay(img, lambda dl: dl.line([x - gap // 2, cy - 42, x - gap // 2, cy + 42],
                                    fill=(255, 255, 255, 55), width=3))
    d.text((x, cy - (bn[3] - bn[1]) / 2 - bn[1]), note, font=f_note, fill=SUB)

    # จุดบอกหน้า — สื่อว่ามีสองหน้าให้สลับ โดยไม่ต้องเติมตัวหนังสืออีกชุดเข้าไปในแถบ
    def dots(dl):
        for i in (1, 2):
            r = 13 if i == page else 10
            dx = W - 180 + (i - 1) * 54
            dl.ellipse([dx - r, cy - r, dx + r, cy + r],
                       fill=(255, 255, 255, 235) if i == page else (255, 255, 255, 70))
    overlay(img, dots)


def main():
    build(PAGE1, 1, os.path.join(HERE, "richmenu-p1.png"))
    build(PAGE2, 2, os.path.join(HERE, "richmenu-p2.png"))
    print("cell = %dx%d | bar = %dx%d" % (CW, CH, W, BAR))


if __name__ == "__main__":
    main()
