#!/usr/bin/env python3
"""kube-prometheus-stack の PrometheusRule 一覧(YAML)から監視項目パラメータシート(Excel)を生成する。

使い方:
    python3 tools/build_alert_sheet.py docs/source/alert_definition.yaml docs/k8s_alert_rules_parameter_sheet.xlsx

入力は `kubectl get prometheusrules -n monitoring -o yaml` の出力。
アラートルール(`alert:` を持つもの)のみを対象とし、記録ルール(`record:`)は対象外。
日本語訳は本ファイル内の辞書 TRANSLATIONS で管理する。辞書に無いアラートがあれば失敗させる(訳漏れ防止)。
"""
import re
import sys

import yaml
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

FONT_NAME = "Meiryo"

# ルールグループ名 -> 対象コンポーネント(日本語)
COMPONENT_BY_GROUP = {
    "alertmanager.rules": "Alertmanager",
    "config-reloaders": "Prometheus Operator(config-reloader)",
    "etcd": "etcd",
    "general.rules": "監視基盤(汎用)",
    "kube-apiserver-slos": "kube-apiserver(SLO)",
    "kube-state-metrics": "kube-state-metrics",
    "kubernetes-apps": "ワークロード(Pod/Deployment/StatefulSet/DaemonSet/Job/HPA/PDB)",
    "kubernetes-resources": "リソース(Requests/Quota/CPU スロットリング)",
    "kubernetes-storage": "ストレージ(PV/PVC)",
    "kubernetes-system": "Kubernetes コンポーネント全般",
    "kubernetes-system-apiserver": "kube-apiserver",
    "kubernetes-system-controller-manager": "kube-controller-manager",
    "kubernetes-system-kube-proxy": "kube-proxy",
    "kubernetes-system-kubelet": "kubelet / ノード状態",
    "kubernetes-system-scheduler": "kube-scheduler",
    "node-exporter": "ノード(OS/ハードウェア)",
    "node-network": "ノード(ネットワーク)",
    "prometheus": "Prometheus",
    "prometheus-operator": "Prometheus Operator",
}

# 訳辞書。キーは "アラート名" / "アラート名|severity" / "アラート名|severity|k=v,k=v"。
# 値は (監視内容, 発報条件・閾値, 備考)。
STAGED = "同名アラートが複数段階(severity 別)で定義されている。"
IMMEDIATE = "for 未設定のため条件成立と同時に発報する。"
T = TRANSLATIONS = {}


def t(key, what, cond, note=""):
    T[key] = (what, cond, note)


# --- alertmanager.rules -------------------------------------------------------
t("AlertmanagerFailedReload", "Alertmanager の設定リロード成否",
  "直近 5 分間の設定リロードが一度も成功していない(alertmanager_config_last_reload_successful == 0)")
t("AlertmanagerMembersInconsistent", "Alertmanager クラスタのメンバー認識数",
  "各インスタンスが認識しているクラスタメンバー数が、実際のインスタンス数より少ない")
t("AlertmanagerFailedToSendAlerts", "Alertmanager インスタンス単位の通知送信失敗率",
  "直近 15 分間の通知送信失敗率が 1% を超過(インテグレーション別)")
t("AlertmanagerClusterFailedToSendAlerts|critical", "Alertmanager クラスタ全体の通知送信失敗率(重要インテグレーション)",
  "クラスタ内の全インスタンスで、直近 15 分間の通知送信失敗率の最小値が 1% を超過",
  "本環境では integration=~`.*` のため全インテグレーションが本条件に該当する。" + STAGED)
t("AlertmanagerClusterFailedToSendAlerts|warning", "Alertmanager クラスタ全体の通知送信失敗率(非重要インテグレーション)",
  "クラスタ内の全インスタンスで、直近 15 分間の通知送信失敗率の最小値が 1% を超過",
  "本環境では integration!~`.*` のため対象インテグレーションは存在せず、実質発報しない。" + STAGED)
t("AlertmanagerConfigInconsistent", "Alertmanager クラスタ内の設定一致性",
  "同一クラスタ内のインスタンス間で設定ハッシュが 2 種類以上存在する(設定不一致)")
t("AlertmanagerClusterDown", "Alertmanager クラスタの稼働インスタンス数",
  "直近 5 分間の平均稼働率(up)が 0.5 未満のインスタンスが、クラスタの半数以上")
t("AlertmanagerClusterCrashlooping", "Alertmanager クラスタのクラッシュループ",
  "直近 10 分間にプロセス再起動が 4 回を超えたインスタンスが、クラスタの半数以上")
t("AlertmanagerClusterFailedPeers", "Alertmanager クラスタのピア接続失敗",
  "直近 5 分間で接続に失敗しているピア数が 0 より大きい")

# --- config-reloaders ---------------------------------------------------------
t("ConfigReloaderSidecarErrors", "config-reloader サイドカーの設定リロード成否",
  "直近 5 分間の設定リロードが一度も成功していない(reloader_last_reload_successful == 0)")

# --- etcd ---------------------------------------------------------------------
t("etcdMembersDown", "etcd メンバーの稼働状況",
  "up == 0 のメンバーが存在する、または直近 120 秒間のピア送信失敗レートが 0.01/秒 を超過")
t("etcdInsufficientMembers", "etcd クラスタの過半数(quorum)維持",
  "稼働中(up == 1)のメンバー数が (総メンバー数 + 1) / 2 未満(quorum 喪失)")
t("etcdNoLeader", "etcd リーダーの有無", "etcd_server_has_leader == 0(リーダー不在)")
t("etcdHighNumberOfLeaderChanges", "etcd リーダー交代回数",
  "直近 15 分間のリーダー交代回数が 4 回以上")
t("etcdHighNumberOfFailedGRPCRequests|warning", "etcd gRPC リクエスト失敗率",
  "直近 5 分間の gRPC 失敗率(Unknown/Unavailable/DeadlineExceeded 等)が 1% を超過", STAGED)
t("etcdHighNumberOfFailedGRPCRequests|critical", "etcd gRPC リクエスト失敗率",
  "直近 5 分間の gRPC 失敗率(Unknown/Unavailable/DeadlineExceeded 等)が 5% を超過", STAGED)
t("etcdGRPCRequestsSlow", "etcd gRPC 応答時間",
  "直近 5 分間の unary gRPC 処理時間の 99 パーセンタイルが 0.15 秒を超過(Defragment を除く)")
