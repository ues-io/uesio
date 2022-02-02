package datasource

import (
	"fmt"
	"strconv"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func populateAutoNumbers(field *adapt.FieldMetadata) validationFunc {
	return func(change adapt.ChangeItem, isNew bool) error {
		if isNew {
			autoNumberMeta := field.AutoNumberMetadata
			if autoNumberMeta == nil {
				return NewSaveError(change.RecordKey, field.GetFullName(), "Missing autonumber metadata")
			}
			format := "%0" + strconv.Itoa(autoNumberMeta.LeadingZeros) + "d"
			sufix := fmt.Sprintf(format, change.Autonumber)
			an := autoNumberMeta.Prefix + "-" + sufix
			err := change.FieldChanges.SetField(field.GetFullName(), an)
			if err != nil {
				return NewSaveError(change.RecordKey, field.GetFullName(), err.Error())
			}
		}
		return nil
	}
}

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
		if field.Type == "AUTONUMBER" {
			populations = append(populations, populateAutoNumbers(field))
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

func Populate(op *adapt.SaveOp, collectionMetadata *adapt.CollectionMetadata, autonumberStart int, session *sess.Session) error {

	fieldPopulations := getPopulationFunction(collectionMetadata, session)

	if op.Inserts != nil {
		for i := range *op.Inserts {
			(*op.Inserts)[i].Autonumber = autonumberStart + i
			err := fieldPopulations((*op.Inserts)[i], true)
			if err != nil {
				return err
			}
		}
	}

	if op.Updates != nil {
		for i := range *op.Updates {
			err := fieldPopulations((*op.Updates)[i], false)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
