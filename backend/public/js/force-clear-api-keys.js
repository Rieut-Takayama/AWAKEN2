// APIキーフィールドを強制的にクリアする
(function() {
    const envValues = [
        'mx0vglCM8UefJakBxU',
        '401056ededec44a58c7c906f2a07eafd',
        '7aab7803fbc4385cdde00392357082db:8ac8f9227e1f96ce83'
    ];
    
    function forceCleanFields() {
        const fields = ['apiKey', 'apiSecret', 'claudeApiKey', 'telegramToken'];
        
        fields.forEach(id => {
            const field = document.getElementById(id);
            if (!field) return;
            
            // 環境変数の値が入っていたら即座にクリア
            if (envValues.some(val => field.value.includes(val))) {
                console.log(`環境変数の値を検出してクリア: ${id}`);
                field.value = '';
            }
            
            // 暗号化されたキー（コロンを含む）もクリア
            if (field.value.includes(':')) {
                console.log(`暗号化されたキーを検出してクリア: ${id}`);
                field.value = '';
            }
        });
    }
    
    // 即座に実行
    forceCleanFields();
    
    // 複数のタイミングで実行
    setTimeout(forceCleanFields, 0);
    setTimeout(forceCleanFields, 50);
    setTimeout(forceCleanFields, 100);
    setTimeout(forceCleanFields, 200);
    setTimeout(forceCleanFields, 500);
    
    // DOMContentLoaded後も実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceCleanFields);
    }
    
    // 値の変更を監視
    const observer = new MutationObserver(forceCleanFields);
    
    setTimeout(() => {
        fields.forEach(id => {
            const field = document.getElementById(id);
            if (field) {
                observer.observe(field, {
                    attributes: true,
                    attributeFilter: ['value']
                });
            }
        });
    }, 100);
})();