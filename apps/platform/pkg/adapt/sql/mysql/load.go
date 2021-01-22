package mysql

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	sqlshared "github.com/thecloudmasters/uesio/pkg/adapt/sql"
)

func loadOne(
	ctx context.Context,
	db *sql.DB,
	op *adapt.LoadOp,
	metadata *adapt.MetadataCache,
	ops []adapt.LoadOp,
) error {
	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	nameFieldMetadata, err := collectionMetadata.GetNameField()
	if err != nil {
		return err
	}

	nameFieldDB, err := sqlshared.GetDBFieldName(nameFieldMetadata)
	if err != nil {
		return err
	}

	fieldMap, referencedCollections, err := adapt.GetFieldsMap(op.Fields, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	requestedFieldArr := []string{}

	for _, fieldMetadata := range fieldMap {
		firestoreFieldName, err := sqlshared.GetDBFieldName(fieldMetadata)
		if err != nil {
			return err
		}
		requestedFieldArr = append(requestedFieldArr, firestoreFieldName)
	}

	collectionName, err := sqlshared.GetDBCollectionName(collectionMetadata)
	if err != nil {
		return err
	}

	psql := sq.StatementBuilder

	loadQuery := psql.Select(requestedFieldArr...).From(collectionName)

	for _, condition := range op.Conditions {

		if condition.Type == "SEARCH" {
			searchToken := condition.Value.(string)
			colValeStr := ""
			colValeStr = "%" + fmt.Sprintf("%v", searchToken) + "%"
			loadQuery = loadQuery.Where(nameFieldDB+" LIKE ? ", colValeStr)
			continue
		}

		fieldMetadata, err := collectionMetadata.GetField(condition.Field)
		if err != nil {
			return err
		}
		fieldName, err := sqlshared.GetDBFieldName(fieldMetadata)
		if err != nil {
			return err
		}

		conditionValue, err := adapt.GetConditionValue(condition, op, metadata, ops)
		if err != nil {
			return err
		}

		loadQuery = loadQuery.Where(fieldName+" = ? ", fmt.Sprintf("%v", conditionValue))

	}

	for _, order := range op.Order {

		fieldMetadata, err := collectionMetadata.GetField(order.Field)
		if err != nil {
			return err
		}
		fieldName, err := sqlshared.GetDBFieldName(fieldMetadata)
		if err != nil {
			return err
		}

		if order.Desc {

			loadQuery = loadQuery.OrderBy(fieldName + " desc")
			continue
		}

		loadQuery = loadQuery.OrderBy(fieldName + " asc")

	}

	if op.Limit != 0 {
		loadQuery = loadQuery.Limit(uint64(op.Limit))
	}

	if op.Offset != 0 {
		loadQuery = loadQuery.Offset(uint64(op.Offset))
	}

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

	colvals := make([]sql.RawBytes, len(cols))
	scanArgs := make([]interface{}, len(colvals))

	for rows.Next() {
		item := op.Collection.NewItem()

		for i := range colvals {
			scanArgs[i] = &colvals[i]
		}
		if err := rows.Scan(scanArgs...); err != nil {
			return errors.New("Failed to scan values in MySQL:" + err.Error())
		}
		// Map properties from firestore to uesio fields
		for fieldID, fieldMetadata := range fieldMap {

			sqlFieldName, err := sqlshared.GetDBFieldName(fieldMetadata)
			if err != nil {
				return err
			}
			index, ok := colIndexes[sqlFieldName]
			if !ok {
				return errors.New("Column not found: " + sqlFieldName)
			}

			if fieldMetadata.Type == "MAP" {

				if len(colvals[index]) != 0 {
					var anyJSON map[string]interface{}
					err = json.Unmarshal(colvals[index], &anyJSON)

					if err != nil {
						return errors.New("Postgresql map Unmarshal error: " + sqlFieldName)
					}
					err := item.SetField(fieldID, anyJSON)
					if err != nil {
						return err
					}

				} else {
					err := item.SetField(fieldID, nil)
					if err != nil {
						return err
					}
				}

				continue
			}

			if fieldMetadata.Type == "DATE" {

				input := string(colvals[index])
				layout := "2006-01-02"
				t, _ := time.Parse(layout, input)

				err := item.SetField(fieldID, t.Format("2006-01-02"))
				if err != nil {
					return err
				}

				continue
			}

			err = item.SetField(fieldID, string(colvals[index]))
			if err != nil {
				return err
			}

			if fieldMetadata.IsForeignKey {
				// Handle foreign key value
				reference, ok := referencedCollections[fieldMetadata.ReferencedCollection]
				if ok {
					reference.AddID(string(colvals[index]))
				}
			}

		}

		op.Collection.AddItem(item)

	}
	rows.Close()

	return adapt.HandleReferences(func(op *adapt.LoadOp, metadata *adapt.MetadataCache) error {
		return loadOne(ctx, db, op, metadata, nil)
	}, op, metadata, referencedCollections)
}

// Load function
func (a *Adapter) Load(ops []adapt.LoadOp, metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {

	ctx := context.Background()

	db, err := connect()
	if err != nil {
		return errors.New("Failed to connect MySQL:" + err.Error())
	}
	defer db.Close()

	for i := range ops {
		op := ops[i]
		err := loadOne(ctx, db, &op, metadata, ops)
		if err != nil {
			return err
		}
	}

	return nil
}
