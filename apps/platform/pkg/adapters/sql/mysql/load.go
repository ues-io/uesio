package mysql

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/reqs"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	sqlshared "github.com/thecloudmasters/uesio/pkg/adapters/sql"
)

func queryDb(db *sql.DB, loadQuery sq.SelectBuilder, requestedFields adapters.FieldsMap, referenceFields adapters.ReferenceRegistry, collectionMetadata *adapters.CollectionMetadata) ([]map[string]interface{}, error) {

	rows, err := loadQuery.RunWith(db).Query()

	if err != nil {
		return nil, errors.New("Failed to load rows in MySQL:" + err.Error())
	}

	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return nil, errors.New("Failed to load columns in MySQL:" + err.Error())
	}

	colIndexes := map[string]int{}
	// Create a map of column to index
	for i, col := range cols {
		colIndexes[col] = i
	}

	allgeneric := make([]map[string]interface{}, 0)
	colvals := make([]sql.RawBytes, len(cols))
	scanArgs := make([]interface{}, len(colvals))

	for rows.Next() {
		colassoc := make(map[string]interface{}, len(cols))
		for i := range colvals {
			scanArgs[i] = &colvals[i]
		}
		if err := rows.Scan(scanArgs...); err != nil {
			return nil, errors.New("Failed to scan values in MySQL:" + err.Error())
		}
		// Map properties from firestore to uesio fields
		for fieldID, fieldMetadata := range requestedFields {

			sqlFieldName, err := sqlshared.GetDBFieldName(fieldMetadata)
			if err != nil {
				return nil, err
			}
			index, ok := colIndexes[sqlFieldName]
			if !ok {
				return nil, errors.New("Column not found: " + sqlFieldName)
			}

			if fieldMetadata.Type == "MAP" {

				if len(colvals[index]) != 0 {
					var anyJSON map[string]interface{}
					err = json.Unmarshal(colvals[index], &anyJSON)

					if err != nil {
						return nil, errors.New("Postgresql map Unmarshal error: " + sqlFieldName)
					}

					colassoc[fieldID] = anyJSON
				} else {
					colassoc[fieldID] = nil
				}

				continue
			}

			if fieldMetadata.Type == "DATE" {

				input := string(colvals[index])
				layout := "2006-01-02"
				t, _ := time.Parse(layout, input)

				colassoc[fieldID] = t.Format("2006-01-02")

				continue
			}

			colassoc[fieldID] = string(colvals[index])
		}

		allgeneric = append(allgeneric, colassoc)

		for _, reference := range referenceFields {
			fieldMetadata := reference.Metadata
			foreignKeyMetadata, err := collectionMetadata.GetField(fieldMetadata.ForeignKeyField)
			if err != nil {
				return nil, errors.New("foreign key: " + fieldMetadata.ForeignKeyField + " configured for: " + fieldMetadata.Name + " does not exist in collection: " + collectionMetadata.Name)
			}
			foreignKeyName, err := adapters.GetUIFieldName(foreignKeyMetadata)
			if err != nil {
				return nil, err
			}
			foreignKeyValue, ok := colassoc[foreignKeyName]
			if !ok {
				//No foreign key value
				continue
			}

			reference.AddID(foreignKeyValue)
		}

	}
	rows.Close()

	return allgeneric, nil

}

func loadOne(ctx context.Context, db *sql.DB, wire reqs.LoadRequest, metadata *adapters.MetadataCache, requests []reqs.LoadRequest, responses []reqs.LoadResponse) (*reqs.LoadResponse, error) {
	data := []map[string]interface{}{}
	collectionMetadata, ok := metadata.Collections[wire.Collection]
	if !ok {
		return nil, errors.New("No metadata provided for collection: " + wire.Collection)
	}

	nameFieldMetadata, err := collectionMetadata.GetNameField()
	if err != nil {
		return nil, err
	}

	nameFieldDB, err := sqlshared.GetDBFieldName(nameFieldMetadata)
	if err != nil {
		return nil, err
	}

	fieldMap, referenceFields, err := adapters.GetFieldsMap(wire.Fields, collectionMetadata, metadata)
	if err != nil {
		return nil, err
	}

	requestedFieldArr := []string{}

	for _, fieldMetadata := range fieldMap {
		firestoreFieldName, err := sqlshared.GetDBFieldName(fieldMetadata)
		if err != nil {
			return nil, err
		}
		requestedFieldArr = append(requestedFieldArr, firestoreFieldName)
	}

	collectionName, err := sqlshared.GetDBCollectionName(collectionMetadata)
	if err != nil {
		return nil, err
	}

	psql := sq.StatementBuilder

	loadQuery := psql.Select(requestedFieldArr...).From(collectionName)

	if wire.Conditions != nil {

		for _, condition := range wire.Conditions {

			if condition.Type == "SEARCH" {
				searchToken := condition.Value.(string)
				colValeStr := ""
				colValeStr = "%" + fmt.Sprintf("%v", searchToken) + "%"
				loadQuery = loadQuery.Where(nameFieldDB+" LIKE ? ", colValeStr)
				continue
			}

			fieldMetadata, ok := collectionMetadata.Fields[condition.Field]
			if !ok {
				return nil, errors.New("No metadata provided for field: " + condition.Field)
			}
			fieldName, err := sqlshared.GetDBFieldName(fieldMetadata)
			if err != nil {
				return nil, err
			}

			conditionValue, err := adapters.GetConditionValue(condition, wire, metadata, requests, responses)
			if err != nil {
				return nil, err
			}

			loadQuery = loadQuery.Where(fieldName+" = ? ", fmt.Sprintf("%v", conditionValue))

		}
	}

	data, err = queryDb(db, loadQuery, fieldMap, referenceFields, collectionMetadata)
	if err != nil {
		return nil, err
	}

	//At this point idsToLookFor has a mapping for reference field
	//names to actual id values we will need to grab from the referenced collection
	if len(referenceFields) != 0 {
		//Attach extra data needed for reference fields
		err = followUpReferenceFieldLoad(ctx, db, metadata, data, collectionMetadata, referenceFields)
		if err != nil {
			return nil, err
		}
	}

	return &reqs.LoadResponse{
		Wire:       wire.Wire,
		Collection: wire.Collection,
		Data:       data,
	}, nil
}

// Load function
func (a *Adapter) Load(requests []reqs.LoadRequest, metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) ([]reqs.LoadResponse, error) {

	ctx := context.Background()
	responses := []reqs.LoadResponse{}

	db, err := connect()
	defer db.Close()
	if err != nil {
		return nil, errors.New("Failed to connect MySQL:" + err.Error())
	}

	for _, wire := range requests {
		response, err := loadOne(ctx, db, wire, metadata, requests, responses)
		if err != nil {
			return nil, err
		}

		responses = append(responses, *response)
	}

	return responses, nil
}
