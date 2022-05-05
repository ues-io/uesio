npm run uesio upsert -- -f data/accounts/accounts.csv -c uesio/crm.account -u uesio/crm.externalid
npm run uesio upsert -- -f data/contacts/contacts.csv -s data/contacts/contacts.spec.json
npm run uesio upsert -- -f data/opportunities/opportunities.csv -s data/opportunities/opportunities.spec.json
npm run uesio upsert -- -f data/contacts/pictures -s data/contacts/uploadpictures.spec.json
