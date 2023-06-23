bash generate-userfile-uploads.sh data/articles/docs
uesio upsert -f data/articles/articles.csv -s data/articles/articles.spec.json
uesio upsert -f data/articles/docs -s data/articles/uploaddocs.spec.json
