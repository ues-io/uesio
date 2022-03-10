package salesforce

import (
	"github.com/google/uuid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

// Save function
func (c *Connection) Save(request *adapt.SaveOp) error {

	credentials := c.credentials
	metadata := c.metadata
	/*
		client, err := connect(credentials)
		if err != nil {
			return errors.New("Failed to connect to PostgreSQL:" + err.Error())
		}
	*/

	tenantID := credentials.GetTenantID()

	recordsIDsList := map[string][]string{}

	collectionMetadata, err := metadata.GetCollection(request.CollectionName)
	if err != nil {
		return err
	}

	collectionName, err := getDBCollectionName(collectionMetadata, tenantID)
	if err != nil {
		return err
	}

	// Process Inserts
	idTemplate, err := adapt.NewFieldChanges(collectionMetadata.IDFormat, collectionMetadata)
	if err != nil {
		return err
	}

	for _, change := range *request.Inserts {

		newID, err := templating.Execute(idTemplate, change.FieldChanges)
		if err != nil {
			return err
		}

		if newID == "" {
			newID = uuid.New().String()
		}

		err = change.FieldChanges.Loop(func(fieldID string, value interface{}) error {
			return nil
		})
		if err != nil {
			return err
		}

		err = change.FieldChanges.SetField(adapt.ID_FIELD, newID)
		if err != nil {
			return err
		}

	}

	for _, change := range *request.Updates {

		if change.IDValue == "" {
			continue
		}

		err = change.FieldChanges.Loop(func(fieldID string, value interface{}) error {
			fieldMetadata, err := collectionMetadata.GetField(fieldID)
			if err != nil {
				return err
			}
			if fieldID == adapt.ID_FIELD {
				// Don't set the id field here
				return nil
			}
			if fieldMetadata.AutoPopulate == "CREATE" {
				return nil
			}
			return nil
		})
		if err != nil {
			return err
		}

		fullRecordID := collectionName + ":" + change.IDValue

		if collectionMetadata.Access == "protected" {
			recordsIDsList[fullRecordID] = change.ReadWriteTokens
		}
	}

	for _, delete := range *request.Deletes {

		if delete.IDValue == "" {
			continue
		}

	}

	return nil
}
