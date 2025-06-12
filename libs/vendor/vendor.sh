source="../../node_modules/monaco-editor"
dest="../../dist/vendor/monaco-editor"
if [ "$NODE_ENV" = "development" ]; then
    rm -rf $dest
    mkdir -p $dest/src
    cp -R $source/dev/ $dest/src
else
    rm -rf $dest
    mkdir -p $dest/src
    mkdir -p $dest/min-maps
    cp -R $source/min/ $dest/src
    cp -R $source/min-maps/ $dest/min-maps
fi