t("etcdMemberCommunicationSlow", "etcd メンバー間通信の遅延",
  "直近 5 分間のピア間ラウンドトリップ時間の 99 パーセンタイルが 0.15 秒を超過")
t("etcdHighNumberOfFailedProposals", "etcd 提案(proposal)失敗数",
  "直近 15 分間の提案失敗レートが 5 件/秒 を超過")
t("etcdHighFsyncDurations|warning", "etcd WAL fsync 時間",
  "直近 5 分間の WAL fsync 時間の 99 パーセンタイルが 0.5 秒を超過", STAGED)
t("etcdHighFsyncDurations|critical", "etcd WAL fsync 時間",
  "直近 5 分間の WAL fsync 時間の 99 パーセンタイルが 1 秒を超過", STAGED)
t("etcdHighCommitDurations", "etcd バックエンドコミット時間",
  "直近 5 分間のバックエンドコミット時間の 99 パーセンタイルが 0.25 秒を超過")
t("etcdDatabaseQuotaLowSpace", "etcd DB サイズのクォータ使用率",
  "DB 総サイズ / バックエンドクォータ が 95% を超過")
t("etcdExcessiveDatabaseGrowth", "etcd DB サイズの増加傾向",
  "直近 4 時間の傾向から 4 時間後の DB サイズを線形予測し、クォータを超過する見込み")
t("etcdDatabaseHighFragmentationRatio", "etcd DB のフラグメンテーション",
  "使用中サイズ / 総サイズ が 0.5 未満、かつ使用中サイズが 100MiB(104857600 バイト)を超過",
  "defrag の実施を検討する。")

# --- general.rules ------------------------------------------------------------
t("TargetDown", "スクレイプ対象(ターゲット)の到達性",
  "job/namespace/service 単位で、到達不能(up == 0)なターゲットの割合が 10% を超過")
t("Watchdog", "監視パイプライン(Prometheus→Alertmanager)の生存確認",
  "常時発報(vector(1))。条件は常に真",
  "死活確認用アラート。Alertmanager では null receiver へルーティングし、通知しないのが標準構成。"
  "発報が止まった場合に監視基盤の異常と判断する(外部の Dead man's switch と組み合わせて使用)。" + IMMEDIATE)
t("InfoInhibitor", "info アラートの抑止(inhibit)制御",
  "同一 namespace で severity=info のアラートが firing、かつ warning/critical のアラートが firing していない",
  "通知用ではなく inhibit_rules 用の補助アラート。Alertmanager では null receiver へルーティングし、"
  "本アラートが firing 中は同一 namespace の info アラートを抑止する構成が標準。" + IMMEDIATE)

# --- kube-apiserver-slos ------------------------------------------------------
_burn = "kube-apiserver の可用性 SLO(99%)に対するエラーバジェット消費速度(バーンレート)"
t("KubeAPIErrorBudgetBurn|critical|long=1h,short=5m", _burn,
  "1 時間および 5 分のバーンレートが共に 14.4 倍(エラー率 14.4%)を超過",
  "マルチウィンドウ・マルチバーンレート方式の最短ウィンドウ(最も急激な消費)。" + STAGED)
t("KubeAPIErrorBudgetBurn|critical|long=6h,short=30m", _burn,
  "6 時間および 30 分のバーンレートが共に 6 倍(エラー率 6%)を超過", STAGED)
t("KubeAPIErrorBudgetBurn|warning|long=1d,short=2h", _burn,
  "1 日および 2 時間のバーンレートが共に 3 倍(エラー率 3%)を超過", STAGED)
t("KubeAPIErrorBudgetBurn|warning|long=3d,short=6h", _burn,
  "3 日および 6 時間のバーンレートが共に 1 倍(エラー率 1%)を超過",
  "最長ウィンドウ(緩やかな消費)。" + STAGED)

# --- kube-state-metrics -------------------------------------------------------
t("KubeStateMetricsListErrors", "kube-state-metrics の list 操作エラー率",
  "直近 5 分間の list 操作エラー率が 1% を超過")
t("KubeStateMetricsWatchErrors", "kube-state-metrics の watch 操作エラー率",
  "直近 5 分間の watch 操作エラー率が 1% を超過")
t("KubeStateMetricsShardingMismatch", "kube-state-metrics シャーディング設定の整合性",
  "シャード総数の分散(stdvar)が 0 でない(インスタンス間でシャード数設定が不一致)")
t("KubeStateMetricsShardsMissing", "kube-state-metrics シャードの欠落",
  "期待されるシャード序数の集合と実際に稼働しているシャードの集合が一致しない")

# --- kubernetes-apps ----------------------------------------------------------
t("KubePodCrashLooping", "Pod コンテナのクラッシュループ",
  "直近 5 分間でコンテナの waiting 理由が CrashLoopBackOff になっている")
t("KubePodNotReady", "Pod の Ready 状態",
  "Pod が Pending/Unknown、または Running だが Ready でない状態(Job 管理下・SchedulingGated の Pod は除外)")
t("KubeDeploymentGenerationMismatch", "Deployment の世代(generation)整合性",
  "observed_generation != metadata_generation(コントローラが最新の spec を反映できていない)")
t("KubeDeploymentReplicasMismatch", "Deployment のレプリカ数",
  "spec.replicas > available レプリカ数、かつ直近 10 分間で updated レプリカ数に変化がない")
t("KubeDeploymentRolloutStuck", "Deployment のロールアウト進行",
  "Progressing 条件が false(ロールアウトが進行していない)")
t("KubeStatefulSetReplicasMismatch", "StatefulSet のレプリカ数",
  "ready レプリカ数 != spec.replicas、かつ直近 10 分間で updated レプリカ数に変化がない")
t("KubeStatefulSetGenerationMismatch", "StatefulSet の世代(generation)整合性",
  "observed_generation != metadata_generation(コントローラが最新の spec を反映できていない)")
t("KubeStatefulSetUpdateNotRolledOut", "StatefulSet の更新ロールアウト",
  "current revision と update revision が異なり、replicas != updated レプリカ数、かつ直近 5 分間で updated 数に変化がない")
t("KubeDaemonSetRolloutStuck", "DaemonSet のロールアウト進行",
  "current/updated/available スケジュール数が desired と不一致、または misscheduled が 0 でない状態が、直近 5 分間 updated 数の変化なしで継続")
