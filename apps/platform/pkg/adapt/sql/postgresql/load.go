package postgresql

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"

	"github.com/thecloudmasters/uesio/pkg/adapt"
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

	nameFieldDB, err := getDBFieldName(nameFieldMetadata)
	if err != nil {
		return err
	}

	fieldMap, referencedCollections, err := adapt.GetFieldsMap(op.Fields, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	fieldIDs, err := fieldMap.GetUniqueDBFieldNames(getDBFieldName)
	if err != nil {
		return err
	}

	collectionName, err := getDBCollectionName(collectionMetadata)
	if err != nil {
		return err
	}

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)

	loadQuery := psql.Select(fieldIDs...).From("public." + collectionName)

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
		fieldName, err := getDBFieldName(fieldMetadata)
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
		fieldName, err := getDBFieldName(fieldMetadata)
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
		for i := range colvals {
			colvals[i] = new(interface{})
		}
		if err := rows.Scan(colvals...); err != nil {
			return errors.New("Failed to scan values in PostgreSQL:" + err.Error())
		}

		err = adapt.HydrateItem(op, collectionMetadata, &fieldMap, &referencedCollections, "", func(fieldMetadata *adapt.FieldMetadata) (interface{}, error) {

			sqlFieldName, err := getDBFieldName(fieldMetadata)
			if err != nil {
				return nil, err
			}
			index, ok := colIndexes[sqlFieldName]
			if !ok {
				return nil, errors.New("Column not found: " + sqlFieldName)
			}

			if fieldMetadata.Type == "MAP" {
				var aux = *colvals[index].(*interface{})
				if aux != nil {
					res, ok := aux.([]byte)
					if !ok {
						return nil, errors.New("Casting to byte Error")
					}
					var anyJSON map[string]interface{}
					err = json.Unmarshal(res, &anyJSON)
					if err != nil {
						return nil, errors.New("Postgresql map Unmarshal error: " + sqlFieldName)
					}
					return anyJSON, nil
				}
				return nil, nil
			}

			if fieldMetadata.Type == "DATE" {
				var aux = *colvals[index].(*interface{})
				var date = aux.(time.Time)
				return date.Format("2006-01-02"), nil
			}

			return *colvals[index].(*interface{}), nil
		})
		if err != nil {
			return err
		}

	}
	rows.Close()

	return adapt.HandleReferences(func(ops []adapt.LoadOp) error {
		return loadMany(ctx, db, ops, metadata)
	}, referencedCollections)
}

// Load function
func (a *Adapter) Load(ops []adapt.LoadOp, metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {

	if len(ops) == 0 {
		return nil
	}

	ctx := context.Background()

	db, err := connect()
	if err != nil {
		return errors.New("Failed to connect PostgreSQL:" + err.Error())
	}
	defer db.Close()

	return loadMany(ctx, db, ops, metadata)
}

func loadMany(
	ctx context.Context,
	db *sql.DB,
	ops []adapt.LoadOp,
	metadata *adapt.MetadataCache,
) error {
	for i := range ops {
		err := loadOne(ctx, db, &ops[i], metadata, ops)
		if err != nil {
			return err
		}
	}
	return nil
}
