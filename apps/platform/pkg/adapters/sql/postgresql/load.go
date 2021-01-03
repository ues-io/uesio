package postgresql

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/thecloudmasters/uesio/pkg/creds"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	sqlshared "github.com/thecloudmasters/uesio/pkg/adapters/sql"
)

//GetBytes interface to bytes function
func GetBytes(key interface{}) ([]byte, error) {
	buf, ok := key.([]byte)
	if !ok {
		return nil, errors.New("GetBytes Error")
	}

	return buf, nil
}

func loadOne(
	ctx context.Context,
	db *sql.DB,
	op adapters.LoadOp,
	metadata *adapters.MetadataCache,
	ops []adapters.LoadOp,
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

	fieldMap, referenceFields, err := adapters.GetFieldsMap(op.Fields, collectionMetadata, metadata)
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

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)

	loadQuery := psql.Select(requestedFieldArr...).From("public." + collectionName)

	for _, condition := range op.Conditions {

		if condition.Type == "SEARCH" {
			searchToken := condition.Value.(string)
			colValeStr := ""
			colValeStr = "%" + fmt.Sprintf("%v", searchToken) + "%"
			loadQuery = loadQuery.Where(nameFieldDB+" ILIKE ? ", colValeStr)
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

		conditionValue, err := adapters.GetConditionValue(condition, op, metadata, ops)
		if err != nil {
			return err
		}

		loadQuery = loadQuery.Where(fieldName+" = ? ", fmt.Sprintf("%v", conditionValue))

	}

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

	colvals := make([]interface{}, len(cols))

	for rows.Next() {
		item := op.Collection.NewItem()
		for i := range colvals {
			colvals[i] = new(interface{})
		}
		if err := rows.Scan(colvals...); err != nil {
			return errors.New("Failed to scan values in PostgreSQL:" + err.Error())
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

				var aux = *colvals[index].(*interface{})

				if aux != nil {

					res, ok := aux.([]byte)
					if !ok {
						return errors.New("Casting to byte Error")
					}

					var anyJSON map[string]interface{}
					err = json.Unmarshal(res, &anyJSON)

					if err != nil {
						return errors.New("Postgresql map Unmarshal error: " + sqlFieldName)
					}

					err = item.SetField(fieldID, anyJSON)
					if err != nil {
						return err
					}
				} else {
					err = item.SetField(fieldID, nil)
					if err != nil {
						return err
					}
				}

				continue
			}

			if fieldMetadata.Type == "DATE" {

				var aux = *colvals[index].(*interface{})
				var date = aux.(time.Time)
				err = item.SetField(fieldID, date.Format("2006-01-02"))
				if err != nil {
					return err
				}

				continue
			}

			err = item.SetField(fieldID, *colvals[index].(*interface{}))
			if err != nil {
				return err
			}
		}

		for _, reference := range referenceFields {
			fieldMetadata := reference.Metadata
			foreignKeyMetadata, err := collectionMetadata.GetField(fieldMetadata.ForeignKeyField)
			if err != nil {
				return errors.New("foreign key: " + fieldMetadata.ForeignKeyField + " configured for: " + fieldMetadata.Name + " does not exist in collection: " + collectionMetadata.Name)
			}
			foreignKeyName, err := adapters.GetUIFieldName(foreignKeyMetadata)
			if err != nil {
				return err
			}
			foreignKeyValue, err := item.GetField(foreignKeyName)
			if err != nil {
				//No foreign key value
				continue
			}

			reference.AddID(foreignKeyValue)
		}

		op.Collection.AddItem(item)

	}
	rows.Close()

	//At this point idsToLookFor has a mapping for reference field
	//names to actual id values we will need to grab from the referenced collection
	if len(referenceFields) != 0 {
		//Attach extra data needed for reference fields
		err = followUpReferenceFieldLoad(ctx, db, metadata, op, collectionMetadata, referenceFields)
		if err != nil {
			return err
		}
	}

	return nil
}

// Load function
func (a *Adapter) Load(ops []adapters.LoadOp, metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) error {

	ctx := context.Background()

	db, err := connect()
	if err != nil {
		return errors.New("Failed to connect PostgreSQL:" + err.Error())
	}
	defer db.Close()

	for _, op := range ops {
		err := loadOne(ctx, db, op, metadata, ops)
		if err != nil {
			return err
		}
	}

	return nil
}
