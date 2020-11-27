package sqlshared

import (
	"database/sql"
	"encoding/json"
	"errors"
	"text/template"

	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/reqs"

	"github.com/Masterminds/squirrel"
	guuid "github.com/google/uuid"
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func getUpdatesForChange(change reqs.ChangeRequest, collectionMetadata *adapters.CollectionMetadata) (map[string]interface{}, string, string, error) {
	postgresSQLUpdate := map[string]interface{}{}
	postgresSQLId, _ := change[collectionMetadata.IDField].(string)
	idFieldName := ""

	searchableValues := []string{}
	for fieldID, value := range change {
		if fieldID == collectionMetadata.IDField {
			// We don't need to add the id field to the update
			idFieldMetadata, ok := collectionMetadata.Fields[collectionMetadata.IDField]
			if !ok {
				return nil, "", "", errors.New("Error getting metadata for the ID field")
			}
			idFieldName, _ = GetDBFieldName(idFieldMetadata)
			continue
		}

		if fieldID == collectionMetadata.NameField {
			searchableValues = append(searchableValues, value.(string))
		}
		fieldMetadata, ok := collectionMetadata.Fields[fieldID]
		if !ok {
			return nil, "", "", errors.New("No metadata provided for field: " + fieldID)
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

func getInsertsForChange(change reqs.ChangeRequest, collectionMetadata *adapters.CollectionMetadata) (map[string]interface{}, error) {
	inserts := map[string]interface{}{}
	searchableValues := []string{}
	for fieldID, value := range change {
		fieldMetadata, ok := collectionMetadata.Fields[fieldID]
		if !ok {
			return nil, errors.New("No metadata provided for field: " + fieldID)
		}

		if fieldID == collectionMetadata.NameField {
			searchableValues = append(searchableValues, value.(string))
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

func processUpdate(change reqs.ChangeRequest, collectionName string, collectionMetadata *adapters.CollectionMetadata, psql squirrel.StatementBuilderType, db *sql.DB, postgresID string) error {
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

func processInsert(change reqs.ChangeRequest, collectionName string, collectionMetadata *adapters.CollectionMetadata, psql squirrel.StatementBuilderType, db *sql.DB, idTemplate *template.Template) (string, error) {
	// it's an insert!
	newID, err := templating.Execute(idTemplate, change)
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

	idFieldMetadata, ok := collectionMetadata.Fields[collectionMetadata.IDField]
	if !ok {
		return "", errors.New("No metadata provided for field: " + collectionMetadata.IDField)
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

	result.Scan(newID)
	return newID, nil
}

//ProcessChanges function
func ProcessChanges(changes map[string]reqs.ChangeRequest, collectionName string, collectionMetadata *adapters.CollectionMetadata, psql squirrel.StatementBuilderType, db *sql.DB) (map[string]reqs.ChangeResult, error) {
	changeResults := map[string]reqs.ChangeResult{}

	idTemplate, err := templating.New(collectionMetadata.IDFormat)
	if err != nil {
		return nil, err
	}

	for changeID, change := range changes {
		changeResult := reqs.ChangeResult{}
		changeResult.Data = change

		postgresID, ok := change[collectionMetadata.IDField].(string)
		if ok && postgresID != "" {
			err := processUpdate(change, collectionName, collectionMetadata, psql, db, postgresID)
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
func ProcessDeletes(deletes map[string]reqs.DeleteRequest, collectionName string, collectionMetadata *adapters.CollectionMetadata, psql squirrel.StatementBuilderType, db *sql.DB) (map[string]reqs.ChangeResult, error) {
	deleteResults := map[string]reqs.ChangeResult{}
	for deleteID, delete := range deletes {
		deleteResult := reqs.ChangeResult{}
		deleteResult.Data = map[string]interface{}{}

		postgresID, ok := delete[collectionMetadata.IDField].(string)
		if ok {

			idFieldMetadata, ok := collectionMetadata.Fields[collectionMetadata.IDField]
			if !ok {
				return nil, errors.New("Error getting metadata for the ID field")
			}
			idFieldName, err := GetDBFieldName(idFieldMetadata)
			if err != nil {
				return nil, err
			}

			result, err := psql.Delete(collectionName).RunWith(db).Where(idFieldName+" LIKE ? ", postgresID).Query()
			if err != nil {
				return nil, errors.New("Failed to delete in SQL Adapter:" + err.Error())
			}
			result.Scan(deleteResult.Data[collectionMetadata.IDField])

		} else {
			return nil, errors.New("No id provided for delete")
		}

		deleteResults[deleteID] = deleteResult
	}
	return deleteResults, nil

}

//HandleLookups function
func HandleLookups(a adapters.Adapter, request reqs.SaveRequest, metadata *adapters.MetadataCache, credentials *creds.AdapterCredentials) error {
	lookupRequests, err := adapters.GetLookupRequests(request, metadata)
	if err != nil {
		return err
	}

	if lookupRequests != nil && len(lookupRequests) > 0 {
		lookupResponses, err := a.Load(lookupRequests, metadata, credentials)
		if err != nil {
			return err
		}

		err = adapters.MergeLookupResponses(request, lookupResponses, metadata)
		if err != nil {
			return err
		}
	}

	return nil
}