t("KubeContainerWaiting", "Pod コンテナの起動待ち状態",
  "コンテナが waiting 状態(CrashLoopBackOff 以外の理由: ImagePullBackOff, ContainerCreating 等)")
t("KubeDaemonSetNotScheduled", "DaemonSet Pod の未スケジュール",
  "desired スケジュール数 - current スケジュール数 > 0(配置されるべきノードに Pod が無い)")
t("KubeDaemonSetMisScheduled", "DaemonSet Pod の誤スケジュール",
  "misscheduled 数 > 0(配置されるべきでないノードで Pod が動作)")
t("KubeJobNotCompleted", "Job の実行時間超過",
  "active な Job の開始からの経過時間が 43200 秒(12 時間)を超過", IMMEDIATE)
t("KubeJobFailed", "Job の失敗", "kube_job_failed > 0(Failed 状態の Job が存在)")
t("KubeHpaReplicasMismatch", "HPA の desired と current レプリカ数の乖離",
  "desired != current、current が min より大きく max より小さい、かつ直近 15 分間 current に変化がない")
t("KubeHpaMaxedOut", "HPA の最大レプリカ数到達",
  "current レプリカ数 == max レプリカ数(min != max の HPA のみ)")
t("KubePdbNotEnoughHealthyPods", "PodDisruptionBudget の健全 Pod 数",
  "desired_healthy - current_healthy > 0(PDB が要求する健全 Pod 数を満たしていない)")

# --- kubernetes-resources -----------------------------------------------------
t("KubeCPUOvercommit", "クラスタ全体の CPU requests オーバーコミット",
  "Pod の CPU requests 合計が、ノードの allocatable CPU 合計(HA 構成: control-plane 3 台以上ではノード 1 台分を差し引いた値)を超過")
t("KubeMemoryOvercommit", "クラスタ全体のメモリ requests オーバーコミット",
  "Pod のメモリ requests 合計が、ノードの allocatable メモリ合計(HA 構成: control-plane 3 台以上ではノード 1 台分を差し引いた値)を超過")
t("KubeCPUQuotaOvercommit", "ResourceQuota(CPU)の割当過多",
  "全 namespace の CPU ハードクォータ合計 / ノード allocatable CPU 合計 が 1.5 を超過")
t("KubeMemoryQuotaOvercommit", "ResourceQuota(メモリ)の割当過多",
  "全 namespace のメモリ ハードクォータ合計 / ノード allocatable メモリ合計 が 1.5 を超過")
t("KubeQuotaAlmostFull", "namespace ResourceQuota の使用率",
  "used / hard が 90% 超過かつ 100% 未満")
t("KubeQuotaFullyUsed", "namespace ResourceQuota の使用率", "used / hard が 100%(ちょうど上限)")
t("KubeQuotaExceeded", "namespace ResourceQuota の超過", "used / hard が 100% を超過")
t("CPUThrottlingHigh", "コンテナの CPU スロットリング率",
  "直近 5 分間で CFS スロットリングされた期間の割合が 25% を超過(CPU limits による制限)")

# --- kubernetes-storage -------------------------------------------------------
_pv_note = "ReadOnlyMany の PVC、および label excluded_from_alerts=true の PVC は除外。" + STAGED
t("KubePersistentVolumeFillingUp|critical", "PersistentVolume の空き容量",
  "空き容量 / 総容量 が 3% 未満、かつ使用量 > 0", _pv_note)
t("KubePersistentVolumeFillingUp|warning", "PersistentVolume の空き容量(枯渇予測)",
  "空き容量 / 総容量 が 15% 未満、かつ直近 6 時間の傾向から 4 日以内に空き容量が 0 になると線形予測", _pv_note)
t("KubePersistentVolumeInodesFillingUp|critical", "PersistentVolume の空き inode",
  "空き inode / 総 inode が 3% 未満、かつ使用 inode > 0", _pv_note)
t("KubePersistentVolumeInodesFillingUp|warning", "PersistentVolume の空き inode(枯渇予測)",
  "空き inode / 総 inode が 15% 未満、かつ直近 6 時間の傾向から 4 日以内に空き inode が 0 になると線形予測", _pv_note)
t("KubePersistentVolumeErrors", "PersistentVolume のプロビジョニング状態",
  "phase が Failed または Pending の PV が存在")

# --- kubernetes-system --------------------------------------------------------
t("KubeVersionMismatch", "Kubernetes コンポーネント間のバージョン整合性",
  "クラスタ内で稼働する Kubernetes コンポーネントのマイナーバージョン(vX.Y)が 2 種類以上(kube-dns/coredns は除外)")
t("KubeClientErrors", "Kubernetes API クライアントのエラー率",
  "直近 5 分間の API リクエストのうち 5xx 応答の割合が 1% を超過")

# --- kubernetes-system-apiserver ----------------------------------------------
t("KubeClientCertificateExpiration|warning", "API サーバに接続するクライアント証明書の有効期限",
  "クライアント証明書の残存有効期間(1 パーセンタイル)が 604800 秒(7 日)未満", STAGED)
t("KubeClientCertificateExpiration|critical", "API サーバに接続するクライアント証明書の有効期限",
  "クライアント証明書の残存有効期間(1 パーセンタイル)が 86400 秒(24 時間)未満", STAGED)
t("KubeAggregatedAPIErrors", "Aggregated API(APIService)のエラー",
  "直近 1 分間で APIService の unavailable 遷移回数の増分が 0 より大きい")
t("KubeAggregatedAPIDown", "Aggregated API(APIService)の可用性",
  "直近 10 分間の APIService 可用率が 85% 未満")
t("KubeAPIDown", "kube-apiserver のスクレイプ対象存在",
  "job=apiserver の up メトリクスが存在しない(全インスタンスがターゲット検出から消失)")
t("KubeAPIInstanceUnreachable", "kube-apiserver 個別インスタンスの到達性",
  "up{job=apiserver} == 0(特定インスタンスがスクレイプ不可)")
t("KubeAPITerminatedRequests", "kube-apiserver のリクエスト強制終了率",
  "直近 10 分間で強制終了(terminated)されたリクエストの割合が 20% を超過(過負荷保護 APF による切断等)")

