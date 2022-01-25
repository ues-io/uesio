package salesforce

import (
	"github.com/google/uuid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

// Save function
func (a *Adapter) Save(requests []*adapt.SaveOp, metadata *adapt.MetadataCache, credentials *adapt.Credentials, userTokens []string) error {

	/*
		client, err := connect(credentials)
		if err != nil {
			return errors.New("Failed to connect to PostgreSQL:" + err.Error())
		}
	*/

	tenantID := credentials.GetTenantID()

	recordsIDsList := map[string][]string{}

	for _, request := range requests {

		collectionMetadata, err := metadata.GetCollection(request.CollectionName)
		if err != nil {
			return err
		}

		collectionName, err := getDBCollectionName(collectionMetadata, tenantID)
		if err != nil {
			return err
		}

		idFieldMetadata, err := collectionMetadata.GetIDField()
		if err != nil {
			return err
		}

		idFieldDBName := idFieldMetadata.GetFullName()

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

			err = change.FieldChanges.SetField(idFieldDBName, newID)
			if err != nil {
				return err
			}

		}

		for _, change := range *request.Updates {

			if change.IDValue == nil {
				continue
			}

			err = change.FieldChanges.Loop(func(fieldID string, value interface{}) error {
				fieldMetadata, err := collectionMetadata.GetField(fieldID)
				if err != nil {
					return err
				}
				if fieldID == idFieldDBName {
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

			fullRecordID := collectionName + ":" + change.IDValue.(string)

			if collectionMetadata.Access == "protected" {
				recordsIDsList[fullRecordID] = change.ReadWriteTokens
			}
		}

		for _, delete := range *request.Deletes {

			if delete.IDValue == nil {
				continue
			}

		}
	}

	return nil
}
