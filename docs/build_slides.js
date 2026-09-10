// Ansible Automation Platform 提案資料(表紙 + スライド2)生成スクリプト
// 実行: node docs/build_slides.js   (pptxgenjs が require できる場所で実行)
const path = require("path");
const pptxgen = require("pptxgenjs");

const OUT = path.join(__dirname, "aap_event_driven_automation.pptx");

// 配色: Red Hat 想定の赤アクセント + ダークグレー + 白
const C = {
  red: "EE0000",
  redDark: "A30000",
  dark: "151515",
  gray: "4D4D4D",
  grayLight: "8A8A8A",
  bgSoft: "F5F5F5",
  cardBg: "FFFFFF",
  white: "FFFFFF",
  before: "6A6E73",
  beforeBg: "EDEDED",
  afterBg: "FDECEC",
};
const FONT = "Meiryo UI";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33" x 7.5"
pres.author = "AAP proposal";
pres.title = "Ansible Automation Platform による運用自動化";

// 共通ヘルパ ---------------------------------------------------------------
const shadow = () => ({ type: "outer", color: "000000", blur: 6, offset: 2, angle: 90, opacity: 0.12 });

function text(slide, str, opts) {
  slide.addText(str, { fontFace: FONT, isTextBox: true, margin: 0, ...opts });
}

// ===========================================================================
// スライド1: 表紙
// ===========================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };
  text(s, "Ansible Automation Platform による\n運用自動化", {
    x: 0.8, y: 2.0, w: 11.7, h: 1.9,
    fontSize: 40, bold: true, color: C.white, valign: "bottom",
  });
  text(s, "定常運用の自動化から、イベント駆動の障害一次対応へ", {
    x: 0.8, y: 4.05, w: 11.7, h: 0.6,
    fontSize: 20, color: "D2D2D2",
  });
  // 赤いアクセントの丸(モチーフ)
  s.addShape(pres.shapes.OVAL, { x: 11.2, y: 5.5, w: 1.3, h: 1.3, fill: { color: C.red }, line: { color: C.red } });
  text(s, "Red Hat Ansible Automation Platform を想定", {
    x: 0.8, y: 6.5, w: 8, h: 0.4, fontSize: 12, color: C.grayLight,
  });
}