# --- controller-manager / kube-proxy / scheduler -------------------------------
t("KubeControllerManagerDown", "kube-controller-manager のスクレイプ対象存在",
  "job=kube-controller-manager の up メトリクスが存在しない")
t("KubeControllerManagerInstanceUnreachable", "kube-controller-manager 個別インスタンスの到達性",
  "up{job=kube-controller-manager} == 0")
t("KubeProxyDown", "kube-proxy のスクレイプ対象存在", "job=kube-proxy の up メトリクスが存在しない")
t("KubeProxyInstanceUnreachable", "kube-proxy 個別インスタンスの到達性", "up{job=kube-proxy} == 0")
t("KubeSchedulerDown", "kube-scheduler のスクレイプ対象存在", "job=kube-scheduler の up メトリクスが存在しない")
t("KubeSchedulerInstanceUnreachable", "kube-scheduler 個別インスタンスの到達性", "up{job=kube-scheduler} == 0")

# --- kubernetes-system-kubelet ------------------------------------------------
t("KubeNodeNotReady", "ノードの Ready 状態",
  "Ready 条件が true でない(NotReady)、かつ unschedulable(cordon)されていないノード")
t("KubeNodePressure", "ノードのリソース圧迫(Pressure)状態",
  "MemoryPressure / DiskPressure / PIDPressure のいずれかが true、かつ cordon されていないノード")
t("KubeNodeUnreachable", "ノードの到達性(unreachable taint)",
  "node.kubernetes.io/unreachable:NoSchedule taint が付与されている(Cluster Autoscaler やスポット終了による削除予定ノードは除外)")
t("KubeletTooManyPods", "kubelet の Pod 数上限到達",
  "ノードで稼働中の Pod 数 / ノードの Pod 容量(capacity) が 95% を超過")
t("KubeNodeReadinessFlapping", "ノード Ready 状態のフラッピング",
  "直近 15 分間で Ready 条件の変化回数が 2 回を超過、かつ cordon されていないノード")
t("KubeNodeEviction", "ノードによる Pod の evict(退避)",
  "直近 15 分間の evict 発生レートが 0 より大きい(eviction_signal 別)", "for: 0s のため即時発報。")
t("KubeletPlegDurationHigh", "kubelet PLEG(Pod Lifecycle Event Generator)の relist 時間",
  "PLEG relist 時間の 99 パーセンタイルが 10 秒以上")
t("KubeletPodStartUpLatencyHigh", "kubelet の Pod 起動レイテンシ",
  "直近 5 分間の Pod worker 処理時間の 99 パーセンタイルが 60 秒を超過")
t("KubeletClientCertificateExpiration|warning", "kubelet クライアント証明書の有効期限",
  "残存有効期間が 604800 秒(7 日)未満", IMMEDIATE + STAGED)
t("KubeletClientCertificateExpiration|critical", "kubelet クライアント証明書の有効期限",
  "残存有効期間が 86400 秒(24 時間)未満", IMMEDIATE + STAGED)
t("KubeletServerCertificateExpiration|warning", "kubelet サーバ証明書の有効期限",
  "残存有効期間が 604800 秒(7 日)未満", IMMEDIATE + STAGED)
t("KubeletServerCertificateExpiration|critical", "kubelet サーバ証明書の有効期限",
  "残存有効期間が 86400 秒(24 時間)未満", IMMEDIATE + STAGED)
t("KubeletClientCertificateRenewalErrors", "kubelet クライアント証明書の更新失敗",
  "直近 5 分間で証明書更新エラーの増分が 0 より大きい")
t("KubeletServerCertificateRenewalErrors", "kubelet サーバ証明書の更新失敗",
  "直近 5 分間で証明書更新エラーの増分が 0 より大きい")
t("KubeletInstanceUnreachable", "kubelet 個別インスタンスの到達性", "up{job=kubelet} == 0")
t("KubeletDown", "kubelet のスクレイプ対象存在",
  "ノードが存在する(kube_node_info)のに、up == 1 の kubelet ターゲットが 1 つも無い")

# --- node-exporter -------------------------------------------------------------
_fs_note = "読み取り専用でマウントされたファイルシステムは除外。" + STAGED
t("NodeFilesystemSpaceFillingUp|warning", "ノード ファイルシステムの空き容量(枯渇予測)",
  "空き容量が 15% 未満、かつ直近 6 時間の傾向から 24 時間以内に空き容量が 0 になると線形予測", _fs_note)
t("NodeFilesystemSpaceFillingUp|critical", "ノード ファイルシステムの空き容量(枯渇予測)",
  "空き容量が 10% 未満、かつ直近 6 時間の傾向から 4 時間以内に空き容量が 0 になると線形予測", _fs_note)
t("NodeFilesystemAlmostOutOfSpace|warning", "ノード ファイルシステムの空き容量", "空き容量が 5% 未満", _fs_note)
t("NodeFilesystemAlmostOutOfSpace|critical", "ノード ファイルシステムの空き容量", "空き容量が 3% 未満", _fs_note)
t("NodeFilesystemFilesFillingUp|warning", "ノード ファイルシステムの空き inode(枯渇予測)",
  "空き inode が 40% 未満、かつ直近 6 時間の傾向から 24 時間以内に空き inode が 0 になると線形予測", _fs_note)
t("NodeFilesystemFilesFillingUp|critical", "ノード ファイルシステムの空き inode(枯渇予測)",
  "空き inode が 20% 未満、かつ直近 6 時間の傾向から 4 時間以内に空き inode が 0 になると線形予測", _fs_note)
t("NodeFilesystemAlmostOutOfFiles|warning", "ノード ファイルシステムの空き inode", "空き inode が 5% 未満", _fs_note)
t("NodeFilesystemAlmostOutOfFiles|critical", "ノード ファイルシステムの空き inode", "空き inode が 3% 未満", _fs_note)
t("NodeNetworkReceiveErrs", "ノード NIC の受信エラー率",
  "直近 2 分間の受信エラー数 / 受信パケット数 が 1% を超過")
t("NodeNetworkTransmitErrs", "ノード NIC の送信エラー率",
  "直近 2 分間の送信エラー数 / 送信パケット数 が 1% を超過")
t("NodeHighNumberConntrackEntriesUsed", "ノードの conntrack テーブル使用率",
  "conntrack エントリ数 / 上限 が 75% を超過", IMMEDIATE)
