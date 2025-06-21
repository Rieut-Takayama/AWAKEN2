#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// パス設定
const rootDir = path.resolve(__dirname, '../..');
const tasksPath = path.join(__dirname, 'tasks.json');
const errorsPath = path.join(__dirname, 'logs/errors_latest.json');

// tasks.jsonの初期化
function initializeTasks() {
  if (!fs.existsSync(tasksPath)) {
    const initialTasks = {
      updated: new Date().toLocaleString(),
      working: {}
    };
    fs.writeFileSync(tasksPath, JSON.stringify(initialTasks, null, 2));
  }
}

// tasks.jsonの25分ルールチェック
function checkTasksStatus() {
  if (!fs.existsSync(tasksPath)) return;
  
  const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
  const now = Date.now();

  for (const [agent, task] of Object.entries(tasks.working)) {
    const elapsed = now - new Date(task.startedAt).getTime();
    if (elapsed > 25 * 60 * 1000) { // 25分
      console.log(`⚠️  警告: ${agent}の作業が25分を超過しています`);
      console.log(`   → ${task.error}は放棄されたとみなされます`);
    }
  }
}

// 設定エラー耐性チェック
function performRobustCheck(command) {
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      cwd: rootDir,
      stdio: 'pipe'
    });
    return { success: true, output };
  } catch (error) {
    const output = error.stdout || error.stderr || '';
    
    // 設定エラーを検出しつつエラーを抽出
    if (output.includes('is not under \'rootDir\'') || 
        output.includes('TS6059')) {
      console.log('⚠️  設定問題を検出 - エラー抽出を継続');
    }
    
    return { success: false, output };
  }
}

// TypeScriptエラーの分析
function analyzeTypeScriptErrors() {
  console.log('🔍 TypeScriptエラー分析を開始...');
  
  const errors = [];
  const commands = [
    'npx tsc --noEmit --project backend/tsconfig.json',
    'npx tsc --noEmit --project frontend/tsconfig.json'
  ];

  // フロントエンドがViteプロジェクトの場合はtsconfig.app.jsonを使用
  if (fs.existsSync(path.join(rootDir, 'frontend/tsconfig.app.json'))) {
    commands[1] = 'npx tsc --noEmit --project frontend/tsconfig.app.json';
  }

  for (const command of commands) {
    const result = performRobustCheck(command);
    if (!result.success && result.output) {
      // エラーをパース
      const lines = result.output.split('\n');
      for (const line of lines) {
        if (line.includes('error TS')) {
          errors.push({
            file: line.split('(')[0].trim(),
            message: line.trim(),
            timestamp: new Date().toLocaleString()
          });
        }
      }
    }
  }

  // エラーログの保存
  const errorReport = {
    timestamp: new Date().toLocaleString(),
    totalErrors: errors.length,
    errors: errors
  };
  
  fs.writeFileSync(errorsPath, JSON.stringify(errorReport, null, 2));
  
  return errorReport;
}

// 型定義ファイル同期チェック
function checkTypeDefinitionsSync() {
  const frontendTypes = path.join(rootDir, 'frontend/src/types/index.ts');
  const backendTypes = path.join(rootDir, 'backend/src/types/index.ts');
  
  if (fs.existsSync(frontendTypes) && fs.existsSync(backendTypes)) {
    const frontendContent = fs.readFileSync(frontendTypes, 'utf8');
    const backendContent = fs.readFileSync(backendTypes, 'utf8');
    
    if (frontendContent !== backendContent) {
      console.log('⚠️  警告: 型定義ファイルが同期されていません');
      console.log('   → frontend/src/types/index.ts');
      console.log('   → backend/src/types/index.ts');
    } else {
      console.log('✅ 型定義ファイルは同期されています');
    }
  }
}

// メイン実行
function main() {
  console.log('=== TypeScript エラー分析システム ===');
  
  initializeTasks();
  checkTasksStatus();
  
  // 作業中タスクの表示
  if (fs.existsSync(tasksPath)) {
    const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    const workingCount = Object.keys(tasks.working).length;
    if (workingCount > 0) {
      console.log(`📋 作業中のタスク: ${workingCount}件`);
      for (const [agent, task] of Object.entries(tasks.working)) {
        console.log(`   ${agent}: ${task.error}`);
      }
    }
  }
  
  const report = analyzeTypeScriptErrors();
  
  console.log(`\n📊 エラー総数: ${report.totalErrors}`);
  
  if (report.totalErrors > 0) {
    console.log('\n🔥 検出されたエラー:');
    report.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.file}`);
      console.log(`   ${error.message}`);
    });
  } else {
    console.log('🎉 TypeScriptエラーは検出されませんでした！');
  }
  
  checkTypeDefinitionsSync();
  
  console.log(`\n📝 詳細ログ: ${errorsPath}`);
}

if (require.main === module) {
  main();
}

module.exports = { analyzeTypeScriptErrors, checkTypeDefinitionsSync };