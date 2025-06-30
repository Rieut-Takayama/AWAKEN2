// APIキー保護モジュール
// このファイルは、APIキーフィールドを完全に保護します

(function() {
    // APIキーフィールドのIDリスト
    const protectedFields = [
        'apiKey',
        'apiSecret',
        'claudeApiKey',
        'telegramToken'
    ];
    
    // フィールドを保護する関数
    function protectField(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        // 初期値をクリア
        field.value = '';
        
        // 値の変更を監視
        let userInput = false;
        
        // ユーザーの入力を検知
        field.addEventListener('input', function(e) {
            userInput = true;
        });
        
        // プログラムによる値の設定をブロック
        const originalValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        Object.defineProperty(field, 'value', {
            get: function() {
                return originalValue.get.call(this);
            },
            set: function(val) {
                // ユーザー入力でない場合はブロック
                if (!userInput && val && val !== '') {
                    console.warn(`APIキーフィールド ${fieldId} への自動入力をブロックしました`);
                    return;
                }
                originalValue.set.call(this, val);
                userInput = false;
            }
        });
    }
    
    // DOMContentLoaded時に実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            protectedFields.forEach(protectField);
        });
    } else {
        protectedFields.forEach(protectField);
    }
    
    // 追加の保護: 100ms後に再度クリア
    setTimeout(() => {
        protectedFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value && !field.placeholder.includes('設定済み')) {
                field.value = '';
            }
        });
    }, 100);
})();