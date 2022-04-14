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
	return func(change adapt.ChangeItem) *adapt.SaveError {
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
	return func(change adapt.ChangeItem) *adapt.SaveError {
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
	return func(change adapt.ChangeItem) *adapt.SaveError {
		// Only populate fields marked with CREATE on insert
		// Always populate the fields marked with UPDATE
		if ((field.AutoPopulate == "CREATE") && change.IsNew) || field.AutoPopulate == "UPDATE" {
			err := change.FieldChanges.SetField(field.GetFullName(), map[string]interface{}{
				adapt.ID_FIELD:         user.ID,
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

	autonumberStart, err := getAutonumber(len(op.Inserts), connection, collectionMetadata)
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

	if op.Inserts != nil {
		for i := range op.Inserts {
			op.Inserts[i].Autonumber = autonumberStart + i
			for _, population := range populations {
				err := population(op.Inserts[i])
				if err != nil {
					op.AddError(err)
				}
			}
		}
	}

	if op.Updates != nil {
		for i := range op.Updates {
			for _, population := range populations {
				err := population(op.Updates[i])
				if err != nil {
					op.AddError(err)
				}
			}
		}
	}

	return nil
}
