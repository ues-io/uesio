package postgresio

import (
	"database/sql"
	"errors"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

func getFieldNameWithAlias(fieldMetadata *adapt.FieldMetadata) string {
	fieldName := getFieldName(fieldMetadata)
	return fieldName + " AS \"" + fieldMetadata.GetFullName() + "\""
}

func getFieldName(fieldMetadata *adapt.FieldMetadata) string {
	fieldName := fieldMetadata.GetFullName()
	switch fieldMetadata.Type {
	case "CHECKBOX":
		return "(fields->>'" + fieldName + "')::boolean"
	case "TIMESTAMP":
		return "(fields->>'" + fieldName + "')::bigint"
	case "NUMBER":
		return "(fields->>'" + fieldName + "')::numeric"
	case "MAP", "LIST", "MULTISELECT":
		// Return just as bytes
		return "fields->'" + fieldName + "'"
	case "AUTONUMBER":
		return "autonumber"
	default:
		// Cast to string
		return "fields->>'" + fieldName + "'"
	}
}

func loadOne(
	db *sql.DB,
	op *adapt.LoadOp,
	metadata *adapt.MetadataCache,
	ops []*adapt.LoadOp,
	tenantID string,
	userTokens []string,
) error {
	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
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

	loadQuery := "SELECT " + strings.Join(fieldIDs, ",") + " FROM public.data WHERE "

	conditionStrings, values, err := getConditions(op, metadata, collectionMetadata, ops, tenantID, userTokens)
	if err != nil {
		return err
	}

	loadQuery = loadQuery + strings.Join(conditionStrings, " AND ")

	orders := make([]string, len(op.Order))
	for i, order := range op.Order {
		fieldMetadata, err := collectionMetadata.GetField(order.Field)
		if err != nil {
			return err
		}
		fieldName := getFieldName(fieldMetadata)
		if err != nil {
			return err
		}
		if order.Desc {
			orders[i] = fieldName + " desc"
			continue
		}
		orders[i] = fieldName + " asc"
	}

	if len(op.Order) > 0 {
		loadQuery = loadQuery + " order by " + strings.Join(orders, ",")
	}
	if op.BatchSize == 0 || op.BatchSize > adapt.MAX_BATCH_SIZE {
		op.BatchSize = adapt.MAX_BATCH_SIZE
	}
	loadQuery = loadQuery + " limit " + strconv.Itoa(op.BatchSize+1)
	if op.BatchNumber != 0 {
		loadQuery = loadQuery + " offset " + strconv.Itoa(op.BatchSize*op.BatchNumber)
	}

	rows, err := db.Query(loadQuery, values...)
	if err != nil {
		return errors.New("Failed to load rows in PostgreSQL:" + err.Error() + " : " + loadQuery)
	}
	defer rows.Close()

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

	op.HasMoreBatches = false

	for rows.Next() {
		if op.BatchSize == index {
			op.HasMoreBatches = true
			break
		}
		item = op.Collection.NewItem()
		err := rows.Scan(scanners...)
		if err != nil {
			return err
		}
		index++
	}
	err = rows.Err()
	if err != nil {
		return err
	}

	op.BatchNumber++

	return adapt.HandleReferences(func(ops []*adapt.LoadOp) error {
		return loadMany(db, ops, metadata, tenantID, userTokens)
	}, op.Collection, referencedCollections)
}

// Load function
func (a *Adapter) Load(ops []*adapt.LoadOp, metadata *adapt.MetadataCache, credentials *adapt.Credentials, userTokens []string) error {

	if len(ops) == 0 {
		return nil
	}

	db, err := connect(credentials)
	if err != nil {
		return errors.New("Failed to connect PostgreSQL:" + err.Error())
	}

	return loadMany(db, ops, metadata, credentials.GetTenantID(), userTokens)
}

func loadMany(
	db *sql.DB,
	ops []*adapt.LoadOp,
	metadata *adapt.MetadataCache,
	tenantID string,
	userTokens []string,
) error {
	for i := range ops {
		err := loadOne(db, ops[i], metadata, ops, tenantID, userTokens)
		if err != nil {
			return err
		}
	}
	return nil
}
