const EC_TH_DIGIT = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const EC_TH_POS = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];
function ecNumTH(digits) {
  const s = String(digits || "").replace(/^0+/, "");
  if (!s) return "";
  if (s.length > 6) return ecNumTH(s.slice(0, s.length - 6)) + "ล้าน" + ecNumTH(s.slice(-6));
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const d = +s[i];
    const pos = s.length - i - 1;
    if (!d) continue;
    if (pos === 0) out += d === 1 && s.length > 1 ? "เอ็ด" : EC_TH_DIGIT[d];else if (pos === 1) out += d === 1 ? "สิบ" : d === 2 ? "ยี่สิบ" : EC_TH_DIGIT[d] + "สิบ";else out += EC_TH_DIGIT[d] + EC_TH_POS[pos];
  }
  return out;
}
function ecBahtText(n) {
  const raw = +n || 0;
  const v = window.ecRound(Math.abs(raw));
  const baht = Math.floor(v);
  const satang = Math.round((v - baht) * 100);
  let out = baht ? ecNumTH(String(baht)) + "บาท" : satang ? "" : "ศูนย์บาท";
  out += satang ? ecNumTH(String(satang)) + "สตางค์" : baht || !satang ? "ถ้วน" : "";
  return (raw < 0 ? "ลบ" : "") + out;
}
const EC_PAPER_I18N = {
  "ใบสำคัญจ่าย": ["Payment Voucher", "付款凭证"],
  "จ่ายคืนแล้ว": ["Reimbursed", "已报销"],
  "จ่ายให้": ["Pay to", "收款人"],
  "วันที่จ่าย": ["Payment date", "付款日期"],
  "จำนวนใบเบิก": ["Claims in batch", "报销单数"],
  "เลขสลิป / อ้างอิง": ["Slip / reference no.", "凭证 / 参考编号"],
  "ผู้ทำรายการ": ["Prepared by", "经办人"],
  "บันทึกเมื่อ": ["Recorded", "记录时间"],
  "จำนวนเงินที่จ่าย": ["Amount paid", "付款金额"],
  "ตัวอักษร": ["In words (Thai)", "金额大写（泰文）"],
  "เลขที่ใบ": ["Claim no.", "单号"],
  "วันที่ใช้จ่าย": ["Spent on", "支出日期"],
  "หมวด": ["Category", "类别"],
  "งาน / ไซต์": ["Job / site", "项目 / 站点"],
  "ผู้อนุมัติ": ["Approved by", "批准人"],
  "จำนวนเงิน": ["Amount", "金额"],
  "ใบเบิกที่ปิดในรอบนี้": ["Claims settled in this batch", "本批次已结报销单"],
  "รวมทั้งสิ้น": ["Grand total", "合计"],
  "หมายเหตุ": ["Note", "备注"],
  "ผู้รับเงิน": ["Received by", "收款人签字"],
  "ผู้จ่ายเงิน": ["Paid by", "付款人签字"],
  "ชื่อ:": ["Name:", "姓名："],
  "วันที่:": ["Date:", "日期："],
  "เอกสารนี้ออกจากระบบติดตามงานติดตั้ง": ["Issued by the installation tracking system of", "本文件由安装管理系统开具"],
  "พิมพ์เมื่อ": ["printed", "打印于"],
  "บาท": ["THB", "泰铢"],
  "ใบ": ["claims", "张"],
  "ใบเบิกเงินหน้างาน": ["Expense Claim", "现场费用报销单"],
  "ผู้ขอเบิก": ["Claimed by", "申请人"],
  "สถานะ": ["Status", "状态"],
  "ที่มาของเงิน": ["Funded by", "资金来源"],
  "ยอดที่ขอเบิก": ["Amount claimed", "申请金额"],
  "รายการที่จ่าย": ["Items", "支出明细"],
  "รายการ": ["Item", "项目"],
  "จำนวน": ["Qty", "数量"],
  "หน่วย": ["Unit", "单位"],
  "ราคา/หน่วย": ["Unit price", "单价"],
  "รวม": ["Amount", "小计"],
  "บิล / ใบเสร็จ": ["Receipts", "票据"],
  "ยังไม่ได้แนบบิล": ["No receipt attached", "未附票据"],
  "ไฟล์ PDF แนบไว้ในระบบ": ["PDF attached in the system", "系统内附有 PDF 文件"],
  "ผู้จ่ายคืน": ["Reimbursed by", "付款人"],
  "แนบบิลไว้": ["Receipts attached", "已附票据"],
  "ใบ · อยู่แผ่นถัดไป": ["on the following sheets", "张，见后页"],
  "แผ่น": ["sheet", "页"],
  "ร่าง": ["Draft", "草稿"],
  "รออนุมัติ": ["Pending approval", "待审批"],
  "อนุมัติแล้ว": ["Approved", "已批准"],
  "ไม่อนุมัติ": ["Rejected", "未批准"],
  "ออกเงินตัวเองไปก่อน": ["Paid by employee", "员工垫付"],
  "เงินสดกองกลาง": ["Petty cash", "备用金"],
  "บัตร / บัญชีบริษัท": ["Company card / account", "公司卡 / 账户"],
  "ซื้อของหน้างาน": ["Site purchase", "现场采购"],
  "ค่าขนส่งของ": ["Freight", "货运费"],
  "ค่าน้ำมัน / เดินทาง": ["Fuel / travel", "油费与差旅"],
  "ค่าอาหาร / ที่พัก": ["Meals / lodging", "餐费与住宿"],
  "ค่าแรงจ้างช่วง": ["Subcontract labour", "外包人工"],
  "อื่น ๆ": ["Other", "其他"]
};
function useEcPrintBody() {
  React.useEffect(() => {
    document.body.classList.add("sv-rep-printing");
    return () => document.body.classList.remove("sv-rep-printing");
  }, []);
}
function useEcSigns(ids) {
  const key = (ids || []).filter(Boolean).join(",");
  const [map, setMap] = React.useState({});
  React.useEffect(() => {
    const list = key ? key.split(",") : [];
    if (!list.length || !_ECFB()) {
      setMap({});
      return;
    }
    let alive = true;
    Promise.all(list.map(id => _ecRef("userSigns/" + id).once("value").then(s => [id, (s.val() || {}).img || ""]).catch(() => [id, ""]))).then(pairs => {
      if (!alive) return;
      const o = {};
      pairs.forEach(p => {
        if (p[1]) o[p[0]] = p[1];
      });
      setMap(o);
    });
    return () => {
      alive = false;
    };
  }, [key]);
  return map;
}
function EcVoucherPaper({
  batch,
  claims,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [lang, setLang] = React.useState(() => window.pgLang ? window.pgLang() : "th");
  const pickLang = id => {
    setLang(id);
    if (window.pgSetLang) window.pgSetLang(id);
  };
  const T = React.useMemo(() => window.pgT ? window.pgT(EC_PAPER_I18N, lang) : k => k, [lang]);
  const DT = iso => !iso ? "—" : lang === "th" || !window.pgDate ? window.drDateTH(iso, true) : window.pgDate(iso, lang);
  const DTs = iso => !iso ? "—" : lang === "th" || !window.pgDate ? window.drDateTH(iso) : window.pgDate(iso, lang);
  const b = batch || {};
  const list = claims || [];
  const total = window.ecRound(b.total);
  const found = window.ecRound(list.reduce((a, c) => a + window.ecRound(c.amount), 0));
  const missing = list.length !== (b.count || 0);
  const apprs = [];
  list.forEach(c => {
    if (!c || !c.decidedByName) return;
    const k = c.decidedById || c.decidedByName;
    const hit = apprs.filter(a => a.k === k)[0];
    if (hit) {
      if ((c.decidedAt || "") > hit.at) hit.at = c.decidedAt || "";
      return;
    }
    apprs.push({
      k: k,
      id: c.decidedById || "",
      name: c.decidedByName,
      at: c.decidedAt || ""
    });
  });
  const signs = useEcSigns([b.byId].concat(apprs.length === 1 ? [apprs[0].id] : []));
  useEcPrintBody();
  const doPrint = () => {
    const old = document.title;
    document.title = T("ใบสำคัญจ่าย") + " " + (b.no || "") + " " + (b.toName || "");
    window.print();
    setTimeout(() => {
      document.title = old;
    }, 800);
  };
  const th = {
    textAlign: "left",
    padding: "5px 7px",
    fontSize: 10,
    fontWeight: 700,
    color: "#5A6B62",
    borderBottom: "1px solid #C9D5CE",
    whiteSpace: "nowrap"
  };
  const td = {
    padding: "5px 7px",
    fontSize: 10.5,
    color: "#15211A",
    borderBottom: "1px solid #ECF1EE",
    verticalAlign: "top"
  };
  const num = Object.assign({}, td, {
    textAlign: "right",
    fontFamily: "var(--mono)"
  });
  return ReactDOM.createPortal(React.createElement("div", {
    className: "sv-rep-overlay",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 160,
      background: "rgba(8,20,14,.55)",
      overflow: "auto",
      padding: isMobile ? 0 : "24px 16px"
    }
  }, React.createElement("div", {
    className: "sv-rep-noprint",
    style: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      display: "flex",
      gap: 9,
      alignItems: "center",
      padding: "11px 14px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      marginBottom: isMobile ? 0 : 16,
      borderRadius: isMobile ? 0 : 12,
      maxWidth: 900,
      marginLeft: "auto",
      marginRight: "auto",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E43\u0E1A\u0E2A\u0E33\u0E04\u0E31\u0E0D\u0E08\u0E48\u0E32\u0E22 \xB7 ", b.no || "-"), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, b.toName || "-", " \xB7 ", window.ecBaht(total), " \u0E1A\u0E32\u0E17 \xB7 \u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 \u201C\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 PDF\u201D")), typeof window.LangPick === "function" && React.createElement(window.LangPick, {
    value: lang,
    onChange: pickLang
  }), React.createElement("button", {
    onClick: doPrint,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "11px 16px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 16,
    color: "#fff"
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF")), React.createElement("div", {
    className: "sv-rep-paper",
    style: {
      maxWidth: 900,
      margin: "0 auto",
      background: "#fff",
      color: "#15211A",
      fontFamily: lang === "zh" && window.pgFontStack ? window.pgFontStack("zh") : undefined,
      padding: isMobile ? "20px 16px" : "30px 34px",
      borderRadius: isMobile ? 0 : 12,
      boxShadow: "0 20px 60px rgba(8,20,14,.28)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      flexWrap: "wrap",
      borderBottom: "2px solid #1B9B75",
      paddingBottom: 11
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 800,
      letterSpacing: "-.01em"
    }
  }, T("ใบสำคัญจ่าย")), React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: ".12em",
      color: "#7A8A81",
      marginTop: 3
    }
  }, "PAYMENT VOUCHER \u2014 FIELD EXPENSE REIMBURSEMENT"), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      marginTop: 6
    }
  }, React.createElement(window.BrandMark, {
    size: 22,
    variant: "light"
  }), React.createElement(window.BrandWord, {
    size: 16,
    color: "#0F2B33"
  }))), React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 11,
      color: "#4A5A51",
      lineHeight: 1.75
    }
  }, React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      color: "#15211A"
    }
  }, b.no || "-"), React.createElement("div", null, DT(b.date)), React.createElement("div", {
    style: {
      display: "inline-block",
      marginTop: 3,
      padding: "2px 9px",
      borderRadius: 99,
      background: "#10B98122",
      color: "#10B981",
      fontWeight: 700,
      fontSize: 10.5
    }
  }, T("จ่ายคืนแล้ว")))), React.createElement("div", {
    style: {
      marginTop: 13,
      display: "grid",
      gridTemplateColumns: "auto 1fr auto 1fr",
      border: "1px solid #DCE4DF",
      borderRadius: 7,
      overflow: "hidden"
    }
  }, React.createElement(EcVPRow, {
    k: T("จ่ายให้"),
    v: b.toName || "-"
  }), React.createElement(EcVPRow, {
    k: T("วันที่จ่าย"),
    v: DTs(b.date)
  }), React.createElement(EcVPRow, {
    k: T("จำนวนใบเบิก"),
    v: (b.count || 0) + " " + T("ใบ")
  }), React.createElement(EcVPRow, {
    k: T("เลขสลิป / อ้างอิง"),
    v: b.ref || "—"
  }), React.createElement(EcVPRow, {
    k: T("ผู้ทำรายการ"),
    v: b.byName || "-"
  }), React.createElement(EcVPRow, {
    k: T("บันทึกเมื่อ"),
    v: b.at ? DTs(window.drLocalDay(b.at)) : "—"
  })), React.createElement("div", {
    style: {
      marginTop: 14,
      border: "1px solid #1B9B75",
      borderRadius: 9,
      overflow: "hidden",
      breakInside: "avoid"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      padding: "11px 14px",
      background: "#F3F9F6"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "#4A5A51"
    }
  }, T("จำนวนเงินที่จ่าย")), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 120
    }
  }), React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      fontFamily: "var(--mono)",
      color: "#0A4D68"
    }
  }, window.ecBaht(total)), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#4A5A51"
    }
  }, T("บาท"))), React.createElement("div", {
    style: {
      padding: "8px 14px",
      fontSize: 12,
      color: "#15211A",
      borderTop: "1px solid #DCE4DF"
    }
  }, T("ตัวอักษร"), " ", React.createElement("b", null, "(", ecBahtText(total), ")"))), React.createElement(EcPBlock, {
    title: T("ใบเบิกที่ปิดในรอบนี้") + " (" + list.length + " " + T("ใบ") + ")"
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: Object.assign({}, th, {
      width: 26
    })
  }, "#"), React.createElement("th", {
    style: th
  }, T("เลขที่ใบ")), React.createElement("th", {
    style: th
  }, T("วันที่ใช้จ่าย")), React.createElement("th", {
    style: th
  }, T("หมวด")), React.createElement("th", {
    style: th
  }, T("งาน / ไซต์")), React.createElement("th", {
    style: th
  }, T("ผู้อนุมัติ")), React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "right",
      width: 88
    })
  }, T("จำนวนเงิน")))), React.createElement("tbody", null, list.map((c, i) => React.createElement("tr", {
    key: c.id
  }, React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      color: "#7A8A81"
    })
  }, i + 1), React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)"
    })
  }, c.no || "-"), React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      fontSize: 10
    })
  }, c.date ? window.pgShort ? window.pgShort(c.date, lang) : window.drShort(c.date) : "—"), React.createElement("td", {
    style: td
  }, T(window.ecKindOf(c.kind).th)), React.createElement("td", {
    style: td
  }, [c.siteCode, c.siteName].filter(Boolean).join(" · ") || "—"), React.createElement("td", {
    style: td
  }, c.decidedByName || c.approverName || "—"), React.createElement("td", {
    style: num
  }, window.ecBaht(c.amount)))), React.createElement("tr", null, React.createElement("td", {
    style: Object.assign({}, td, {
      borderBottom: "none"
    }),
    colSpan: 6
  }, React.createElement("b", {
    style: {
      fontSize: 11.5
    }
  }, T("รวมทั้งสิ้น"))), React.createElement("td", {
    style: Object.assign({}, num, {
      borderBottom: "none",
      fontSize: 13,
      fontWeight: 800
    })
  }, window.ecBaht(total))))), missing && React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 10.5,
      color: "#B45309"
    }
  }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38: \u0E23\u0E2D\u0E1A\u0E19\u0E35\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49 ", b.count || 0, " \u0E43\u0E1A \u0E41\u0E15\u0E48\u0E41\u0E2A\u0E14\u0E07\u0E44\u0E14\u0E49 ", list.length, " \u0E43\u0E1A (\u0E1C\u0E25\u0E1A\u0E27\u0E01\u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07 ", window.ecBaht(found), " \u0E1A\u0E32\u0E17) \u2014 \u0E43\u0E1A\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E16\u0E39\u0E01\u0E25\u0E1A\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E20\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E07 \u0E22\u0E2D\u0E14\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E08\u0E23\u0E34\u0E07\u0E22\u0E36\u0E14\u0E15\u0E32\u0E21\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19")), b.note ? React.createElement(EcPBlock, {
    title: T("หมายเหตุ"),
    avoid: true
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      lineHeight: 1.65,
      color: "#15211A",
      whiteSpace: "pre-wrap"
    }
  }, b.note)) : null, React.createElement("div", {
    style: {
      marginTop: 22,
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 14,
      breakInside: "avoid"
    }
  }, [{
    t: T("ผู้รับเงิน"),
    n: b.toName
  }, {
    t: T("ผู้จ่ายเงิน"),
    n: b.byName,
    img: signs[b.byId],
    at: b.at || b.date
  }, {
    t: T("ผู้อนุมัติ"),
    n: apprs.map(a => a.name).join(" · "),
    img: apprs.length === 1 ? signs[apprs[0].id] : "",
    at: apprs.length === 1 ? apprs[0].at : ""
  }].map((s, i) => React.createElement("div", {
    key: i,
    style: {
      border: "1px solid #DCE4DF",
      borderRadius: 8,
      padding: "12px 14px"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "#5A6B62"
    }
  }, s.t), React.createElement("div", {
    style: {
      height: 42,
      borderBottom: "1px solid #C9D5CE",
      marginTop: 6,
      display: "grid",
      placeItems: "center",
      overflow: "hidden"
    }
  }, s.img ? React.createElement("img", {
    src: s.img,
    alt: "",
    style: {
      maxWidth: "100%",
      maxHeight: 40,
      objectFit: "contain"
    }
  }) : null), React.createElement("div", {
    style: {
      fontSize: 11,
      marginTop: 6,
      color: "#15211A"
    }
  }, T("ชื่อ:"), " ", React.createElement("b", null, s.n || "…………………………")), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#4A5A51"
    }
  }, T("วันที่:"), " ", s.at ? DTs(s.at) : "…………………………")))), React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 9.5,
      color: "#8A9A91",
      textAlign: "center"
    }
  }, T("เอกสารนี้ออกจากระบบติดตามงานติดตั้ง"), " flash+solar \xB7 ", b.no || "-", " \xB7 ", T("พิมพ์เมื่อ"), " ", DTs(window.drToday())))), document.body);
}
function EcClaimPaper({
  claim,
  job,
  user,
  onPrinted,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [lang, setLang] = React.useState(() => window.pgLang ? window.pgLang() : "th");
  const pickLang = id => {
    setLang(id);
    if (window.pgSetLang) window.pgSetLang(id);
  };
  const T = React.useMemo(() => window.pgT ? window.pgT(EC_PAPER_I18N, lang) : k => k, [lang]);
  const DTs = iso => !iso ? "—" : lang === "th" || !window.pgDate ? window.drDateTH(iso) : window.pgDate(iso, lang);
  const day = iso => iso ? window.drLocalDay ? window.drLocalDay(iso) : String(iso).slice(0, 10) : "";
  const c = claim || {};
  const kind = window.ecKindOf(c.kind);
  const pay = window.ecPayOf(c.payMethod);
  const st = window.ecStatusOf(c.status);
  const items = (c.items || []).filter(r => r && (r.name || r.amount || r.price));
  const total = window.ecSum(c.items);
  const rc = window.useEcReceipts(c.id);
  const shots = rc && rc.shots || [];
  const imgs = shots.filter(s => window.ecReceiptKind(s) === "img");
  const pdfs = shots.filter(s => window.ecReceiptKind(s) === "pdf");
  const signs = useEcSigns([c.byId, c.decidedById, c.paidById]);
  useEcPrintBody();
  const doPrint = () => {
    const old = document.title;
    document.title = T("ใบเบิกเงินหน้างาน") + " " + (c.no || "") + " " + (c.byName || "");
    window.print();
    setTimeout(() => {
      document.title = old;
    }, 800);
  };
  const markPrinted = () => {
    if (!onPrinted) return;
    onPrinted({
      printedAt: new Date().toISOString(),
      printedById: (user || {}).id || null,
      printedByName: (user || {}).name || ""
    });
  };
  const th = {
    textAlign: "left",
    padding: "5px 7px",
    fontSize: 10,
    fontWeight: 700,
    color: "#5A6B62",
    borderBottom: "1px solid #C9D5CE",
    whiteSpace: "nowrap"
  };
  const td = {
    padding: "5px 7px",
    fontSize: 10.5,
    color: "#15211A",
    borderBottom: "1px solid #ECF1EE",
    verticalAlign: "top"
  };
  const num = Object.assign({}, td, {
    textAlign: "right",
    fontFamily: "var(--mono)"
  });
  const boxes = [{
    t: T("ผู้ขอเบิก"),
    n: c.byName,
    img: signs[c.byId],
    at: day(c.sentAt) || c.date
  }, {
    t: T("ผู้อนุมัติ"),
    n: c.decidedByName,
    img: signs[c.decidedById],
    at: day(c.decidedAt)
  }, {
    t: T("ผู้จ่ายคืน"),
    n: c.paidByName,
    img: signs[c.paidById],
    at: day(c.paidAt)
  }];
  return ReactDOM.createPortal(React.createElement("div", {
    className: "sv-rep-overlay",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 160,
      background: "rgba(8,20,14,.55)",
      overflow: "auto",
      padding: isMobile ? 0 : "24px 16px"
    }
  }, React.createElement("div", {
    className: "sv-rep-noprint",
    style: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      display: "flex",
      gap: 9,
      alignItems: "center",
      padding: "11px 14px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      marginBottom: isMobile ? 0 : 16,
      borderRadius: isMobile ? 0 : 12,
      maxWidth: 900,
      marginLeft: "auto",
      marginRight: "auto",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E43\u0E1A\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 \xB7 ", c.no || "-"), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, c.byName || "-", " \xB7 ", window.ecBaht(total), " \u0E1A\u0E32\u0E17 \xB7 \u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 \u201C\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 PDF\u201D")), typeof window.LangPick === "function" && React.createElement(window.LangPick, {
    value: lang,
    onChange: pickLang
  }), c.printedAt ? React.createElement("span", {
    title: (c.printedByName ? "โดย " + c.printedByName + " · " : "") + window.drDateTH(day(c.printedAt)),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "8px 12px",
      borderRadius: 10,
      flexShrink: 0,
      background: "var(--tint-ok-bg)",
      color: "var(--tint-ok-tx)",
      fontSize: 12.5,
      fontWeight: 700,
      whiteSpace: "nowrap"
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 14,
    color: "var(--tint-ok-tx)"
  }), " \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E41\u0E25\u0E49\u0E27") : onPrinted ? React.createElement("button", {
    onClick: markPrinted,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "11px 14px",
      borderRadius: 11,
      flexShrink: 0,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "var(--text-2)"
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E27\u0E48\u0E32\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E41\u0E25\u0E49\u0E27") : null, React.createElement("button", {
    onClick: doPrint,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "11px 16px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 16,
    color: "#fff"
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF")), React.createElement("div", {
    className: "sv-rep-paper",
    style: {
      maxWidth: 900,
      margin: "0 auto",
      background: "#fff",
      color: "#15211A",
      fontFamily: lang === "zh" && window.pgFontStack ? window.pgFontStack("zh") : undefined,
      padding: isMobile ? "20px 16px" : "30px 34px",
      borderRadius: isMobile ? 0 : 12,
      boxShadow: "0 20px 60px rgba(8,20,14,.28)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      flexWrap: "wrap",
      borderBottom: "2px solid #1B9B75",
      paddingBottom: 11
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 800,
      letterSpacing: "-.01em"
    }
  }, T("ใบเบิกเงินหน้างาน")), React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: ".12em",
      color: "#7A8A81",
      marginTop: 3
    }
  }, "EXPENSE CLAIM \u2014 FIELD REIMBURSEMENT"), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      marginTop: 6
    }
  }, React.createElement(window.BrandMark, {
    size: 22,
    variant: "light"
  }), React.createElement(window.BrandWord, {
    size: 16,
    color: "#0F2B33"
  }))), React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 11,
      color: "#4A5A51",
      lineHeight: 1.75
    }
  }, React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      color: "#15211A"
    }
  }, c.no || "-"), React.createElement("div", null, DTs(c.date)), React.createElement("div", {
    style: {
      display: "inline-block",
      marginTop: 3,
      padding: "2px 9px",
      borderRadius: 99,
      background: st.color + "22",
      color: st.color,
      fontWeight: 700,
      fontSize: 10.5
    }
  }, T(st.th)))), React.createElement("div", {
    style: {
      marginTop: 13,
      display: "grid",
      gridTemplateColumns: "auto 1fr auto 1fr",
      border: "1px solid #DCE4DF",
      borderRadius: 7,
      overflow: "hidden"
    }
  }, React.createElement(EcVPRow, {
    k: T("ผู้ขอเบิก"),
    v: c.byName || "-"
  }), React.createElement(EcVPRow, {
    k: T("วันที่ใช้จ่าย"),
    v: DTs(c.date)
  }), React.createElement(EcVPRow, {
    k: T("หมวด"),
    v: T(kind.th)
  }), React.createElement(EcVPRow, {
    k: T("ที่มาของเงิน"),
    v: T(pay.th)
  }), React.createElement(EcVPRow, {
    k: T("งาน / ไซต์"),
    v: c.jobId ? [c.siteCode, c.siteName].filter(Boolean).join(" · ") : "—"
  }), React.createElement(EcVPRow, {
    k: T("ผู้อนุมัติ"),
    v: c.decidedByName || c.approverName || "—"
  })), React.createElement("div", {
    style: {
      marginTop: 14,
      border: "1px solid #1B9B75",
      borderRadius: 9,
      overflow: "hidden",
      breakInside: "avoid"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      padding: "11px 14px",
      background: "#F3F9F6"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "#4A5A51"
    }
  }, T("ยอดที่ขอเบิก")), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 120
    }
  }), React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      fontFamily: "var(--mono)",
      color: "#0A4D68"
    }
  }, window.ecBaht(total)), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#4A5A51"
    }
  }, T("บาท"))), React.createElement("div", {
    style: {
      padding: "8px 14px",
      fontSize: 12,
      color: "#15211A",
      borderTop: "1px solid #DCE4DF"
    }
  }, T("ตัวอักษร"), " ", React.createElement("b", null, "(", ecBahtText(total), ")"))), React.createElement(EcPBlock, {
    title: T("รายการที่จ่าย")
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: Object.assign({}, th, {
      width: 26
    })
  }, "#"), React.createElement("th", {
    style: th
  }, T("รายการ")), React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "right",
      width: 58
    })
  }, T("จำนวน")), React.createElement("th", {
    style: Object.assign({}, th, {
      width: 58
    })
  }, T("หน่วย")), React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "right",
      width: 80
    })
  }, T("ราคา/หน่วย")), React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "right",
      width: 88
    })
  }, T("รวม")))), React.createElement("tbody", null, items.map((r, i) => React.createElement("tr", {
    key: i
  }, React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      color: "#7A8A81"
    })
  }, i + 1), React.createElement("td", {
    style: td
  }, r.name || "—"), React.createElement("td", {
    style: num
  }, r.qty || ""), React.createElement("td", {
    style: td
  }, r.unit || ""), React.createElement("td", {
    style: num
  }, r.price === "" || r.price == null ? "" : window.ecBaht(r.price)), React.createElement("td", {
    style: num
  }, window.ecBaht(window.ecSum([r]))))), React.createElement("tr", null, React.createElement("td", {
    style: Object.assign({}, td, {
      borderBottom: "none"
    }),
    colSpan: 5
  }, React.createElement("b", {
    style: {
      fontSize: 11.5
    }
  }, T("รวมทั้งสิ้น"))), React.createElement("td", {
    style: Object.assign({}, num, {
      borderBottom: "none",
      fontSize: 13,
      fontWeight: 800
    })
  }, window.ecBaht(total)))))), c.note ? React.createElement(EcPBlock, {
    title: T("หมายเหตุ"),
    avoid: true
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      lineHeight: 1.65,
      color: "#15211A",
      whiteSpace: "pre-wrap"
    }
  }, c.note)) : null, React.createElement(EcPBlock, {
    title: T("บิล / ใบเสร็จ"),
    avoid: true
  }, imgs.length === 0 && pdfs.length === 0 ? React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#B45309"
    }
  }, "\u2014 ", T("ยังไม่ได้แนบบิล"), " \u2014") : React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6B62",
      lineHeight: 1.7
    }
  }, imgs.length > 0 && React.createElement("div", null, T("แนบบิลไว้"), " ", React.createElement("b", null, imgs.length), " ", T("ใบ · อยู่แผ่นถัดไป")), pdfs.length > 0 && React.createElement("div", null, pdfs.length, " ", T("ไฟล์ PDF แนบไว้ในระบบ"), pdfs.map(p => p.name).filter(Boolean).length ? " · " + pdfs.map(p => p.name).filter(Boolean).join(" · ") : ""))), React.createElement("div", {
    style: {
      marginTop: 22,
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 14,
      breakInside: "avoid"
    }
  }, boxes.map((s, i) => React.createElement("div", {
    key: i,
    style: {
      border: "1px solid #DCE4DF",
      borderRadius: 8,
      padding: "12px 14px"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "#5A6B62"
    }
  }, s.t), React.createElement("div", {
    style: {
      height: 42,
      borderBottom: "1px solid #C9D5CE",
      marginTop: 6,
      display: "grid",
      placeItems: "center",
      overflow: "hidden"
    }
  }, s.img ? React.createElement("img", {
    src: s.img,
    alt: "",
    style: {
      maxWidth: "100%",
      maxHeight: 40,
      objectFit: "contain"
    }
  }) : null), React.createElement("div", {
    style: {
      fontSize: 11,
      marginTop: 6,
      color: "#15211A"
    }
  }, T("ชื่อ:"), " ", React.createElement("b", null, s.n || "…………………………")), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#4A5A51"
    }
  }, T("วันที่:"), " ", s.at ? DTs(s.at) : "…………………………")))), React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 9.5,
      color: "#8A9A91",
      textAlign: "center"
    }
  }, T("เอกสารนี้ออกจากระบบติดตามงานติดตั้ง"), " flash+solar \xB7 ", c.no || "-", " \xB7 ", T("พิมพ์เมื่อ"), " ", DTs(window.drToday())), imgs.map((s, i) => React.createElement("div", {
    key: s.id,
    className: "ec-sheet",
    style: {
      marginTop: 20,
      paddingTop: 18,
      borderTop: "1px dashed #C9D5CE"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 12,
      borderBottom: "1px solid #DCE4DF",
      paddingBottom: 6,
      marginBottom: 10
    }
  }, React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 800
    }
  }, T("บิล / ใบเสร็จ")), React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "#5A6B62",
      fontFamily: "var(--mono)"
    }
  }, c.no || "-", " \xB7 ", T("แผ่น"), " ", i + 1, "/", imgs.length)), React.createElement("img", {
    src: s.dataUrl,
    alt: "",
    style: {
      width: "100%",
      maxHeight: "232mm",
      objectFit: "contain",
      display: "block"
    }
  }))))), document.body);
}
function EcVPRow({
  k,
  v
}) {
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      padding: "6px 10px",
      fontSize: 10.5,
      fontWeight: 700,
      color: "#5A6B62",
      background: "#F7FAF8",
      borderBottom: "1px solid #ECF1EE",
      whiteSpace: "nowrap"
    }
  }, k), React.createElement("div", {
    style: {
      padding: "6px 10px",
      fontSize: 11.5,
      color: "#15211A",
      borderBottom: "1px solid #ECF1EE"
    }
  }, v || "—"));
}
function EcPBlock({
  title,
  children,
  avoid
}) {
  return React.createElement("div", {
    style: {
      marginTop: 16,
      breakInside: avoid ? "avoid" : "auto"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      borderBottom: "1px solid #DCE4DF",
      paddingBottom: 5,
      marginBottom: 8
    }
  }, React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: 99,
      background: "#1B9B75"
    }
  }), React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: "#15211A"
    }
  }, title)), children);
}
function ecExportXlsx(claims, opts) {
  if (!window.XLSX) {
    alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)");
    return;
  }
  const rows = (claims || []).slice();
  if (!rows.length) {
    alert("ไม่มีใบเบิกให้ออกไฟล์");
    return;
  }
  const o = opts || {};
  const X = window.XLSX;
  const C = {
    brand: "1D854B",
    brandDk: "12603A",
    brandSoft: "EAF6EF",
    group: "D6EBDF",
    alt: "F4FAF6",
    white: "FFFFFF",
    border: "CBD8D0",
    text: "16241D",
    sub: "5A6B62",
    owedTx: "B42318",
    owedBg: "FDECEA",
    sumBg: "D6EBDF"
  };
  const FONT = "Tahoma";
  const thin = {
    style: "thin",
    color: {
      rgb: C.border
    }
  };
  const boxAll = {
    top: thin,
    bottom: thin,
    left: thin,
    right: thin
  };
  const cols = ["ลำดับ", "เลขที่ใบ", "วันที่ใช้จ่าย", "หมวด", "ที่มาของเงิน", "รหัสงาน", "ชื่องาน / ไซต์", "หมายเหตุ", "สถานะ", "ผู้อนุมัติ", "วันที่จ่ายคืน", "รอบจ่าย / สลิป", "จำนวนเงิน"];
  const lastC = cols.length - 1;
  const AMT = lastC;
  const colW = [{
    wch: 7
  }, {
    wch: 16
  }, {
    wch: 11
  }, {
    wch: 16
  }, {
    wch: 18
  }, {
    wch: 11
  }, {
    wch: 26
  }, {
    wch: 28
  }, {
    wch: 12
  }, {
    wch: 16
  }, {
    wch: 11
  }, {
    wch: 18
  }, {
    wch: 13
  }];
  const aoa = [],
    merges = [],
    meta = [],
    rowsH = [];
  let R = 0;
  const pushRow = (cells, type, hpt) => {
    aoa.push(cells);
    meta[R] = type;
    if (hpt) rowsH[R] = {
      hpt: hpt
    };
    R += 1;
  };
  const fullMerge = r => merges.push({
    s: {
      r: r,
      c: 0
    },
    e: {
      r: r,
      c: lastC
    }
  });
  const pad = (first, rest) => {
    const a = [first];
    for (let i = 1; i <= lastC; i++) a.push(i === 1 ? rest : "");
    return a;
  };
  pushRow(["รายการใบเบิกเงินหน้างาน"], "title", 30);
  fullMerge(R - 1);
  pushRow(["flash+solar · ระบบติดตามงานติดตั้งโซลาร์เซลล์"], "subtitle", 20);
  fullMerge(R - 1);
  pushRow([], "spacer", 6);
  [["ขอบเขตข้อมูล", o.scope || "ทั้งหมด"], ["จำนวนใบ", rows.length + " ใบ"], ["ผู้ออกเอกสาร", o.byName || "-"], ["วันที่ออกเอกสาร", window.drDateTH(window.drToday())]].forEach(row => {
    pushRow(pad(row[0], row[1]), "info", 19);
    merges.push({
      s: {
        r: R - 1,
        c: 1
      },
      e: {
        r: R - 1,
        c: lastC
      }
    });
  });
  pushRow([], "spacer", 8);
  pushRow(cols, "head", 24);
  const byPerson = {};
  rows.forEach(c => {
    const k = (c.byName || "ไม่ระบุชื่อ") + "|" + (c.byId || "");
    (byPerson[k] || (byPerson[k] = [])).push(c);
  });
  const keys = Object.keys(byPerson).sort((a, b) => a.localeCompare(b, "th"));
  let n = 0,
    grand = 0,
    grandOwed = 0;
  keys.forEach(k => {
    n += 1;
    const items = byPerson[k].slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    const name = k.split("|")[0];
    const sub = window.ecRound(items.reduce((a, c) => a + window.ecRound(c.amount), 0));
    const owed = window.ecRound(items.filter(c => c.status === "approved" && window.ecPayOf(c.payMethod).owed).reduce((a, c) => a + window.ecRound(c.amount), 0));
    grand += sub;
    grandOwed += owed;
    const grow = ["ลำดับที่ " + n, ""];
    for (let i = 2; i <= lastC; i++) grow.push(i === 2 ? name + "   (" + items.length + " ใบ)" : "");
    pushRow(grow, "group", 20);
    merges.push({
      s: {
        r: R - 1,
        c: 2
      },
      e: {
        r: R - 1,
        c: lastC
      }
    });
    items.forEach((c, i) => {
      pushRow([n + "." + (i + 1), c.no || "", c.date ? window.drDateTH(c.date) : "", window.ecKindOf(c.kind).th, window.ecPayOf(c.payMethod).th, c.siteCode || "", c.siteName || "", c.note || "", window.ecStatusOf(c.status).th, c.decidedByName || c.approverName || "", c.paidAt ? window.drDateTH(window.drLocalDay(c.paidAt)) : "", [c.batchNo, c.paidRef].filter(Boolean).join(" · "), window.ecRound(c.amount)], i % 2 === 0 ? "item" : "itemAlt");
    });
    const srow = [];
    for (let i = 0; i <= lastC; i++) {
      srow.push(i === 0 ? "รวม " + name : i === AMT ? sub : i === 1 ? owed ? "ค้างจ่ายคนนี้ " + window.ecBaht(owed) + " บาท" : "" : "");
    }
    pushRow(srow, "sum", 20);
    merges.push({
      s: {
        r: R - 1,
        c: 1
      },
      e: {
        r: R - 1,
        c: AMT - 1
      }
    });
  });
  const trow = [];
  for (let i = 0; i <= lastC; i++) {
    trow.push(i === 0 ? "รวมทั้งสิ้น" : i === AMT ? window.ecRound(grand) : i === 1 ? "ค้างจ่ายพนักงานรวม " + window.ecBaht(grandOwed) + " บาท" : "");
  }
  pushRow(trow, "total", 24);
  merges.push({
    s: {
      r: R - 1,
      c: 1
    },
    e: {
      r: R - 1,
      c: AMT - 1
    }
  });
  pushRow([], "spacer", 8);
  pushRow(["ยอดในไฟล์นี้เป็นเงินสดที่จ่ายหน้างานเท่านั้น ไม่รวมวัสดุที่เบิกจากคลังและค่าแรงผู้รับเหมา"], "foot", 18);
  fullMerge(R - 1);
  const ws = X.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"] = colW;
  ws["!rows"] = rowsH;
  const money = '#,##0.00';
  const styleCell = (r, c) => {
    const t = meta[r];
    if (t === "spacer") return null;
    const s = {
      font: {
        name: FONT,
        sz: 11,
        color: {
          rgb: C.text
        }
      },
      alignment: {
        vertical: "center"
      }
    };
    if (t === "title") {
      s.font = {
        name: FONT,
        sz: 15,
        bold: true,
        color: {
          rgb: C.white
        }
      };
      s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brand
        }
      };
      s.alignment = {
        horizontal: "center",
        vertical: "center"
      };
    } else if (t === "subtitle") {
      s.font = {
        name: FONT,
        sz: 10.5,
        bold: true,
        color: {
          rgb: C.brandDk
        }
      };
      s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brandSoft
        }
      };
      s.alignment = {
        horizontal: "center",
        vertical: "center"
      };
    } else if (t === "info") {
      if (c === 0) {
        s.font = {
          name: FONT,
          sz: 10.5,
          bold: true,
          color: {
            rgb: C.sub
          }
        };
        s.alignment = {
          horizontal: "right",
          vertical: "center"
        };
      } else {
        s.font = {
          name: FONT,
          sz: 11.5,
          bold: true,
          color: {
            rgb: C.text
          }
        };
        s.alignment = {
          horizontal: "left",
          vertical: "center"
        };
      }
      s.border = {
        bottom: thin
      };
    } else if (t === "head") {
      s.font = {
        name: FONT,
        sz: 11,
        bold: true,
        color: {
          rgb: C.white
        }
      };
      s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brand
        }
      };
      s.alignment = {
        horizontal: c === 6 || c === 7 ? "left" : "center",
        vertical: "center",
        wrapText: true
      };
      s.border = boxAll;
    } else if (t === "group") {
      s.font = {
        name: FONT,
        sz: 11,
        bold: true,
        color: {
          rgb: C.brandDk
        }
      };
      s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.group
        }
      };
      s.alignment = {
        horizontal: c < 2 ? "center" : "left",
        vertical: "center"
      };
      s.border = boxAll;
    } else if (t === "sum" || t === "total") {
      s.font = {
        name: FONT,
        sz: t === "total" ? 12 : 11,
        bold: true,
        color: {
          rgb: t === "total" ? C.white : C.brandDk
        }
      };
      s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: t === "total" ? C.brandDk : C.sumBg
        }
      };
      s.border = boxAll;
      if (c === AMT) {
        s.alignment = {
          horizontal: "right",
          vertical: "center"
        };
        s.numFmt = money;
      } else if (c === 1) s.alignment = {
        horizontal: "left",
        vertical: "center"
      };else s.alignment = {
        horizontal: c === 0 ? "left" : "center",
        vertical: "center"
      };
    } else if (t === "foot") {
      s.font = {
        name: FONT,
        sz: 9.5,
        color: {
          rgb: C.sub
        }
      };
      s.alignment = {
        horizontal: "left",
        vertical: "center"
      };
    } else if (t === "item" || t === "itemAlt") {
      if (t === "itemAlt") s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.alt
        }
      };
      s.border = boxAll;
      if (c === AMT) {
        s.alignment = {
          horizontal: "right",
          vertical: "center"
        };
        s.numFmt = money;
        s.font = {
          name: FONT,
          sz: 11,
          bold: true,
          color: {
            rgb: C.text
          }
        };
      } else if (c === 6 || c === 7) s.alignment = {
        horizontal: "left",
        vertical: "center",
        wrapText: true
      };else if (c === 1) {
        s.alignment = {
          horizontal: "center",
          vertical: "center"
        };
        s.font = {
          name: FONT,
          sz: 9.5,
          color: {
            rgb: C.sub
          }
        };
      } else s.alignment = {
        horizontal: "center",
        vertical: "center"
      };
    }
    return s;
  };
  const range = X.utils.decode_range(ws["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const ref = X.utils.encode_cell({
        r: r,
        c: c
      });
      const s = styleCell(r, c);
      if (!s) continue;
      if (!ws[ref]) ws[ref] = {
        t: "s",
        v: ""
      };
      ws[ref].s = s;
    }
  }
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, "ใบเบิกเงิน");
  X.writeFile(wb, "ใบเบิกเงินหน้างาน_" + window.drToday() + ".xlsx");
}
Object.assign(window, {
  ecNumTH,
  ecBahtText,
  EcVoucherPaper,
  EcClaimPaper,
  ecExportXlsx
});
