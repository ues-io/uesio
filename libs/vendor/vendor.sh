source="../../node_modules/monaco-editor"
dest="../../dist/vendor/monaco-editor"
rm -rf "$dest"
mkdir -p "$dest/src"
if [ "$NODE_ENV" = "development" ]; then
    cp -R "$source/dev/." "$dest/src"
else
    mkdir -p "$dest/min-maps"
    cp -R "$source/min/." "$dest/src"
    cp -R "$source/min-maps/." "$dest/min-maps"
fi