// ===========================================================================
// スライド2: 定常運用 + 障害一次対応のイベント駆動自動化と効果
// ===========================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  // タイトル
  text(s, "定常運用の自動化に加え、障害の一次対応もイベントトリガーで自動化", {
    x: 0.5, y: 0.35, w: 12.3, h: 0.7, fontSize: 26, bold: true, color: C.dark,
  });
  text(s, "いつ起こるか分からない障害にも、監視イベントを起点に「決められた一次対応」を即時・確実に実行する", {
    x: 0.5, y: 1.05, w: 12.3, h: 0.4, fontSize: 13, color: C.gray,
  });

  // ---- 上段: Before / After フロー -------------------------------------
  const flowTop = 1.65;
  const rowH = 1.15;
  const labelW = 1.55;
  const flowX = 0.5 + labelW + 0.15;
  const flowW = 12.3 - labelW - 0.15;

  function flowRow(y, label, labelColor, labelBg, steps, stepFill, stepTextColor, note) {
    // 行ラベル
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y, w: labelW, h: rowH, fill: { color: labelBg }, line: { color: labelBg }, rectRadius: 0.08,
    });
    text(s, label, {
      x: 0.5, y, w: labelW, h: rowH, fontSize: 13, bold: true, color: labelColor, align: "center", valign: "middle",
    });
    // ステップ(シェブロン風の角丸ボックス + 矢印)
    const n = steps.length;
    const gap = 0.28;
    const boxW = (flowW - gap * (n - 1)) / n;
    steps.forEach((st, i) => {
      const x = flowX + i * (boxW + gap);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: y + 0.1, w: boxW, h: rowH - 0.5, fill: { color: stepFill }, line: { color: stepFill }, rectRadius: 0.06,
        shadow: shadow(),
      });
      text(s, st, {
        x: x + 0.05, y: y + 0.1, w: boxW - 0.1, h: rowH - 0.5, fontSize: 11, bold: true, color: stepTextColor,
        align: "center", valign: "middle",
      });
      if (i < n - 1) {
        text(s, "▶", {
          x: x + boxW, y: y + 0.1, w: gap, h: rowH - 0.5, fontSize: 10, color: C.grayLight, align: "center", valign: "middle",
        });
      }
    });
    // 補足
    text(s, note, {
      x: flowX, y: y + rowH - 0.38, w: flowW, h: 0.32, fontSize: 10.5, color: C.gray, italic: true,
    });
  }

  flowRow(
    flowTop, "Before\n人手による対応", C.white, C.before,
    ["監視アラート\n発報", "担当者を\n呼び出し", "状況確認・\n手順書参照", "手作業で\n一次対応", "結果を\n報告・記録"],
    C.beforeBg, C.dark,
    "夜間・休日は担当者到着まで待ち時間が発生。対応品質は担当者のスキルに依存",
  );
  flowRow(
    flowTop + rowH + 0.15, "After\nEvent-Driven\nAnsible", C.white, C.red,
    ["監視ツールが\nイベントを送信", "Rulebook が\n受信・条件判定", "Job / Workflow\nTemplate を自動実行", "結果を\n自動通知・記録", "必要時のみ\n人が二次対応"],
    C.afterBg, C.dark,
    "半自動 = 実行前に人の承認を挟む  /  全自動 = 定型化された一次対応を無人で即時実行",
  );

  // ---- 下段: 効果カード ------------------------------------------------
  const cardY = 4.45;
  const cardH = 2.15;
  const cardGap = 0.3;
  const cardW = (12.3 - cardGap * 3) / 4;
  const effects = [
    { no: "01", title: "初動の高速化", sub: "MTTR 短縮", body: "検知から一次対応まで数分以内。24時間365日、深夜でも同じ速さで初動できる" },
    { no: "02", title: "対応品質の均一化", sub: "属人化の解消", body: "コード化された手順を毎回同じように実行。手順ミス・対応漏れを排除" },
    { no: "03", title: "運用負荷の削減", sub: "コスト最適化", body: "夜間呼び出しと一次対応工数を削減。担当者は二次対応や改善活動に集中" },
    { no: "04", title: "記録と可視化", sub: "監査・改善に活用", body: "誰が何をいつ実行したかが自動で残る。振り返りと継続的な改善サイクルへ" },
  ];
  effects.forEach((e, i) => {
    const x = 0.5 + i * (cardW + cardGap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: cardY, w: cardW, h: cardH, fill: { color: C.bgSoft }, line: { color: C.bgSoft }, rectRadius: 0.1,
      shadow: shadow(),
    });
    // 番号の丸
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: cardY + 0.25, w: 0.55, h: 0.55, fill: { color: C.red }, line: { color: C.red } });
    text(s, e.no, { x: x + 0.25, y: cardY + 0.25, w: 0.55, h: 0.55, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle" });
    text(s, e.title, { x: x + 0.95, y: cardY + 0.22, w: cardW - 1.15, h: 0.35, fontSize: 15, bold: true, color: C.dark, valign: "middle" });
    text(s, e.sub, { x: x + 0.95, y: cardY + 0.57, w: cardW - 1.15, h: 0.28, fontSize: 11, color: C.redDark, valign: "middle" });
    text(s, e.body, { x: x + 0.25, y: cardY + 1.0, w: cardW - 0.5, h: cardH - 1.2, fontSize: 12, color: C.gray, valign: "top" });
  });

  // 脚注
  text(s, "※ 効果は環境・対象システムにより異なります。定常運用(パッチ適用・構成変更など)は Job Template、障害対応は Event-Driven Ansible で、同一プラットフォーム上で自動化を実現。", {
    x: 0.5, y: 6.8, w: 12.3, h: 0.45, fontSize: 10, color: C.grayLight,
  });

  s.addNotes(
    "定常運用の自動化(Job Template)に加え、Event-Driven Ansible により監視イベントを起点とした障害一次対応の半自動化・全自動化が可能になる点を説明。" +
    "半自動(承認あり)から始め、定型化できたものを全自動へ段階的に移行する進め方を提案する。"
  );
}

pres.writeFile({ fileName: OUT }).then((f) => console.log("written:", f));
