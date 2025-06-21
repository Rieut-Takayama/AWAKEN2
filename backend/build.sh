#!/bin/sh
# TypeScriptをビルド
npx tsc

# パスエイリアスを実際のパスに置換
find dist -name "*.js" -type f -exec sed -i 's/@\/common/\.\.\/common/g' {} \;
find dist -name "*.js" -type f -exec sed -i 's/@\/features/\.\.\/features/g' {} \;
find dist -name "*.js" -type f -exec sed -i 's/@\/config/\.\.\/config/g' {} \;
find dist -name "*.js" -type f -exec sed -i 's/@\/db/\.\.\/db/g' {} \;
find dist -name "*.js" -type f -exec sed -i 's/@\/types/\.\.\/types/g' {} \;
find dist -name "*.js" -type f -exec sed -i 's/@\//\.\.\//g' {} \;