t("NodeTextFileCollectorScrapeError", "node-exporter textfile コレクタの読み取り",
  "node_textfile_scrape_error == 1(textfile コレクタの読み取り失敗)", IMMEDIATE)
t("NodeClockSkewDetected", "ノードの時刻ずれ",
  "NTP オフセットが +0.05 秒超で拡大傾向、または -0.05 秒未満で拡大傾向(直近 5 分の微分で判定)")
t("NodeClockNotSynchronising", "ノードの時刻同期状態",
  "直近 5 分間 NTP 同期状態が 0(未同期)、かつ最大誤差が 16 秒以上")
t("NodeRAIDDegraded", "ソフトウェア RAID(md)の縮退",
  "必要ディスク数 - active ディスク数 > 0(RAID アレイが縮退状態)")
t("NodeRAIDDiskFailure", "ソフトウェア RAID(md)のディスク故障",
  "state=failed のディスク数 > 0", IMMEDIATE)
t("NodeFileDescriptorLimit|warning", "ノード(カーネル)のファイルディスクリプタ使用率",
  "割当済み FD 数 / 上限 が 70% を超過", STAGED)
t("NodeFileDescriptorLimit|critical", "ノード(カーネル)のファイルディスクリプタ使用率",
  "割当済み FD 数 / 上限 が 90% を超過", STAGED)
t("NodeCPUHighUsage", "ノードの CPU 使用率",
  "直近 2 分間の CPU 使用率(idle/iowait 以外の合計)が 90% を超過")
t("NodeSystemSaturation", "ノードのロードアベレージ(コアあたり)",
  "load1 / CPU コア数 が 2 を超過")
t("NodeMemoryMajorPagesFaults", "ノードのメジャーページフォールト発生率",
  "直近 5 分間のメジャーページフォールトが 500 回/秒 を超過")
t("NodeMemoryHighUtilization", "ノードのメモリ使用率",
  "100 - (MemAvailable / MemTotal * 100) が 90% を超過")
t("NodeDiskIOSaturation", "ノードのディスク I/O キュー滞留",
  "直近 5 分間の加重 I/O 時間(io_time_weighted)のレートが 10 を超過(平均キュー長 10 相当)")
t("NodeSystemdServiceFailed", "ノード systemd サービスの failed 状態",
  "state=failed の systemd ユニットが存在")
t("NodeSystemdServiceCrashlooping", "ノード systemd サービスの再起動繰り返し",
  "直近 5 分間のサービス再起動回数の増分が 2 回を超過")
t("NodeBondingDegraded", "ノード bonding インターフェースの縮退",
  "bonding のスレーブ NIC 数 - active NIC 数 != 0")

# --- node-network -------------------------------------------------------------
t("NodeNetworkInterfaceFlapping", "ノード NIC のリンク状態フラッピング",
  "直近 2 分間で NIC の up/down 変化回数が 2 回を超過(veth を除く)")

# --- prometheus ---------------------------------------------------------------
t("PrometheusBadConfig", "Prometheus の設定リロード成否",
  "直近 5 分間の設定リロードが一度も成功していない(prometheus_config_last_reload_successful == 0)")
t("PrometheusSDRefreshFailure", "Prometheus サービスディスカバリの更新失敗",
  "直近 10 分間で SD リフレッシュ失敗の増分が 0 より大きい")
t("PrometheusKubernetesListWatchFailures", "Prometheus Kubernetes SD の list/watch 失敗",
  "直近 5 分間で Kubernetes SD の失敗数の増分が 0 より大きい")
t("PrometheusNotificationQueueRunningFull", "Prometheus アラート通知キューの残量",
  "直近 5 分間の傾向から 30 分以内に通知キュー長がキュー容量を超過すると線形予測")
t("PrometheusErrorSendingAlertsToSomeAlertmanagers", "Prometheus→特定 Alertmanager へのアラート送信エラー率",
  "直近 5 分間の送信エラー率が 1% を超過(Alertmanager 個別)")
t("PrometheusNotConnectedToAlertmanagers", "Prometheus の Alertmanager 接続",
  "直近 5 分間で検出された Alertmanager 数が 1 未満(接続先なし)")
t("PrometheusTSDBReloadsFailing", "Prometheus TSDB ブロックのリロード失敗",
  "直近 3 時間で TSDB リロード失敗の増分が 0 より大きい")
t("PrometheusTSDBCompactionsFailing", "Prometheus TSDB のコンパクション失敗",
  "直近 3 時間で TSDB コンパクション失敗の増分が 0 より大きい")
t("PrometheusNotIngestingSamples", "Prometheus のサンプル取り込み",
  "直近 5 分間の head へのサンプル追加レートが 0 以下、かつスクレイプ対象またはルールが 1 つ以上設定されている")
t("PrometheusDuplicateTimestamps", "Prometheus の重複タイムスタンプ サンプル破棄",
  "直近 5 分間で重複タイムスタンプにより破棄されたサンプルのレートが 0 より大きい")
t("PrometheusOutOfOrderTimestamps", "Prometheus の順序不正タイムスタンプ サンプル破棄",
  "直近 5 分間で順序不正により破棄されたサンプルのレートが 0 より大きい")
t("PrometheusRemoteStorageFailures", "Prometheus リモートストレージ送信の失敗率",
  "直近 5 分間のリモート書き込み失敗サンプル率が 1% を超過", "remote_write 未設定の環境では発報しない。")
t("PrometheusRemoteWriteBehind", "Prometheus リモート書き込みの遅延",
  "キュー内の最新サンプル時刻と送信済み最新サンプル時刻の差が 120 秒を超過", "remote_write 未設定の環境では発報しない。")
t("PrometheusRemoteWriteDesiredShards", "Prometheus リモート書き込みのシャード数不足",
  "必要シャード数(desired)が設定上の最大シャード数(max)を超過", "remote_write 未設定の環境では発報しない。")
t("PrometheusRuleFailures", "Prometheus ルール評価の失敗",
  "直近 5 分間でルール評価失敗の増分が 0 より大きい")
t("PrometheusMissingRuleEvaluations", "Prometheus ルール評価のスキップ",
  "直近 5 分間でルールグループ評価の取りこぼし(iterations_missed)の増分が 0 より大きい")
