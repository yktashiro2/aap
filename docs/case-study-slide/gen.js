const pptxgen = require("pptxgenjs");
const fs = require("fs");

const NAVY = "00209B";
const BLUE = "2A65F5";
const LIGHT = "EDF3F9";
const RED = "E00000";
const INK = "222222";
const GRAY = "5A6472";
const LIGHTBLUE = "C9D6FF";
const BORDER = "D8E1EE";
const JP = "Meiryo";

const icon = (name) => "image/png;base64," + fs.readFileSync(`icons/${name}.png`).toString("base64");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
const slide = pres.addSlide();
slide.background = { color: "FFFFFF" };

// ---------- Header ----------
slide.addText("導入事例", {
  shape: "roundRect", rectRadius: 0.17,
  x: 0.5, y: 0.48, w: 1.3, h: 0.36,
  fill: { color: NAVY }, color: "FFFFFF",
  fontFace: JP, fontSize: 11, bold: true, align: "center", valign: "middle", margin: 0,
});
slide.addText("Ansible による Windows / RHEL 設定作業の自動化", {
  x: 0.5, y: 0.95, w: 10.6, h: 0.55,
  fontFace: JP, fontSize: 25, bold: true, color: NAVY, margin: 0, valign: "middle",
});
slide.addText("仮想化基盤移行に伴うゲストOSの設定作業を Playbook 化し、移行前後の作業を自動化・標準化", {
  x: 0.5, y: 1.52, w: 10.6, h: 0.32,
  fontFace: JP, fontSize: 12, color: GRAY, margin: 0, valign: "middle",
});

// Ansible mark (top right)
slide.addShape("ellipse", { x: 12.0, y: 0.5, w: 0.92, h: 0.92, fill: { color: RED } });
slide.addImage({ data: icon("ansible"), x: 12.21, y: 0.71, w: 0.5, h: 0.5 });
slide.addText("Ansible", {
  x: 11.8, y: 1.46, w: 1.32, h: 0.26,
  fontFace: "Arial", fontSize: 10, bold: true, color: GRAY, align: "center", margin: 0,
});

// ---------- Left column: overview + flow ----------
const LX = 0.5, LW = 3.95, LY = 2.0, LH = 3.7;
slide.addShape("roundRect", { x: LX, y: LY, w: LW, h: LH, rectRadius: 0.08, fill: { color: LIGHT } });
slide.addText("案件概要", {
  x: LX + 0.24, y: LY + 0.18, w: LW - 0.48, h: 0.3,
  fontFace: JP, fontSize: 13, bold: true, color: NAVY, margin: 0, valign: "middle",
});
slide.addText(
  "VMware環境から新たな仮想化基盤への大規模VM移行プロジェクトにおいて、移行の前後に必要となるゲストOSの設定作業を Ansible で自動化。Windows・RHEL の両OSに対応し、多数のVMへ均一に適用しました。",
  {
    x: LX + 0.24, y: LY + 0.52, w: LW - 0.48, h: 1.22,
    fontFace: JP, fontSize: 10, color: INK, margin: 0, valign: "top", lineSpacingMultiple: 1.15,
  }
);
slide.addText("適用フロー", {
  x: LX + 0.24, y: LY + 1.74, w: LW - 0.48, h: 0.26,
  fontFace: JP, fontSize: 11, bold: true, color: NAVY, margin: 0, valign: "middle",
});
const steps = [
  { t: "① 移行前の事前設定", tag: "Ansible 自動実行", auto: true },
  { t: "② Zerto によるVM移行", tag: "同期・切替", auto: false },
  { t: "③ 移行後の事後設定", tag: "Ansible 自動実行", auto: true },
];
steps.forEach((s, i) => {
  const by = LY + 2.04 + i * 0.54;
  slide.addShape("roundRect", {
    x: LX + 0.24, y: by, w: LW - 0.48, h: 0.44, rectRadius: 0.06,
    fill: { color: s.auto ? NAVY : "FFFFFF" },
    line: s.auto ? undefined : { color: BLUE, width: 1 },
  });
  slide.addText(s.t, {
    x: LX + 0.4, y: by, w: 2.2, h: 0.44,
    fontFace: JP, fontSize: 10, bold: true, color: s.auto ? "FFFFFF" : NAVY,
    margin: 0, valign: "middle",
  });
  slide.addText(s.tag, {
    x: LX + 2.45, y: by, w: 1.16, h: 0.44,
    fontFace: JP, fontSize: 8, color: s.auto ? LIGHTBLUE : GRAY,
    margin: 0, valign: "middle", align: "right",
  });
  if (i < 2) {
    slide.addShape("triangle", {
      x: LX + LW / 2 - 0.07, y: by + 0.455, w: 0.14, h: 0.08,
      fill: { color: BLUE }, flipV: true,
    });
  }
});

