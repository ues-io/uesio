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
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		if !change.IsNew {
			return nil
		}

		autoNumberMeta := field.AutoNumberMetadata
		if autoNumberMeta == nil {
			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), "Missing autonumber metadata")
		}
		format := "%0" + strconv.Itoa(autoNumberMeta.LeadingZeros) + "d"
		sufix := fmt.Sprintf(format, change.Autonumber)
		an := autoNumberMeta.Prefix + "-" + sufix
		err := change.FieldChanges.SetField(field.GetFullName(), an)
		if err != nil {
			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), err.Error())
		}

		return nil
	}
}

func populateTimestamps(field *adapt.FieldMetadata, timestamp int64) validationFunc {
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		// Only populate fields marked with CREATE on insert
		// Always populate the fields marked with UPDATE
		if ((field.AutoPopulate == "CREATE") && change.IsNew) || field.AutoPopulate == "UPDATE" {
			err := change.FieldChanges.SetField(field.GetFullName(), timestamp)
			if err != nil {
				return adapt.NewSaveError(change.RecordKey, field.GetFullName(), err.Error())
			}
		}
		return nil
	}
}

func populateUser(field *adapt.FieldMetadata, user *meta.User) validationFunc {
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		// Only populate fields marked with CREATE on insert
		// Always populate the fields marked with UPDATE
		if ((field.AutoPopulate == "CREATE") && change.IsNew) || field.AutoPopulate == "UPDATE" {
			err := change.FieldChanges.SetField(field.GetFullName(), map[string]interface{}{
				adapt.ID_FIELD:         user.ID,
				adapt.UNIQUE_KEY_FIELD: user.UniqueKey, //TO-DO this not sure should be UUIIDD
				"uesio/core.firstname": user.FirstName,
				"uesio/core.lastname":  user.LastName,
				"uesio/core.picture": map[string]interface{}{
					adapt.ID_FIELD: user.GetPictureID(),
				},
			})
			if err != nil {
				return adapt.NewSaveError(change.RecordKey, field.GetFullName(), err.Error())
			}
		}
		return nil
	}
}

func Populate(op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	collectionMetadata, err := connection.GetMetadata().GetCollection(op.CollectionName)
	if err != nil {
		return err
	}

	autonumberStart, err := getAutonumber(op.InsertCount, connection, collectionMetadata, session)
	if err != nil {
		return err
	}

	populations := []validationFunc{}
	for _, field := range collectionMetadata.Fields {
		if field.AutoPopulate == "UPDATE" || field.AutoPopulate == "CREATE" {
			if field.Type == "TIMESTAMP" {
				timestamp := time.Now().UnixMilli()
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

	insertIndex := 0
	return op.LoopChanges(func(change *adapt.ChangeItem) error {
		if change.IsNew {
			change.Autonumber = autonumberStart + insertIndex
			insertIndex++
		}
		for _, population := range populations {
			err := population(change)
			if err != nil {
				op.AddError(err)
			}
		}
		return nil
	})
}
