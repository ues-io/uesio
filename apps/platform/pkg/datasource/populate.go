package datasource

import (
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func populateTimestamps(field *adapt.FieldMetadata, timestamp int64) validationFunc {
	return func(change adapt.ChangeItem, isNew bool) error {
		// Only populate fields marked with CREATE on insert
		// Always populate the fields marked with UPDATE
		if ((field.AutoPopulate == "CREATE") && isNew) || field.AutoPopulate == "UPDATE" {
			err := change.FieldChanges.SetField(field.GetFullName(), timestamp)
			if err != nil {
				return NewSaveError(change.RecordKey, field.GetFullName(), err.Error())
			}
		}
		return nil
	}
}

func populateUser(field *adapt.FieldMetadata, user *meta.User) validationFunc {
	return func(change adapt.ChangeItem, isNew bool) error {
		// Only populate fields marked with CREATE on insert
		// Always populate the fields marked with UPDATE
		if ((field.AutoPopulate == "CREATE") && isNew) || field.AutoPopulate == "UPDATE" {
			err := change.FieldChanges.SetField(field.GetFullName(), map[string]interface{}{
				"uesio.id":        user.ID,
				"uesio.firstname": user.FirstName,
				"uesio.lastname":  user.LastName,
				"uesio.picture": map[string]interface{}{
					"uesio.id": user.GetPictureID(),
				},
			})
			if err != nil {
				return NewSaveError(change.RecordKey, field.GetFullName(), err.Error())
			}
		}
		return nil
	}
}

func getPopulationFunction(collectionMetadata *adapt.CollectionMetadata, session *sess.Session) validationFunc {

	populations := []validationFunc{}
	for _, field := range collectionMetadata.Fields {
		if field.AutoPopulate == "UPDATE" || field.AutoPopulate == "CREATE" {
			if field.Type == "TIMESTAMP" {
				timestamp := time.Now().UnixNano() / 1e6
				populations = append(populations, populateTimestamps(field, timestamp))
			}
			if field.Type == "USER" {
				user := session.GetUserInfo()
				populations = append(populations, populateUser(field, user))
			}
		}
	}

	return func(change adapt.ChangeItem, isNew bool) error {
		for _, population := range populations {
			err := population(change, isNew)
			if err != nil {
				return err
			}
		}
		return nil
	}
}

func Populate(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {

	fieldPopulations := getPopulationFunction(collectionMetadata, session)

	if op.Inserts != nil {
		for _, insert := range *op.Inserts {
			err := fieldPopulations(insert, true)
			if err != nil {
				return err
			}
		}
	}

	if op.Updates != nil {
		for _, update := range *op.Updates {
			err := fieldPopulations(update, false)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
