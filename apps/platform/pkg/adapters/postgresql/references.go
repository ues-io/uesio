package postgresql

import (
	"context"
	"database/sql"
	"errors"

	sq "github.com/Masterminds/squirrel"
	"github.com/thecloudmasters/uesio/pkg/adapters"
)

func followUpReferenceFieldLoad(
	ctx context.Context,
	db *sql.DB,
	metadata *adapters.MetadataCache,
	dataPayload []map[string]interface{},
	originalCollection *adapters.CollectionMetadata,
	referenceFields adapters.ReferenceRegistry,
) error {

	referencedCollectionsFields, referencedCollectionsIDs, err := adapters.GetReferenceFieldsAndIDs(referenceFields)
	if err != nil {
		return err
	}

	for collectionName, fields := range referencedCollectionsFields {
		ids := referencedCollectionsIDs.GetKeys(collectionName)
		collectionMetadata, err := metadata.GetCollection(collectionName)
		if err != nil {
			return err
		}
		PostgreSQLCollectionNamego, err := getDBCollectionName(collectionMetadata)
		if err != nil {
			return err
		}

		var IDFieldMetadata = collectionMetadata.Fields[collectionMetadata.IDField]
		IDField, err := getDBFieldName(IDFieldMetadata)
		if err != nil {
			return err
		}

		psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)

		fieldIDs := []string{}

		for field := range fields {
			fieldMetadata, err := collectionMetadata.GetField(field)
			if err != nil {
				return err
			}
			sqlFieldName, err := getDBFieldName(fieldMetadata)
			if err != nil {
				return err
			}
			fieldIDs = append(fieldIDs, sqlFieldName)
		}

		loadQuery := psql.Select(fieldIDs...).From("public." + PostgreSQLCollectionNamego).Where(
			sq.Eq{
				IDField: ids,
			})

		rows, err := loadQuery.RunWith(db).Query()

		if err != nil {
			return errors.New("Failed to load rows in PostgreSQL:" + err.Error())
		}

		cols, err := rows.Columns()
		if err != nil {
			return errors.New("Failed to load columns in PostgreSQL:" + err.Error())
		}

		colIndexes := map[string]int{}
		// Create a map of column to index
		for i, col := range cols {
			colIndexes[col] = i
		}

		idToDataMapping := make(map[string]map[string]interface{})
		colvals := make([]interface{}, len(cols))

		IDFieldUIName, err := adapters.GetUIFieldName(IDFieldMetadata)
		if err != nil {
			return err
		}

		for rows.Next() {
			colassoc := make(map[string]interface{}, len(cols))
			for i := range colvals {
				colvals[i] = new(interface{})
			}
			if err := rows.Scan(colvals...); err != nil {
				return errors.New("Failed to scan values in PostgreSQL:" + err.Error())
			}

			for field := range fields {
				fieldMetadata, err := collectionMetadata.GetField(field)
				if err != nil {
					return err
				}

				fieldID, err := adapters.GetUIFieldName(fieldMetadata)
				if err != nil {
					return err
				}

				sqlFieldName, err := getDBFieldName(fieldMetadata)
				if err != nil {
					return err
				}

				index, ok := colIndexes[sqlFieldName]
				if !ok {
					return errors.New("Column not found: " + sqlFieldName)
				}
				colassoc[fieldID] = *colvals[index].(*interface{})
			}
			testid := colassoc[IDFieldUIName].(string)
			idToDataMapping[testid] = colassoc
		}

		rows.Close()

		adapters.MergeReferenceData(dataPayload, referenceFields, idToDataMapping, collectionMetadata)
	}

	return nil
}
