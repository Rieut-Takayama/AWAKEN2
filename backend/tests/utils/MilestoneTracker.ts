/**
 * マイルストーントラッカー - ★9統合テスト成功請負人が活用する処理時間計測ユーティリティ
 * 
 * 統合テストの各段階での処理時間を計測し、パフォーマンス問題のデバッグを支援します。
 * ★9がテストのボトルネックを特定する際に重要な情報を提供します。
 */
export class MilestoneTracker {
  private milestones: Record<string, number> = {};
  private startTime: number = Date.now();
  private currentOp: string = '初期化';

  constructor(initialOperation: string = '統合テスト') {
    this.currentOp = initialOperation;
    console.log(`[${this.getElapsed()}] ▶️ 開始: ${initialOperation}`);
  }

  // 操作の設定
  setOperation(op: string): void {
    this.currentOp = op;
    console.log(`[${this.getElapsed()}] ▶️ 開始: ${op}`);
  }

  // マイルストーンの記録
  mark(name: string): void {
    this.milestones[name] = Date.now();
    console.log(`[${this.getElapsed()}] 🏁 ${name}`);
  }

  // エラーマーク（★9のデバッグで重要）
  markError(name: string, error?: any): void {
    this.milestones[`ERROR_${name}`] = Date.now();
    console.log(`[${this.getElapsed()}] ❌ エラー: ${name}`, error?.message || '');
  }

  // 警告マーク
  markWarning(name: string, details?: any): void {
    this.milestones[`WARN_${name}`] = Date.now();
    console.log(`[${this.getElapsed()}] ⚠️ 警告: ${name}`, details || '');
  }

  // 成功マーク
  markSuccess(name: string, details?: any): void {
    this.milestones[`SUCCESS_${name}`] = Date.now();
    console.log(`[${this.getElapsed()}] ✅ 成功: ${name}`, details || '');
  }

  // 結果表示（★9のデバッグで重要）
  summary(): void {
    console.log('\n--- 📊 処理時間分析 ---');
    const entries = Object.entries(this.milestones).sort((a, b) => a[1] - b[1]);

    if (entries.length === 0) {
      console.log('マイルストーンが記録されていません');
      console.log(`総実行時間: ${this.getElapsed()}\n`);
      return;
    }

    for (let i = 1; i < entries.length; i++) {
      const prev = entries[i-1];
      const curr = entries[i];
      const diff = (curr[1] - prev[1]) / 1000;
      
      // パフォーマンス警告の表示
      const perfIndicator = diff > 2 ? ' ⚠️ SLOW' : diff > 5 ? ' 🐌 VERY SLOW' : '';
      console.log(`${prev[0]} → ${curr[0]}: ${diff.toFixed(2)}秒${perfIndicator}`);
    }

    console.log(`総実行時間: ${this.getElapsed()}\n`);
    
    // パフォーマンス分析サマリー
    this.performanceAnalysis(entries);
  }

  // パフォーマンス分析（★9が活用）
  private performanceAnalysis(entries: [string, number][]): void {
    if (entries.length < 2) return;

    console.log('--- 🔍 パフォーマンス分析 ---');
    
    const durations = [];
    for (let i = 1; i < entries.length; i++) {
      const duration = (entries[i][1] - entries[i-1][1]) / 1000;
      durations.push({
        step: `${entries[i-1][0]} → ${entries[i][0]}`,
        duration
      });
    }

    // 最も時間のかかった処理
    const slowest = durations.reduce((max, curr) => curr.duration > max.duration ? curr : max);
    console.log(`最も時間のかかった処理: ${slowest.step} (${slowest.duration.toFixed(2)}秒)`);

    // 2秒以上の処理があれば警告
    const slowSteps = durations.filter(d => d.duration > 2);
    if (slowSteps.length > 0) {
      console.log('⚠️ 改善が必要な処理:');
      slowSteps.forEach(step => {
        console.log(`  - ${step.step}: ${step.duration.toFixed(2)}秒`);
      });
    }

    console.log('');
  }

  // 経過時間の取得
  private getElapsed(): string {
    return `${((Date.now() - this.startTime) / 1000).toFixed(2)}秒`;
  }

  // 現在の操作時間を取得（★9が活用）
  getCurrentOperationTime(): number {
    return Date.now() - this.startTime;
  }

  // 閾値チェック（★9がパフォーマンス監視で活用）
  checkThreshold(name: string, maxSeconds: number): boolean {
    const currentTime = this.getCurrentOperationTime() / 1000;
    if (currentTime > maxSeconds) {
      this.markWarning(`閾値超過_${name}`, `${currentTime.toFixed(2)}秒 > ${maxSeconds}秒`);
      return false;
    }
    return true;
  }

  // 統計情報の取得（★9がレポート作成で活用）
  getStats(): {
    totalTime: number;
    milestoneCount: number;
    averageStepTime: number;
    slowestStep: { name: string; duration: number } | null;
  } {
    const totalTime = this.getCurrentOperationTime();
    const milestoneCount = Object.keys(this.milestones).length;
    
    const entries = Object.entries(this.milestones).sort((a, b) => a[1] - b[1]);
    let averageStepTime = 0;
    let slowestStep = null;

    if (entries.length > 1) {
      const durations = [];
      for (let i = 1; i < entries.length; i++) {
        const duration = entries[i][1] - entries[i-1][1];
        durations.push({ name: entries[i][0], duration });
      }
      
      averageStepTime = durations.reduce((sum, d) => sum + d.duration, 0) / durations.length;
      slowestStep = durations.reduce((max, curr) => curr.duration > max.duration ? curr : max);
    }

    return {
      totalTime,
      milestoneCount,
      averageStepTime,
      slowestStep
    };
  }
}