t("PrometheusTargetLimitHit", "Prometheus ターゲット数上限超過",
  "直近 5 分間でターゲット数上限(target_limit)超過によりドロップされた回数の増分が 0 より大きい")
t("PrometheusLabelLimitHit", "Prometheus ラベル数上限超過",
  "直近 5 分間でラベル数上限(label_limit 等)超過によりドロップされた回数の増分が 0 より大きい")
t("PrometheusScrapeBodySizeLimitHit", "Prometheus スクレイプ応答サイズ上限超過",
  "直近 5 分間で body_size_limit 超過により失敗したスクレイプの増分が 0 より大きい")
t("PrometheusScrapeSampleLimitHit", "Prometheus スクレイプ サンプル数上限超過",
  "直近 5 分間で sample_limit 超過により失敗したスクレイプの増分が 0 より大きい")
t("PrometheusTargetSyncFailure", "Prometheus ターゲット同期の失敗",
  "直近 30 分間でターゲット同期失敗の増分が 0 より大きい")
t("PrometheusHighQueryLoad", "Prometheus の同時クエリ負荷",
  "直近 5 分間の平均同時実行クエリ数 / 最大同時実行数 が 80% を超過")
t("PrometheusErrorSendingAlertsToAnyAlertmanager", "Prometheus→全 Alertmanager へのアラート送信エラー率",
  "全 Alertmanager に対する直近 5 分間の送信エラー率の最小値が 3% を超過(どの Alertmanager にも正常に送れていない)")

# --- prometheus-operator ------------------------------------------------------
t("PrometheusOperatorListErrors", "Prometheus Operator の list 操作エラー率",
  "直近 10 分間の list 操作失敗率が 40% を超過(コントローラ別)")
t("PrometheusOperatorWatchErrors", "Prometheus Operator の watch 操作エラー率",
  "直近 5 分間の watch 操作失敗率が 40% を超過(コントローラ別)")
t("PrometheusOperatorSyncFailed", "Prometheus Operator の reconcile 失敗",
  "直近 5 分間で status=failed の同期件数の最小値が 0 より大きい(直前の reconcile が失敗)")
t("PrometheusOperatorReconcileErrors", "Prometheus Operator の reconcile エラー率",
  "直近 5 分間の reconcile エラー率が 10% を超過(コントローラ別)")
t("PrometheusOperatorStatusUpdateErrors", "Prometheus Operator のステータス更新エラー率",
  "直近 5 分間のステータス更新エラー率が 10% を超過(コントローラ別)")
t("PrometheusOperatorNodeLookupErrors", "Prometheus Operator のノードアドレス解決エラー",
  "直近 5 分間のノードアドレス解決エラーのレートが 0.1/秒 を超過")
t("PrometheusOperatorNotReady", "Prometheus Operator の Ready 状態",
  "直近 5 分間で prometheus_operator_ready が 0(Ready でない)")
t("PrometheusOperatorRejectedResources", "Prometheus Operator に拒否されたリソース",
  "直近 5 分間で state=rejected の管理対象リソース数の最小値が 0 より大きい(不正な CR が存在)")


# ---------------------------------------------------------------------------
def duration_ja(d):
    """'10m' -> '10分' 等。"""
    if d is None:
        return "即時(for 未設定)"
    m = re.fullmatch(r"(\d+)([smhd])", d)
    if not m:
        return d
    n, u = int(m.group(1)), m.group(2)
    if n == 0:
        return f"{d}(即時)"
    unit = {"s": "秒", "m": "分", "h": "時間", "d": "日"}[u]
    return f"{d}({n}{unit})"


def load_alerts(path):
    with open(path, encoding="utf-8") as f:
        doc = yaml.safe_load(f)
    items = doc["items"] if doc.get("kind") == "List" or "items" in doc else [doc]
    rows = []
    for it in items:
        rule_file = it["metadata"]["name"]
        for g in it["spec"]["groups"]:
            for r in g.get("rules", []):
                if "alert" not in r:
                    continue
                labels = dict(r.get("labels", {}))
                sev = labels.pop("severity", "")
                extra = ",".join(f"{k}={v}" for k, v in sorted(labels.items()))
                ann = r.get("annotations", {})
                rows.append({
                    "rule_file": rule_file,
                    "group": g["name"],
                    "alert": r["alert"],
                    "severity": sev,
                    "for": r.get("for"),
                    "extra": extra,
                    "summary": (ann.get("summary") or "").strip(),
                    "description": (ann.get("description") or "").strip(),
                    "expr": r["expr"].strip(),
                    "runbook": ann.get("runbook_url", ""),
                })
    return rows, doc


def lookup(row):
    keys = [
        f"{row['alert']}|{row['severity']}|{row['extra']}",
        f"{row['alert']}|{row['severity']}",
        row["alert"],
    ]
    for k in keys:
        if k in TRANSLATIONS:
            return TRANSLATIONS[k]
    raise SystemExit(f"訳辞書に無いアラート: {keys[0]}")


def chart_info(doc):
    for it in doc["items"]:
        lb = it["metadata"].get("labels", {})
        if "chart" in lb:
            return lb["chart"], it["metadata"].get("creationTimestamp", ""), it["metadata"].get("namespace", "")
    return "", "", ""


# ---------------------------------------------------------------------------
THIN = Side(style="thin", color="BFBFBF")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
HEADER_FILL = PatternFill("solid", fgColor="1F4E78")
HEADER_FONT = Font(name=FONT_NAME, bold=True, color="FFFFFF", size=10)
BODY_FONT = Font(name=FONT_NAME, size=10)
MONO_FONT = Font(name="Consolas", size=9)
LINK_FONT = Font(name=FONT_NAME, size=9, color="0563C1", underline="single")
SEV_STYLE = {
    "critical": (PatternFill("solid", fgColor="FFC7CE"), Font(name=FONT_NAME, size=10, bold=True, color="9C0006")),
    "warning": (PatternFill("solid", fgColor="FFEB9C"), Font(name=FONT_NAME, size=10, bold=True, color="9C5700")),
    "info": (PatternFill("solid", fgColor="DDEBF7"), Font(name=FONT_NAME, size=10, bold=True, color="1F4E78")),
    "none": (PatternFill("solid", fgColor="E7E6E6"), Font(name=FONT_NAME, size=10, bold=True, color="595959")),
}
SEV_ORDER = ["critical", "warning", "info", "none"]

