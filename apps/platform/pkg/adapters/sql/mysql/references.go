package mysql

import (
	"context"
	"database/sql"
	"errors"

	sq "github.com/Masterminds/squirrel"
	"github.com/thecloudmasters/uesio/pkg/adapters"
	sqlshared "github.com/thecloudmasters/uesio/pkg/adapters/sql"
)

func followUpReferenceFieldLoad(
	ctx context.Context,
	db *sql.DB,
	metadata *adapters.MetadataCache,
	op adapters.LoadOp,
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
		PostgreSQLCollectionNamego, err := sqlshared.GetDBCollectionName(collectionMetadata)
		if err != nil {
			return err
		}

		var IDFieldMetadata = collectionMetadata.Fields[collectionMetadata.IDField]
		IDField, err := sqlshared.GetDBFieldName(IDFieldMetadata)
		if err != nil {
			return err
		}

		psql := sq.StatementBuilder

		fieldIDs := []string{}

		for field := range fields {
			fieldMetadata, err := collectionMetadata.GetField(field)
			if err != nil {
				return err
			}
			sqlFieldName, err := sqlshared.GetDBFieldName(fieldMetadata)
			if err != nil {
				return err
			}
			fieldIDs = append(fieldIDs, sqlFieldName)
		}

		loadQuery := psql.Select(fieldIDs...).From(PostgreSQLCollectionNamego).Where(
			sq.Eq{
				IDField: ids,
			})

		rows, err := loadQuery.RunWith(db).Query()

		if err != nil {
			return errors.New("Failed to load rows in MySQL:" + err.Error())
		}

		cols, err := rows.Columns()
		if err != nil {
			return errors.New("Failed to load columns in MySQL:" + err.Error())
		}

		colIndexes := map[string]int{}
		// Create a map of column to index
		for i, col := range cols {
			colIndexes[col] = i
		}

		idToDataMapping := make(map[string]map[string]interface{})
		colvals := make([]sql.RawBytes, len(cols))
		scanArgs := make([]interface{}, len(colvals))

		IDFieldUIName, err := adapters.GetUIFieldName(IDFieldMetadata)
		if err != nil {
			return err
		}

		for rows.Next() {
			colassoc := make(map[string]interface{}, len(cols))
			for i := range colvals {
				scanArgs[i] = &colvals[i]
			}
			if err := rows.Scan(scanArgs...); err != nil {
				return errors.New("Failed to scan values in MySQL:" + err.Error())
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

				sqlFieldName, err := sqlshared.GetDBFieldName(fieldMetadata)
				if err != nil {
					return err
				}

				index, ok := colIndexes[sqlFieldName]
				if !ok {
					return errors.New("Column not found: " + sqlFieldName)
				}
				colassoc[fieldID] = string(colvals[index])
			}
			testid := colassoc[IDFieldUIName].(string)
			idToDataMapping[testid] = colassoc
		}

		rows.Close()

		err = adapters.MergeReferenceData(op, referenceFields, idToDataMapping, collectionMetadata)
		if err != nil {
			return err
		}
	}

	return nil
}
