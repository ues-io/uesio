npm run uesio upsert -- -f data/accounts.csv -c uesio/crm.account -u uesio/crm.externalid
npm run uesio upsert -- -f data/contacts.csv -s data/contacts.spec.json
npm run uesio upsert -- -f data/opportunities.csv -s data/opportunities.spec.json
