package mysql

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/creds"
)

// Migrate function
func (a *Adapter) Migrate(metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) error {

	fmt.Println("Migrating PostgreSql")

	db, err := connect()
	defer db.Close()
	if err != nil {
		return err
	}

	for _, collectionMetadata := range metadata.Collections {

		var otherfields []string
		var lfield string
		var fieldName string
		var columns string

		collectionName, err := getDBCollectionName(collectionMetadata)
		if err != nil {
			return err
		}

		for key, field := range collectionMetadata.Fields {

			if key == collectionMetadata.IDField {
				fieldName, err = getDBFieldName(field)
				if err != nil {
					return err
				}
				lfield = fieldName + " text PRIMARY KEY"
				otherfields = append(otherfields, lfield)
				continue
			}

			fieldName, err = getDBFieldName(field)
			if err != nil {
				return err
			}
			lfield = fieldName + " text"

			otherfields = append(otherfields, lfield)
		}

		columns = strings.Join(otherfields, ", ")

		qry := `CREATE TABLE IF NOT EXISTS ` + collectionName + ` (` + columns + `)`

		_, err = db.Exec(qry)
		if err != nil {
			return err
		}

	}
	return nil
}
