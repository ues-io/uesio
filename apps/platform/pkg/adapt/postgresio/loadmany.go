package postgresio

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func (c *Connection) LoadMany(op *adapt.LoadManyOp, session *sess.Session) error {

	metadata := c.metadata
	db := c.GetClient()

	collectionMetadata, err := metadata.GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	fieldMap, referencedCollections, referencedGroupCollections, formulaFields, err := adapt.GetFieldsMap(op.Fields, collectionMetadata, metadata)
	if err != nil {
		return err
	}

	fieldIDs, err := fieldMap.GetUniqueDBFieldNames(getFieldNameWithAlias)
	if err != nil {
		return err
	}

	joins := []string{}

	builder := NewQueryBuilder()

	err = processConditionList(op.Conditions, collectionMetadata, metadata, builder, "main", session)
	if err != nil {
		return err
	}

	loadQuery := "SELECT\n" +
		strings.Join(fieldIDs, ",\n") +
		"\nFROM data as \"main\"\n" +
		strings.Join(joins, "") +
		"WHERE\n" +
		builder.String()

	orders := make([]string, len(op.Order))
	for i, order := range op.Order {
		fieldMetadata, err := collectionMetadata.GetField(order.Field)
		if err != nil {
			return err
		}
		fieldName := getFieldName(fieldMetadata, "main")
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
		loadQuery = loadQuery + "\nORDER BY " + strings.Join(orders, ",")
	}
	if op.BatchSize == 0 || op.BatchSize > adapt.MAX_LOAD_BATCH_SIZE {
		op.BatchSize = adapt.MAX_LOAD_BATCH_SIZE
	}
	loadQuery = loadQuery + "\nLIMIT " + strconv.Itoa(op.BatchSize+1)
	if op.BatchNumber != 0 {
		loadQuery = loadQuery + "\nOFFSET " + strconv.Itoa(op.BatchSize*op.BatchNumber)
	}

	if DEBUG_SQL {
		op.DebugQueryString = loadQuery
	}

	//start := time.Now()
	//fmt.Println(loadQuery)
	//fmt.Println(builder.Values)

	rows, err := db.Query(context.Background(), loadQuery, builder.Values...)
	if err != nil {
		return errors.New("Failed to load rows in PostgreSQL:" + err.Error() + " : " + loadQuery)
	}
	defer rows.Close()

	cols := rows.FieldDescriptions()
	if err != nil {
		return errors.New("Failed to load columns in PostgreSQL:" + err.Error())
	}

	var item meta.Item
	index := 0
	scanners := make([]interface{}, len(cols))

	for i, col := range cols {
		scanners[i] = &DataScanner{
			Item:       &item,
			Field:      fieldMap[string(col.Name)],
			References: &referencedCollections,
		}
	}

	op.HasMoreBatches = false

	formulaPopulations := adapt.GetFormulaFunction(formulaFields)

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

		err = formulaPopulations(item)
		if err != nil {
			return err
		}

		err = op.Collection.AddItem(item)
		if err != nil {
			return err
		}

		index++

	}
	err = rows.Err()
	if err != nil {
		return err
	}

	//fmt.Printf("PG LOAD %v %v\n", op.CollectionName, time.Since(start))

	op.BatchNumber++

	err = adapt.HandleReferencesGroup(c, op.Collection, referencedGroupCollections, session)
	if err != nil {
		return err
	}

	return adapt.HandleReferences(c, referencedCollections, session, true)
}