MAIN_SHEET = "監視項目一覧"
MAIN_COLUMNS = [
    # (ヘッダ, 幅)
    ("No.", 6),
    ("カテゴリ(ルールグループ)", 24),
    ("対象コンポーネント", 26),
    ("アラート名", 38),
    ("重要度\n(severity)", 11),
    ("監視内容", 40),
    ("発報条件・閾値", 60),
    ("継続時間\n(for)", 14),
    ("追加ラベル", 16),
    ("Summary(原文)", 40),
    ("Description(原文)", 50),
    ("PromQL(expr)", 70),
    ("Runbook URL", 40),
    ("備考", 45),
]


def write_header(ws, row, columns):
    for c, (name, width) in enumerate(columns, start=1):
        cell = ws.cell(row=row, column=c, value=name)
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL
        cell.border = BORDER
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        ws.column_dimensions[get_column_letter(c)].width = width
    ws.row_dimensions[row].height = 30


def build_main(wb, rows):
    ws = wb.active
    ws.title = MAIN_SHEET
    write_header(ws, 1, MAIN_COLUMNS)
    for i, r in enumerate(rows, start=1):
        what, cond, note = lookup(r)
        rr = i + 1
        values = [
            i,
            r["group"],
            COMPONENT_BY_GROUP.get(r["group"], r["group"]),
            r["alert"],
            r["severity"],
            what,
            cond,
            duration_ja(r["for"]),
            r["extra"],
            r["summary"],
            r["description"],
            r["expr"],
            r["runbook"],
            note,
        ]
        for c, v in enumerate(values, start=1):
            cell = ws.cell(row=rr, column=c, value=v)
            cell.font = BODY_FONT
            cell.border = BORDER
            cell.alignment = Alignment(vertical="top", wrap_text=True)
        ws.cell(row=rr, column=1).alignment = Alignment(horizontal="center", vertical="top")
        ws.cell(row=rr, column=5).alignment = Alignment(horizontal="center", vertical="top")
        ws.cell(row=rr, column=8).alignment = Alignment(horizontal="center", vertical="top")
        fill, font = SEV_STYLE[r["severity"]]
        ws.cell(row=rr, column=5).fill = fill
        ws.cell(row=rr, column=5).font = font
        ws.cell(row=rr, column=12).font = MONO_FONT
        link = ws.cell(row=rr, column=13)
        if r["runbook"]:
            link.hyperlink = r["runbook"]
            link.font = LINK_FONT
    last = len(rows) + 1
    ws.freeze_panes = "E2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(MAIN_COLUMNS))}{last}"
    ws.sheet_view.zoomScale = 90
    ws.print_title_rows = "1:1"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    return last


def build_summary(wb, rows, last_row):
    ws = wb.create_sheet("サマリ")
    ws.column_dimensions["A"].width = 30
    for col in "BCDEF":
        ws.column_dimensions[col].width = 12
    sev_rng = f"'{MAIN_SHEET}'!$E$2:$E${last_row}"
    grp_rng = f"'{MAIN_SHEET}'!$B$2:$B${last_row}"
    for_rng = f"'{MAIN_SHEET}'!$H$2:$H${last_row}"

    def hdr(r, values):
        for c, v in enumerate(values, start=1):
            cell = ws.cell(row=r, column=c, value=v)
            cell.font = HEADER_FONT
            cell.fill = HEADER_FILL
            cell.border = BORDER
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    def body(r, c, v, center=False, bold=False):
        cell = ws.cell(row=r, column=c, value=v)
        cell.font = Font(name=FONT_NAME, size=10, bold=bold)
        cell.border = BORDER
        cell.alignment = Alignment(horizontal="center" if center else "left", vertical="center")
        return cell

    ws["A1"] = "監視項目サマリ(「監視項目一覧」シートから数式で集計)"
    ws["A1"].font = Font(name=FONT_NAME, size=12, bold=True)

    # 1. severity 別
    r = 3
    hdr(r, ["重要度 (severity)", "件数"])
    for i, sev in enumerate(SEV_ORDER):
        rr = r + 1 + i
        c = body(rr, 1, sev, center=True, bold=True)
        c.fill, c.font = SEV_STYLE[sev]
        body(rr, 2, f'=COUNTIF({sev_rng},"{sev}")', center=True)
    rr = r + 1 + len(SEV_ORDER)
    body(rr, 1, "合計", bold=True)
    body(rr, 2, f"=SUM(B{r + 1}:B{rr - 1})", center=True, bold=True)

    # 2. カテゴリ × severity
    r = rr + 3
    hdr(r, ["カテゴリ(ルールグループ)"] + SEV_ORDER + ["合計"])
    groups = []
    for x in rows:
        if x["group"] not in groups:
            groups.append(x["group"])
    for i, g in enumerate(groups):
        rr = r + 1 + i
        body(rr, 1, g)
        for j, sev in enumerate(SEV_ORDER):
            body(rr, 2 + j, f'=COUNTIFS({grp_rng},$A{rr},{sev_rng},"{sev}")', center=True)
        body(rr, 6, f"=SUM(B{rr}:E{rr})", center=True, bold=True)
    rr = r + 1 + len(groups)
    body(rr, 1, "合計", bold=True)
    for j in range(5):
        col = get_column_letter(2 + j)
        body(rr, 2 + j, f"=SUM({col}{r + 1}:{col}{rr - 1})", center=True, bold=True)

    # 3. for 別
    r = rr + 3
    hdr(r, ["継続時間 (for)", "件数"])
    fors = []
    for x in rows:
        v = duration_ja(x["for"])
        if v not in fors:
            fors.append(v)

    def sort_key(v):
        m = re.match(r"(\d+)([smhd])", v)
        if not m:
            return (-1, v)
        mult = {"s": 1, "m": 60, "h": 3600, "d": 86400}[m.group(2)]
        return (int(m.group(1)) * mult, v)

    fors.sort(key=sort_key)
    for i, v in enumerate(fors):
        rr = r + 1 + i
        body(rr, 1, v, center=True)
        body(rr, 2, f'=COUNTIF({for_rng},"{v}")', center=True)
    rr = r + 1 + len(fors)
    body(rr, 1, "合計", bold=True)
    body(rr, 2, f"=SUM(B{r + 1}:B{rr - 1})", center=True, bold=True)
    ws.sheet_view.showGridLines = False


