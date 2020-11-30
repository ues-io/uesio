package mysql

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	sqlshared "github.com/thecloudmasters/uesio/pkg/adapters/sql"
	"github.com/thecloudmasters/uesio/pkg/creds"
)

// Migrate function
func (a *Adapter) Migrate(metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) error {

	fmt.Println("Migrating MYSQL")

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

		collectionName, err := sqlshared.GetDBCollectionName(collectionMetadata)
		if err != nil {
			return err
		}

		for key, field := range collectionMetadata.Fields {

			if key == collectionMetadata.IDField {
				fieldName, err = sqlshared.GetDBFieldName(field)
				if err != nil {
					return err
				}
				lfield = fieldName + " VARCHAR(80) PRIMARY KEY"
				otherfields = append(otherfields, lfield)
				continue
			}

			fieldName, err = sqlshared.GetDBFieldName(field)
			if err != nil {
				return err
			}

			if field.Type == "MAP" {
				lfield = fieldName + " json"
				otherfields = append(otherfields, lfield)
				continue
			}

			if field.Type == "DATE" {
				lfield = fieldName + " date"
				otherfields = append(otherfields, lfield)
				continue
			}

			if field.Type == "NUMBER" {
				lfield = fieldName + " bigint"
				otherfields = append(otherfields, lfield)
				continue
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
