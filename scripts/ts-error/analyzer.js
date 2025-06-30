const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// タスク管理
const tasksPath = path.join(__dirname, 'tasks.json');
const logsDir = path.join(__dirname, 'logs');

// ローカル時間でのタイムスタンプ生成
const getLocalTimestamp = () => new Date().toLocaleString();

// 初期化
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

if (!fs.existsSync(tasksPath)) {
  fs.writeFileSync(tasksPath, JSON.stringify({
    updated: getLocalTimestamp(),
    working: {}
  }, null, 2));
}

// tasks.json読み込みと25分ルールチェック
const checkTasksStatus = () => {
  const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
  const now = Date.now();

  for (const [agent, task] of Object.entries(tasks.working)) {
    const elapsed = now - new Date(task.startedAt).getTime();
    if (elapsed > 25 * 60 * 1000) { // 25分
      console.log(`⚠️  警告: ${agent}の作業が25分を超過しています`);
      console.log(`   → ${task.error}は放棄されたとみなされます`);
    }
  }
  
  return tasks;
};

// 設定エラー耐性チェック
const performRobustCheck = (command) => {
  try {
    execSync(command, { encoding: 'utf8' });
    return { success: true, errors: [] };
  } catch (error) {
    const output = error.stdout || error.stderr || '';

    // 設定エラーを検出しつつエラーを抽出
    if (output.includes('is not under \'rootDir\'') || output.includes('TS6059')) {
      console.log('⚠️  設定問題を検出 - エラー抽出を継続');
    }

    return { success: false, output };
  }
};

// TypeScriptエラーの解析
const parseTypeScriptErrors = (output) => {
  const errors = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    // TypeScriptエラー形式: path(line,col): error TS####: message
    const match = line.match(/^(.+?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)$/);
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5]
      });
    }
  }
  
  return errors;
};

// メイン処理
console.log('🔍 TypeScriptエラー分析を開始します...\n');

// 作業中タスクの確認
const tasks = checkTasksStatus();
console.log('📋 作業中のタスク:');
if (Object.keys(tasks.working).length === 0) {
  console.log('   なし');
} else {
  for (const [agent, task] of Object.entries(tasks.working)) {
    console.log(`   - ${agent}: ${task.error} (開始: ${task.startedAt})`);
  }
}
console.log('');

// 各プロジェクトのエラーチェック
const projects = [
  { name: 'Backend', dir: 'backend', tsconfig: 'tsconfig.json' },
  { name: 'Frontend', dir: 'frontend', tsconfig: 'tsconfig.app.json' }
];

const allErrors = [];
let totalErrors = 0;

for (const project of projects) {
  const projectPath = path.join(process.cwd(), project.dir);
  
  // tsconfigの存在確認
  const tsconfigPath = path.join(projectPath, project.tsconfig);
  if (!fs.existsSync(tsconfigPath)) {
    // フロントエンドでtsconfig.app.jsonがない場合はtsconfig.jsonを試す
    if (project.name === 'Frontend') {
      project.tsconfig = 'tsconfig.json';
    }
  }
  
  console.log(`\n📦 ${project.name} エラーチェック中...`);
  
  const command = `cd ${project.dir} && npx tsc --noEmit -p ${project.tsconfig}`;
  const result = performRobustCheck(command);
  
  if (!result.success) {
    const errors = parseTypeScriptErrors(result.output);
    const projectErrors = errors.map(err => ({
      ...err,
      project: project.name.toLowerCase(),
      file: path.join(project.dir, err.file)
    }));
    
    allErrors.push(...projectErrors);
    totalErrors += projectErrors.length;
    
    console.log(`   ❌ ${projectErrors.length}個のエラーを検出`);
  } else {
    console.log(`   ✅ エラーなし`);
  }
}

// 型定義ファイルの同期チェック
console.log('\n🔄 型定義ファイル同期チェック...');
const frontendTypesPath = path.join('frontend', 'src', 'types', 'index.ts');
const backendTypesPath = path.join('backend', 'src', 'types', 'index.ts');

if (fs.existsSync(frontendTypesPath) && fs.existsSync(backendTypesPath)) {
  const frontendTypes = fs.readFileSync(frontendTypesPath, 'utf8');
  const backendTypes = fs.readFileSync(backendTypesPath, 'utf8');
  
  if (frontendTypes !== backendTypes) {
    console.log('   ⚠️  型定義ファイルが同期されていません！');
    console.log('   frontend/src/types/index.ts と backend/src/types/index.ts の内容が異なります');
  } else {
    console.log('   ✅ 型定義ファイルは同期されています');
  }
} else {
  console.log('   ⚠️  型定義ファイルが見つかりません');
}

// エラーサマリー
console.log('\n' + '='.repeat(60));
console.log(`📊 エラーサマリー: 合計 ${totalErrors} 個のTypeScriptエラー`);
console.log('='.repeat(60));

// エラーをコード別にグループ化
const errorsByCode = {};
for (const error of allErrors) {
  if (!errorsByCode[error.code]) {
    errorsByCode[error.code] = [];
  }
  errorsByCode[error.code].push(error);
}

// エラーコード別サマリー表示
for (const [code, errors] of Object.entries(errorsByCode)) {
  console.log(`\n${code}: ${errors.length}件`);
  const files = [...new Set(errors.map(e => e.file))];
  files.forEach(file => {
    console.log(`  - ${file}`);
  });
}

// エラーレポートの保存
const report = {
  timestamp: getLocalTimestamp(),
  totalErrors,
  errors: allErrors,
  errorsByCode,
  workingTasks: tasks.working
};

const reportPath = path.join(logsDir, 'errors_latest.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`\n📝 詳細レポートを保存しました: ${reportPath}`);

// 終了メッセージ
if (totalErrors === 0) {
  console.log('\n🎉 素晴らしい！TypeScriptエラーは0です！');
} else {
  console.log('\n💪 TypeScriptエラーを0にするために修正を開始してください');
  console.log('   作業開始時は必ずtasks.jsonに登録してください');
}