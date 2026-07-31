# Kubernetes 監視設計書

## 1. 文書情報

| 項目 | 内容 |
|---|---|
| 文書名 | Kubernetes 監視設計書 |
| 対象システム | Kubernetes クラスタおよび稼働アプリケーション |
| 関連システム | Zabbix、Ansible Automation Platform (AAP) / Event-Driven Ansible (EDA) |
| 版数 | 1.0(初版) |

## 2. 目的とスコープ

### 2.1 目的

本書は、Kubernetes クラスタの安定稼働を目的とした監視設計を定義する。
障害の早期検知に加え、Zabbix からの Webhook 通知を Event-Driven Ansible で受信し、
AAP のジョブテンプレート / ワークフローテンプレートによる自動復旧までを設計範囲とする。

### 2.2 スコープ

| 区分 | 対象 | 備考 |
|---|---|---|
| 対象 | コントロールプレーン、ワーカーノード、Pod / コンテナ、K8s リソース状態、クラスタ内アプリケーション | |
| 対象 | Zabbix → EDA → AAP の自動復旧連携 | 本リポジトリのルールブック構成に準拠 |
| 対象外 | ネットワーク機器・物理基盤の監視 | 既存インフラ監視設計に従う |
| 対象外 | セキュリティ監査(Falco 等のランタイム検知) | 別途セキュリティ設計で定義 |

## 3. 監視アーキテクチャ

### 3.1 全体構成

```
+------------------+     メトリクス収集      +---------+
| Kubernetes       | <--------------------- | Zabbix  |
|  - kube-apiserver|   (Kubernetes API /    | Server  |
|  - ノード         |    Zabbix Agent2 +     +----+----+
|  - Pod/コンテナ   |    K8s テンプレート)         | 障害検知時 Webhook (HTTP POST)
+------------------+                             v
                                          +-------------+
                                          | EDA         |  ansible.eda.webhook
                                          | ルールブック  |  (port 5000)
                                          +------+------+
                                                 | 条件一致時
                                                 v
                                          +-------------+
                                          | AAP         |  run_job_template /
                                          | Controller  |  run_workflow_template
                                          +-------------+
                                                 | 自動復旧 Playbook 実行
                                                 v
                                           対象ノード / クラスタ
```

### 3.2 監視方式

| # | 方式 | 用途 |
|---|---|---|
| 1 | Zabbix 公式テンプレート「Kubernetes cluster state by HTTP」 | kube-state-metrics 経由でクラスタ・リソース状態を収集 |
| 2 | Zabbix 公式テンプレート「Kubernetes nodes by HTTP」 | ノードの状態・リソース使用状況を収集 |
| 3 | Zabbix Helm チャート(Zabbix Proxy + Agent2 を DaemonSet 配置) | クラスタ内からのメトリクス収集・疎通確保 |
| 4 | 外形監視(HTTP エージェント) | Ingress / Service 経由のアプリケーション死活監視 |

前提コンポーネント:

- kube-state-metrics をクラスタ内にデプロイすること
- Zabbix 用 ServiceAccount を作成し、読み取り専用の ClusterRole をバインドすること
- API アクセス用トークンは Zabbix のマクロ(Secret 扱い)で管理し、設計書・リポジトリには記載しない

## 4. 監視項目設計

### 4.1 コントロールプレーン

| 監視項目 | 閾値 / 条件 | 重要度 |
|---|---|---|
| kube-apiserver 死活 | ヘルスチェック (`/readyz`) 失敗 | 重度 (High) |
| etcd リーダー有無 | リーダー不在 | 致命的 (Disaster) |
| kube-scheduler / controller-manager 死活 | ヘルスチェック失敗 | 重度 |
| API サーバー証明書有効期限 | 残 30 日未満 | 警告 (Warning) |

### 4.2 ワーカーノード

| 監視項目 | 閾値 / 条件 | 重要度 |
|---|---|---|
| ノード Ready 状態 | NotReady が 5 分継続 | 重度 |
| CPU 使用率 | 90% 超が 10 分継続 | 警告 |
| メモリ使用率 | 90% 超が 10 分継続 | 警告 |
| ディスク使用率 | 85% 超 | 警告 / 95% 超で重度 |
| kubelet 死活 | ヘルスチェック失敗 | 重度 |
| ノード Pressure 状態 | Memory/Disk/PID Pressure 発生 | 警告 |

### 4.3 Pod / コンテナ

| 監視項目 | 閾値 / 条件 | 重要度 |
|---|---|---|
| Pod ステータス | CrashLoopBackOff / ImagePullBackOff 検出 | 重度 |
| Pod 再起動回数 | 15 分間に 3 回以上 | 警告 |
| Deployment レプリカ数 | desired と available の不一致が 5 分継続 | 重度 |
| DaemonSet 稼働数 | 期待数との不一致 | 警告 |
| Job 失敗 | Failed 状態の検出 | 警告 |
| Pending Pod | Pending が 10 分継続(スケジュール不可) | 警告 |

