package datasource

import (
	"fmt"
	"strconv"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type ChangeProcessor func(change *adapt.ChangeItem) *adapt.SaveError

func populateAutoNumbers(field *adapt.FieldMetadata) ChangeProcessor {
	return func(change *adapt.ChangeItem) *adapt.SaveError {
		if !change.IsNew {
			return nil
		}

		autoNumberMeta := field.AutoNumberMetadata
		if autoNumberMeta == nil {
			autoNumberMeta = (*adapt.AutoNumberMetadata)(&meta.DefaultAutoNumberMetadata)
		}
		format := "%0" + strconv.Itoa(autoNumberMeta.LeadingZeros) + "d"
		sufix := fmt.Sprintf(format, change.Autonumber)

		an := autoNumberMeta.Prefix + "-" + sufix
		if autoNumberMeta.Prefix == "" {
			an = sufix
		}

		// See if we're trying to set this value for an insert.
		// If so, don't set the autonumber and just keep its current
		// value.
		current, err := change.GetFieldAsString(field.GetFullName())
		if err == nil && current != "" {
			return nil
		}

		err = change.FieldChanges.SetField(field.GetFullName(), an)
		if err != nil {
			return adapt.NewSaveError(change.RecordKey, field.GetFullName(), err.Error())
		}

		return nil
	}
}

func populateTimestamps(field *adapt.FieldMetadata, timestamp int64) ChangeProcessor {
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

func populateUser(field *adapt.FieldMetadata, user *meta.User) ChangeProcessor {
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

	collectionKey := op.Metadata.GetFullName()

	autonumberStart, err := getAutonumber(op.InsertCount, connection, op.Metadata, session)
	if err != nil {
		return err
	}

	populations := []ChangeProcessor{}
	for _, field := range op.Metadata.Fields {
		if field.AutoPopulate == "UPDATE" || field.AutoPopulate == "CREATE" {
			if field.Type == "TIMESTAMP" {
				timestamp := time.Now().Unix()
				populations = append(populations, populateTimestamps(field, timestamp))
			}
			if field.Type == "USER" {
				user := session.GetContextUser()
				populations = append(populations, populateUser(field, user))
			}
		} else if field.Type == "AUTONUMBER" {
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
		// Enforce field-level security for save
		return change.Loop(func(field string, value interface{}) error {
			if !session.GetContextPermissions().HasFieldEditPermission(collectionKey, field) {
				return fmt.Errorf("Profile %s does not have edit access to the %s field.", session.GetContextProfile(), field)
			}
			return nil
		})
	})
}
