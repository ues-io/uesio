package postgresio

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/lib/pq"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

type DataScanner struct {
	Item       *loadable.Item
	Field      *adapt.FieldMetadata
	References *adapt.ReferenceRegistry
	Index      *int
}

func (ds *DataScanner) Scan(src interface{}) error {
	fieldMetadata := ds.Field
	if src == nil {
		return (*ds.Item).SetField(fieldMetadata.GetFullName(), src)
	}

	if fieldMetadata.Type == "MAP" {
		var mapdata map[string]interface{}
		err := json.Unmarshal([]byte(src.(string)), &mapdata)
		if err != nil {
			return errors.New("Postgresql map Unmarshal error: " + fieldMetadata.GetFullName() + " : " + err.Error())
		}
		return (*ds.Item).SetField(fieldMetadata.GetFullName(), mapdata)
	}
	if fieldMetadata.Type == "LIST" {
		var arraydata []interface{}
		err := json.Unmarshal([]byte(src.(string)), &arraydata)
		if err != nil {
			return errors.New("Postgresql map Unmarshal error: " + fieldMetadata.GetFullName() + " : " + err.Error())
		}
		return (*ds.Item).SetField(fieldMetadata.GetFullName(), arraydata)
	}

	if fieldMetadata.Type == "CHECKBOX" {
		return nil
	}

	if fieldMetadata.Type == "DATE" {
		return (*ds.Item).SetField(fieldMetadata.GetFullName(), src.(time.Time).Format("2006-01-02"))
	}

	if fieldMetadata.Type == "TIMESTAMP" {
		return nil
	}

	if adapt.IsReference(fieldMetadata.Type) {

		// Handle foreign key value
		reference, ok := (*ds.References)[fieldMetadata.ReferencedCollection]
		if !ok {
			return nil
		}

		// If we didn't request any additional fields here, then we don't need to
		// do a query, just set the ID field of our reference object
		if len(reference.Fields) == 0 {
			refItem := adapt.Item{}
			err := refItem.SetField(reference.Metadata.IDField, src)
			if err != nil {
				return err
			}
			return (*ds.Item).SetField(fieldMetadata.GetFullName(), refItem)
		}

		reference.AddID(src, adapt.ReferenceLocator{
			RecordIndex: *ds.Index,
			Field:       fieldMetadata,
		})

		return nil
	}

	return (*ds.Item).SetField(fieldMetadata.GetFullName(), src)
}

//GetBytes interface to bytes function
func GetBytes(key interface{}) ([]byte, error) {
	buf, ok := key.([]byte)
	if !ok {
		return nil, errors.New("GetBytes Error")
	}

	return buf, nil
}

func getFieldNameWithAlias(fieldMetadata *adapt.FieldMetadata) (string, error) {
	fieldName, err := getFieldName(fieldMetadata)
	if err != nil {
		return "", err
	}
	return fieldName + " AS \"" + fieldMetadata.GetFullName() + "\"", nil
}

func getFieldName(fieldMetadata *adapt.FieldMetadata) (string, error) {
	return "fields->>'" + fieldMetadata.GetFullName() + "'", nil
}

func loadOne(
	ctx context.Context,
	db *sql.DB,
	op *adapt.LoadOp,
	metadata *adapt.MetadataCache,
	ops []adapt.LoadOp,
	tenantID string,
) error {
	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	nameFieldMetadata, err := collectionMetadata.GetNameField()
	if err != nil {
		return err
	}

	nameFieldDB, err := getFieldName(nameFieldMetadata)
	if err != nil {
		return err
	}

	fieldMap, referencedCollections, err := adapt.GetFieldsMap(op.Fields, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	fieldIDs, err := fieldMap.GetUniqueDBFieldNames(getFieldNameWithAlias)
	if err != nil {
		return err
	}

	collectionName, err := getDBCollectionName(collectionMetadata, tenantID)
	if err != nil {
		return err
	}

	loadQuery := "SELECT " + strings.Join(fieldIDs, ",") + " FROM public.data WHERE "
	conditionStrings := []string{
		"collection = $1",
	}

	paramCounter := 2
	values := []interface{}{
		collectionName,
	}

	for _, condition := range op.Conditions {

		if condition.Type == "SEARCH" {
			searchToken := condition.Value.(string)
			colValeStr := ""
			colValeStr = "%" + fmt.Sprintf("%v", searchToken) + "%"
			conditionStrings = append(conditionStrings, nameFieldDB+" ILIKE ? ")
			values = append(values, colValeStr)
			paramCounter++
			continue
		}

		fieldMetadata, err := collectionMetadata.GetField(condition.Field)
		if err != nil {
			return err
		}
		fieldName, err := getFieldName(fieldMetadata)
		if err != nil {
			return err
		}

		conditionValue, err := adapt.GetConditionValue(condition, op, metadata, ops)
		if err != nil {
			return err
		}

		if condition.Operator == "IN" {
			conditionStrings = append(conditionStrings, fieldName+" = ANY($"+strconv.Itoa(paramCounter)+")")
			values = append(values, pq.Array(conditionValue))
			paramCounter++
		} else {
			conditionStrings = append(conditionStrings, fieldName+" = $"+strconv.Itoa(paramCounter))
			paramCounter++
			values = append(values, conditionValue)
		}

	}
	/*
		for _, order := range op.Order {

			fieldMetadata, err := collectionMetadata.GetField(order.Field)
			if err != nil {
				return err
			}
			fieldName, err := getFieldName(fieldMetadata)
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
	*/
	loadQuery = loadQuery + strings.Join(conditionStrings, " AND ")

	rows, err := db.Query(loadQuery, values...)
	if err != nil {
		return errors.New("Failed to load rows in PostgreSQL:" + err.Error())
	}

	cols, err := rows.Columns()
	if err != nil {
		return errors.New("Failed to load columns in PostgreSQL:" + err.Error())
	}

	var item loadable.Item
	index := 0
	scanners := make([]interface{}, len(cols))

	for i, name := range cols {
		scanners[i] = &DataScanner{
			Item:       &item,
			Field:      fieldMap[name],
			References: &referencedCollections,
			Index:      &index,
		}
	}

	for rows.Next() {
		item = op.Collection.NewItem()
		err := rows.Scan(scanners...)
		if err != nil {
			return err
		}
		index++
	}
	rows.Close()

	return adapt.HandleReferences(func(ops []adapt.LoadOp) error {
		return loadMany(ctx, db, ops, metadata, tenantID)
	}, op.Collection, referencedCollections)
}

// Load function
func (a *Adapter) Load(ops []adapt.LoadOp, metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {

	if len(ops) == 0 {
		return nil
	}

	ctx := context.Background()

	db, err := connect(credentials)
	if err != nil {
		return errors.New("Failed to connect PostgreSQL:" + err.Error())
	}
	defer db.Close()

	return loadMany(ctx, db, ops, metadata, credentials.GetTenantID())
}

func loadMany(
	ctx context.Context,
	db *sql.DB,
	ops []adapt.LoadOp,
	metadata *adapt.MetadataCache,
	tenantID string,
) error {
	for i := range ops {
		err := loadOne(ctx, db, &ops[i], metadata, ops, tenantID)
		if err != nil {
			return err
		}
	}
	return nil
}