// ---------- OS cards ----------
function osCard(x, title, iconName, circleColor, pre, post) {
  const y = 2.0, w = 3.95, h = 3.7;
  slide.addShape("roundRect", {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: "FFFFFF" }, line: { color: BORDER, width: 1 },
    shadow: { type: "outer", color: "9AA7BD", blur: 6, offset: 2, angle: 90, opacity: 0.35 },
  });
  slide.addShape("ellipse", { x: x + 0.24, y: y + 0.18, w: 0.52, h: 0.52, fill: { color: circleColor } });
  slide.addImage({ data: icon(iconName), x: x + 0.36, y: y + 0.3, w: 0.28, h: 0.28 });
  slide.addText(title, {
    x: x + 0.92, y: y + 0.18, w: w - 1.1, h: 0.52,
    fontFace: "Arial", fontSize: 17, bold: true, color: NAVY, margin: 0, valign: "middle",
  });

  slide.addText("移行前", {
    shape: "roundRect", rectRadius: 0.11,
    x: x + 0.24, y: y + 0.88, w: 0.82, h: 0.26,
    fill: { color: BLUE }, color: "FFFFFF",
    fontFace: JP, fontSize: 9, bold: true, align: "center", valign: "middle", margin: 0,
  });
  slide.addText(
    pre.map((t, i) => ({
      text: t,
      options: { bullet: { characterCode: "2022", indent: 10 }, breakLine: true, paraSpaceAfter: i === pre.length - 1 ? 0 : 5 },
    })),
    {
      x: x + 0.24, y: y + 1.24, w: w - 0.48, h: 1.5,
      fontFace: JP, fontSize: 9.5, color: INK, margin: 0, valign: "top", lineSpacingMultiple: 1.05,
    }
  );

  slide.addText("移行後", {
    shape: "roundRect", rectRadius: 0.11,
    x: x + 0.24, y: y + 2.82, w: 0.82, h: 0.26,
    fill: { color: NAVY }, color: "FFFFFF",
    fontFace: JP, fontSize: 9, bold: true, align: "center", valign: "middle", margin: 0,
  });
  slide.addText(
    post.map((t, i) => ({
      text: t,
      options: { bullet: { characterCode: "2022", indent: 10 }, breakLine: true, paraSpaceAfter: i === post.length - 1 ? 0 : 5 },
    })),
    {
      x: x + 0.24, y: y + 3.18, w: w - 0.48, h: 0.65,
      fontFace: JP, fontSize: 9.5, color: INK, margin: 0, valign: "top", lineSpacingMultiple: 1.05,
    }
  );
}

osCard(4.75, "Windows", "windows", BLUE,
  [
    "VirtIO ISO の自動マウント / アンマウント",
    "VirtIO ドライバ・Guest Tools・QEMU Guest Agent の導入",
    "VMware Tools の導入状態確認",
    "処理結果レポートの自動出力",
  ],
  [
    "VMware Tools のアンインストール",
    "処理結果レポートの自動出力",
  ]
);
osCard(8.88, "RHEL", "linux", RED,
  [
    "qemu-guest-agent / open-vm-tools の導入とサービス有効化",
    "VirtIO ドライバの initramfs 登録確認・再生成(dracut)",
    "qemu-ga・SELinux の設定変更",
    "処理結果レポートの自動出力",
  ],
  [
    "open-vm-tools のアンインストール",
    "処理結果レポートの自動出力",
  ]
);

// ---------- Benefit tiles ----------
const tiles = [
  { icon: "sync", title: "冪等性のある自動化", desc: "導入済みの項目は自動でスキップ。何度でも安全に再実行できます。" },
  { icon: "file", title: "証跡レポートを自動生成", desc: "処理結果をレポート出力し、確認作業と証跡管理を効率化。" },
  { icon: "check", title: "作業の標準化・品質向上", desc: "多数のVMへ均一に適用し、手作業によるミスを削減。" },
];
tiles.forEach((t, i) => {
  const x = 0.5 + i * 4.165;
  const w = 4.0, y = 5.95, h = 1.1;
  slide.addShape("roundRect", { x, y, w, h, rectRadius: 0.08, fill: { color: NAVY } });
  slide.addImage({ data: icon(t.icon), x: x + 0.26, y: y + 0.34, w: 0.42, h: 0.42 });
  slide.addText(t.title, {
    x: x + 0.88, y: y + 0.14, w: w - 1.05, h: 0.34,
    fontFace: JP, fontSize: 12.5, bold: true, color: "FFFFFF", margin: 0, valign: "middle",
  });
  slide.addText(t.desc, {
    x: x + 0.88, y: y + 0.48, w: w - 1.05, h: 0.56,
    fontFace: JP, fontSize: 9, color: LIGHTBLUE, margin: 0, valign: "top", lineSpacingMultiple: 1.1,
  });
});

pres.writeFile({ fileName: "ansible-case-study.pptx" }).then(() => console.log("written"));
