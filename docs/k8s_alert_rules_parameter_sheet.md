# Kubernetes 監視項目一覧(kube-prometheus-stack アラートルール)

`docs/k8s_alert_rules_parameter_sheet.xlsx` は、kube-prometheus-stack が投入する
PrometheusRule のアラート定義をパラメータシート向けに一覧化した Excel です。

## 出典

- 入力: `kubectl get prometheusrules -n monitoring -o yaml` の出力
  (`docs/source/alert_definition.yaml` に保存)
- Helm chart: kube-prometheus-stack 88.6.3
- PrometheusRule 35 件 / ルールグループ 35 個 / **アラートルール 155 件**(記録ルール 94 件は対象外)

## シート構成

| シート | 内容 |
|---|---|
| 監視項目一覧 | 1 アラート定義 = 1 行(155 行)。カテゴリ、対象コンポーネント、アラート名、severity、監視内容(和訳)、発報条件・閾値(和訳)、継続時間(for)、追加ラベル、Summary/Description 原文、PromQL、Runbook URL、備考 |
| サマリ | severity 別 / カテゴリ×severity 別 / for 別の件数(COUNTIF 数式で一覧シートを参照) |
| 凡例・前提 | 出典、severity の目安、列の読み方、Alertmanager 通知経路に関する注記 |

同名アラートが複数行ある場合は、閾値の異なる段階アラート(warning / critical など)です。
重複除去せず全件を掲載しています。

## 再生成

```bash
pip install openpyxl pyyaml
python3 tools/build_alert_sheet.py docs/source/alert_definition.yaml docs/k8s_alert_rules_parameter_sheet.xlsx
```

- 日本語訳(監視内容・発報条件・備考)は `tools/build_alert_sheet.py` 内の辞書 `TRANSLATIONS` で管理しています。
  入力 YAML に辞書へ未登録のアラートがあるとスクリプトはエラーで停止します(訳漏れ防止)。
- サマリシートの数式は Excel で開いた際に自動再計算されます(`fullCalcOnLoad`)。

## 注意

- 「発報条件・閾値」列は PromQL を日本語に要約したものです。厳密な条件は PromQL 列を正としてください。
- アラートが firing になっても、実際にメール等で通知されるかは Alertmanager の
  `route` / `receivers` / `inhibit_rules` の設定に依存します。詳細は「凡例・前提」シートの 4 章を参照してください。
