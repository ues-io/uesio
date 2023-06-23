bash generate-userfile-uploads.sh data/articles/docs
uesio site upsert -f data/articles/articles.csv -s data/articles/articles.spec.json
uesio site upsert -f data/articles/docs -s data/articles/uploaddocs.spec.json
