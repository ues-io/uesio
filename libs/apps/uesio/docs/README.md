# uesio docs

Uesio docs are deployed as a Uesio site, with all actual documentation being written in Markdown files, which live within [data/articles/docs](./data/articles/docs/)

# Editing docs

1. Deploy uesio docs app
2. Upsert doc articles into your workspace

```
uesio deploy
./seed.sh
```

To upsert doc articles into a site, use `./seedprod.sh`
