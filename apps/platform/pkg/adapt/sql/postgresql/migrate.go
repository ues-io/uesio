package postgresql

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// Migrate function
func (a *Adapter) Migrate(metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {

	fmt.Println("Migrating PostgreSql")

	db, err := connect()
	if err != nil {
		return err
	}
	defer db.Close()

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

			if field.Type == "MAP" {
				lfield = fieldName + " jsonb"
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