def build_legend(wb, rows, doc):
    ws = wb.create_sheet("凡例・前提")
    ws.column_dimensions["A"].width = 28
    ws.column_dimensions["B"].width = 110
    chart, ts, ns = chart_info(doc)
    n_files = len(doc["items"])
    n_groups = sum(len(it["spec"]["groups"]) for it in doc["items"])
    n_records = sum(1 for it in doc["items"] for g in it["spec"]["groups"] for r in g.get("rules", []) if "record" in r)

    def title(r, text):
        c = ws.cell(row=r, column=1, value=text)
        c.font = Font(name=FONT_NAME, size=12, bold=True)

    def kv(r, k, v, fill=None, font=None):
        a = ws.cell(row=r, column=1, value=k)
        b = ws.cell(row=r, column=2, value=v)
        a.font = font or Font(name=FONT_NAME, size=10, bold=True)
        b.font = Font(name=FONT_NAME, size=10)
        for c in (a, b):
            c.border = BORDER
            c.alignment = Alignment(vertical="top", wrap_text=True)
        if fill:
            a.fill = fill

    r = 1
    title(r, "1. 出典・生成情報")
    r += 1
    for k, v in [
        ("入力ファイル", "kubectl get prometheusrules -n monitoring -o yaml の出力(docs/source/alert_definition.yaml)"),
        ("Helm chart", chart),
        ("namespace", ns),
        ("リソース作成日時(UTC)", ts),
        ("PrometheusRule 数", f"{n_files} 件 / ルールグループ {n_groups} 個"),
        ("アラートルール数", f"{len(rows)} 件(本一覧の対象)"),
        ("記録ルール数", f"{n_records} 件(record: ルール。アラートではないため本一覧の対象外)"),
        ("生成スクリプト", "tools/build_alert_sheet.py(日本語訳はスクリプト内の辞書で管理)"),
    ]:
        kv(r, k, v)
        r += 1

    r += 1
    title(r, "2. 重要度(severity)の目安")
    r += 1
    for sev, desc in [
        ("critical", "サービス影響が出ている、または差し迫っている。即時対応が必要。"),
        ("warning", "放置するとサービス影響につながる可能性がある。営業時間内に確認・対応。"),
        ("info", "情報通知。単独では対応不要だが、他アラートと併発した際の調査材料。標準構成では InfoInhibitor により warning/critical 併発時は抑止される。"),
        ("none", "通知用ではない制御用アラート(Watchdog: 死活確認、InfoInhibitor: 抑止制御)。Alertmanager では null receiver に送るのが標準。"),
    ]:
        fill, font = SEV_STYLE[sev]
        kv(r, sev, desc, fill=fill, font=font)
        r += 1

    r += 1
    title(r, "3. 列の読み方")
    r += 1
    for k, v in [
        ("発報条件・閾値", "PromQL(expr)を日本語で要約したもの。正確な条件は PromQL 列を正とする。"),
        ("継続時間 (for)", "「発報条件・閾値」の状態が for に指定した時間継続した時点で firing(発報)となる。"
                         "for が未設定または 0s の場合は条件成立と同時に発報する(pending 状態を経ない)。"),
        ("追加ラベル", "severity 以外にルールが付与するラベル。KubeAPIErrorBudgetBurn の long/short(評価ウィンドウ)など、同名アラートの区別に使う。"),
        ("同名アラート", "同じアラート名が複数行ある場合は、閾値の異なる段階アラート(例: warning=5% 未満 / critical=3% 未満)。"
                       "1 定義 = 1 行として全件を掲載している。"),
        ("Summary / Description(原文)", "ルール定義の annotations をそのまま転記。{{ $labels.xxx }} / {{ $value }} は発報時に実値へ置換されるテンプレート。"),
    ]:
        kv(r, k, v)
        r += 1

    r += 1
    title(r, "4. 通知経路に関する注記(Alertmanager)")
    r += 1
    for k, v in [
        ("基本の流れ", "Prometheus が firing と判定したアラートはすべて Alertmanager に送信される。"
                      "実際にメール等で通知されるかは Alertmanager 側の設定(route / receivers / inhibit_rules)で決まる。"),
        ("route と receiver", "Alertmanager の route ツリーで、アラートのラベル(severity、namespace、alertname 等)にマッチした receiver に配送される。"
                             "その receiver に email_configs が設定されていれば、その宛先にメールが送られる。"
                             "マッチしなければ既定 receiver に落ちる。kube-prometheus-stack の初期値では既定 receiver が 'null'(どこにも通知しない)。"),
        ("通知されないアラート", "Watchdog(severity=none)は null receiver へ送る route が初期値で入っている。InfoInhibitor も null receiver に送る前提の設計。"
                               "この 2 件は「一覧にはあるがメールは来ない」ことが正常。"),
        ("抑止(inhibit)", "初期値の inhibit_rules により、同一対象で critical が firing 中は warning/info を、warning が firing 中は info を抑止する。"
                         "また InfoInhibitor 発報中は同 namespace の info を抑止する。抑止されたアラートは通知されない。"),
        ("グループ化", "group_by / group_wait / group_interval / repeat_interval により複数アラートが 1 通のメールにまとめられる。"
                      "一覧の 1 行が必ず 1 通のメールに対応するわけではない。"),
        ("実設定の確認方法", "kubectl -n monitoring get secret alertmanager-monitoring-kube-prometheus-alertmanager-generated "
                            "-o jsonpath='{.data.alertmanager\\.yaml\\.gz}' | base64 -d | gunzip  "
                            "または Helm values の alertmanager.config / AlertmanagerConfig CR を参照。"),
    ]:
        kv(r, k, v)
        r += 1


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "docs/source/alert_definition.yaml"
    dst = sys.argv[2] if len(sys.argv) > 2 else "docs/k8s_alert_rules_parameter_sheet.xlsx"
    rows, doc = load_alerts(src)
    wb = Workbook()
    last = build_main(wb, rows)
    build_summary(wb, rows, last)
    build_legend(wb, rows, doc)
    # サマリシートの数式は Excel で開いた際に再計算させる(生成環境に Calc エンジンが無い場合の保険)
    wb.calculation.fullCalcOnLoad = True
    wb.save(dst)
    print(f"wrote {dst}: {len(rows)} alerts")


if __name__ == "__main__":
    main()