### 4.4 アプリケーション(外形監視)

| 監視項目 | 閾値 / 条件 | 重要度 |
|---|---|---|
| サービス URL 応答 | HTTP 200 以外、または 3 回連続タイムアウト | 重度 |
| 応答時間 | 3 秒超が 5 分継続 | 警告 |

## 5. アラート・通知設計

| 重要度 | 通知先 | 対応 |
|---|---|---|
| 致命的 (Disaster) | 電話 + メール + チャット | 即時対応(24/365) |
| 重度 (High) | メール + チャット + EDA Webhook | 自動復旧を試行し、失敗時は手動対応 |
| 警告 (Warning) | チャット | 営業時間内に対応 |
| 情報 (Information) | 監視ダッシュボードのみ | 対応不要・傾向分析に利用 |

- 通知は Zabbix のトリガーアクションで重要度別に振り分ける
- 自動復旧対象のトリガーには専用タグ(例: `auto_remediation`)を付与し、Webhook メディアタイプで EDA へ送信する

## 6. 自動復旧設計(Zabbix → EDA → AAP)

### 6.1 連携フロー

1. Zabbix トリガー障害検知 → Webhook メディアタイプで EDA(`0.0.0.0:5000`)へ JSON を POST
2. EDA ルールブックが `event.payload` の条件(`trigger_name`、`event_value` 等)を評価
3. 条件一致時に AAP の `run_job_template` または `run_workflow_template` を実行
4. `extra_vars` の `target_host` に Zabbix の `host_host` を渡し、対象ホストを特定して復旧 Playbook を実行

### 6.2 Webhook ペイロード仕様(Zabbix 側で設定)

| フィールド | 内容 | 例 |
|---|---|---|
| `trigger_name` | トリガー名 | `Kubernetes: Pod CrashLoopBackOff` |
| `event_value` | 1=障害発生、0=復旧 | `1` |
| `host_host` | 対象ホスト名 | `worker-node-01` |
| `severity` | 重要度 | `High` |

### 6.3 自動復旧シナリオ(初期リリース対象)

| # | 障害事象 | EDA ルール条件 | AAP 実行内容 |
|---|---|---|---|
| 1 | Pod CrashLoopBackOff | `trigger_name` が該当トリガー かつ `event_value == 1` | 対象 Deployment のロールアウト再起動(`kubectl rollout restart` 相当) |
| 2 | ノード NotReady | 同上 | kubelet / コンテナランタイム再起動 → 回復しない場合は drain + 通知 |
| 3 | ディスク使用率超過 | 同上 | 未使用イメージ・完了 Pod のクリーンアップ(`crictl rmi --prune` 相当) |

運用ルール:

- 自動復旧は同一障害につき 1 回のみ実行し、再発時は手動対応にエスカレーションする(復旧ループ防止)
- 自動復旧の実行結果は AAP のジョブ履歴で追跡し、失敗時は運用チームへ通知する
- 破壊的操作(ノード削除、PV 削除等)は自動化の対象外とする

### 6.4 EDA ルールブック規約

- 条件式は既存の `rulebooks/zabbix_webhook.yml` の形式に準拠する(YAML 複数行条件は `condition: >-` 配下の行を正しくインデントすること)
- ルールブックは `rulebooks/` ディレクトリに集約し、1 ファイル 1 イベントソースとする
- ジョブテンプレート名・組織名(`organization: Default`)は AAP 側の定義と一致させる

## 7. ログ監視

| 項目 | 方式 |
|---|---|
| コンテナログ | ログ収集基盤(Fluent Bit 等)へ集約し、エラーパターンを Zabbix ログ監視アイテムで検知 |
| Kubernetes イベント | kube-state-metrics / API 経由で Warning イベントを収集 |
| 監査ログ | kube-apiserver 監査ログを収集基盤へ転送(保管期間: 1 年) |

## 8. 運用・保守

- **監視の監視**: Zabbix Server・EDA コンテナ自体の死活を相互監視する(EDA 停止時は Webhook 不達となるため、Zabbix 側で送信失敗を検知して通知する)
- **メンテナンス時**: 計画作業時は Zabbix メンテナンス期間を設定し、誤検知・不要な自動復旧を抑止する
- **閾値見直し**: リリース後 1 か月は警告閾値の妥当性をレビューし、四半期ごとに見直す
- **テスト**: 自動復旧シナリオは検証環境で四半期ごとに動作確認する

## 9. 今後の課題

- Prometheus / Grafana 併用によるメトリクス長期保管・可視化の検討
- 自動復旧シナリオの拡充(HPA 連携、PV 容量拡張等)
- マルチクラスタ監視への拡張
