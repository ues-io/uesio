package sqlshared

import (
	"database/sql"
	"encoding/json"
	"errors"
	"text/template"

	"github.com/Masterminds/squirrel"
	guuid "github.com/google/uuid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func getUpdatesForChange(change adapt.ChangeRequest, collectionMetadata *adapt.CollectionMetadata) (map[string]interface{}, string, string, error) {
	postgresSQLUpdate := map[string]interface{}{}
	postgresSQLId, _ := change.FieldChanges[collectionMetadata.IDField].(string)
	idFieldName := ""

	for fieldID, value := range change.FieldChanges {
		if fieldID == collectionMetadata.IDField {
			// We don't need to add the id field to the update
			idFieldMetadata, err := collectionMetadata.GetIDField()
			if err != nil {
				return nil, "", "", err
			}
			idFieldName, _ = GetDBFieldName(idFieldMetadata)
			continue
		}

		fieldMetadata, err := collectionMetadata.GetField(fieldID)
		if err != nil {
			return nil, "", "", err
		}

		if fieldMetadata.Type == "REFERENCE" {
			// Don't update reference fields
			continue
		}

		fieldName, err := GetDBFieldName(fieldMetadata)
		if err != nil {
			return nil, "", "", err
		}

		if fieldMetadata.Type == "MAP" {
			jsonValue, err := json.Marshal(value)
			if err != nil {
				return nil, "", "", errors.New("Error converting from map to json: " + fieldID)
			}
			postgresSQLUpdate[fieldName] = jsonValue
			continue
		}

		postgresSQLUpdate[fieldName] = value

	}

	return postgresSQLUpdate, postgresSQLId, idFieldName, nil
}

func getInsertsForChange(change adapt.ChangeRequest, collectionMetadata *adapt.CollectionMetadata) (map[string]interface{}, error) {
	inserts := map[string]interface{}{}
	for fieldID, value := range change.FieldChanges {
		fieldMetadata, err := collectionMetadata.GetField(fieldID)
		if err != nil {
			return nil, err
		}

		if fieldMetadata.Type == "REFERENCE" {
			// Don't update reference fields
			continue
		}

		fieldName, err := GetDBFieldName(fieldMetadata)
		if err != nil {
			return nil, err
		}

		if fieldMetadata.Type == "MAP" {
			jsonValue, err := json.Marshal(value)
			if err != nil {
				return nil, errors.New("Error converting from map to json: " + fieldID)
			}
			inserts[fieldName] = jsonValue
			continue
		}

		inserts[fieldName] = value

	}

	return inserts, nil
}

func processUpdate(change adapt.ChangeRequest, collectionName string, collectionMetadata *adapt.CollectionMetadata, psql squirrel.StatementBuilderType, db *sql.DB) error {
	// it's an update!
	updates, postgresSQLId, idFieldName, err := getUpdatesForChange(change, collectionMetadata)
	if err != nil {
		return err
	}

	_, err = psql.Update(collectionName).SetMap(updates).RunWith(db).Where(idFieldName+" LIKE ? ", postgresSQLId).Query()

	if err != nil {
		return errors.New("Failed to Update in SQL Adapter:" + err.Error())
	}
	return nil
}

func processInsert(change adapt.ChangeRequest, collectionName string, collectionMetadata *adapt.CollectionMetadata, psql squirrel.StatementBuilderType, db *sql.DB, idTemplate *template.Template) (string, error) {
	// it's an insert!
	newID, err := templating.Execute(idTemplate, change.FieldChanges)
	if err != nil {
		return "", err
	}

	inserts, err := getInsertsForChange(change, collectionMetadata)
	if err != nil {
		return "", err
	}

	if newID == "" {
		newID = guuid.New().String()
	}

	idFieldMetadata, err := collectionMetadata.GetIDField()
	if err != nil {
		return "", err
	}
	fieldName, err := GetDBFieldName(idFieldMetadata)
	if err != nil {
		return "", err
	}

	if _, exist := inserts[fieldName]; !exist {
		if newID != "" {
			inserts[fieldName] = newID
		} else {
			newID = guuid.New().String()
			inserts[fieldName] = newID
		}
	}

	result, err := psql.Insert(collectionName).SetMap(inserts).RunWith(db).Query()

	if err != nil {
		return "", errors.New("Failed to insert in SQL Adapter:" + err.Error())
	}

	err = result.Scan(newID)
	if err != nil {
		return "", errors.New("Failed to insert in SQL Adapter:" + err.Error())
	}
	return newID, nil
}

//ProcessChanges function
func ProcessChanges(changes map[string]adapt.ChangeRequest, collectionName string, collectionMetadata *adapt.CollectionMetadata, psql squirrel.StatementBuilderType, db *sql.DB) (map[string]adapt.ChangeResult, error) {
	changeResults := map[string]adapt.ChangeResult{}

	idTemplate, err := templating.New(collectionMetadata.IDFormat)
	if err != nil {
		return nil, err
	}

	for changeID, change := range changes {
		changeResult := adapt.NewChangeResult(change)

		if !change.IsNew && change.IDValue != nil {
			err := processUpdate(change, collectionName, collectionMetadata, psql, db)
			if err != nil {
				return nil, err
			}

		} else {
			newID, err := processInsert(change, collectionName, collectionMetadata, psql, db, idTemplate)
			if err != nil {
				return nil, err
			}

			changeResult.Data[collectionMetadata.IDField] = newID
		}

		changeResults[changeID] = changeResult

	}
	return changeResults, nil
}

//ProcessDeletes function
func ProcessDeletes(deletes map[string]adapt.DeleteRequest, collectionName string, collectionMetadata *adapt.CollectionMetadata, psql squirrel.StatementBuilderType, db *sql.DB) (map[string]adapt.ChangeResult, error) {
	deleteResults := map[string]adapt.ChangeResult{}
	for deleteID, delete := range deletes {
		deleteResult := adapt.ChangeResult{}
		deleteResult.Data = map[string]interface{}{}

		postgresID, ok := delete[collectionMetadata.IDField].(string)
		if ok {

			idFieldMetadata, err := collectionMetadata.GetIDField()
			if err != nil {
				return nil, err
			}
			idFieldName, err := GetDBFieldName(idFieldMetadata)
			if err != nil {
				return nil, err
			}

			result, err := psql.Delete(collectionName).RunWith(db).Where(idFieldName+" LIKE ? ", postgresID).Query()
			if err != nil {
				return nil, errors.New("Failed to delete in SQL Adapter:" + err.Error())
			}
			err = result.Scan(deleteResult.Data[collectionMetadata.IDField])
			if err != nil {
				return nil, errors.New("Failed to delete in SQL Adapter:" + err.Error())
			}

		} else {
			return nil, errors.New("No id provided for delete")
		}

		deleteResults[deleteID] = deleteResult
	}
	return deleteResults, nil

}

//HandleLookups function
func HandleLookups(a adapt.Adapter, request adapt.SaveRequest, metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {
	lookupOps, err := adapt.GetLookupOps(request, metadata)
	if err != nil {
		return err
	}

	if len(lookupOps) > 0 {
		err := a.Load(lookupOps, metadata, credentials)
		if err != nil {
			return err
		}

		err = adapt.MergeLookupResponses(request, lookupOps, metadata)
		if err != nil {
			return err
		}
	}

	return nil
}
