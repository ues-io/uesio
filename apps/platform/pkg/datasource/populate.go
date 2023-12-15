package datasource

import (
	"fmt"
	"strconv"
	"time"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type ChangeProcessor func(change *wire.ChangeItem) *exceptions.SaveException

func populateAutoNumbers(field *wire.FieldMetadata) ChangeProcessor {
	return func(change *wire.ChangeItem) *exceptions.SaveException {
		if !change.IsNew {
			return nil
		}

		autoNumberMeta := field.AutoNumberMetadata
		if autoNumberMeta == nil {
			autoNumberMeta = (*wire.AutoNumberMetadata)(&meta.DefaultAutoNumberMetadata)
		}
		format := "%0" + strconv.Itoa(autoNumberMeta.LeadingZeros) + "d"
		suffix := fmt.Sprintf(format, change.Autonumber)

		an := autoNumberMeta.Prefix + "-" + suffix
		if autoNumberMeta.Prefix == "" {
			an = suffix
		}

		// See if we're trying to set this value for an insert.
		// If so, don't set the autonumber and just keep its current value.
		current, err := change.GetFieldAsString(field.GetFullName())
		if err == nil && current != "" {
			return nil
		}

		if err = change.FieldChanges.SetField(field.GetFullName(), an); err != nil {
			return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), err.Error())
		}

		return nil
	}
}

func populateTimestamps(field *wire.FieldMetadata, timestamp int64) ChangeProcessor {
	return func(change *wire.ChangeItem) *exceptions.SaveException {
		// Only populate fields marked with CREATE on insert
		// Always populate the fields marked with UPDATE
		if ((field.AutoPopulate == "CREATE") && change.IsNew) || field.AutoPopulate == "UPDATE" {
			if err := change.FieldChanges.SetField(field.GetFullName(), timestamp); err != nil {
				return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), err.Error())
			}
		}
		return nil
	}
}

func populateUser(field *wire.FieldMetadata, user *meta.User) ChangeProcessor {
	return func(change *wire.ChangeItem) *exceptions.SaveException {
		// Only populate fields marked with CREATE on insert
		// Always populate the fields marked with UPDATE
		if ((field.AutoPopulate == "CREATE") && change.IsNew) || field.AutoPopulate == "UPDATE" {
			err := change.FieldChanges.SetField(field.GetFullName(), map[string]interface{}{
				wire.ID_FIELD:          user.ID,
				wire.UNIQUE_KEY_FIELD:  user.UniqueKey, //TO-DO this not sure should be UUIIDD
				"uesio/core.firstname": user.FirstName,
				"uesio/core.lastname":  user.LastName,
				"uesio/core.picture": map[string]interface{}{
					wire.ID_FIELD: user.GetPictureID(),
				},
			})
			if err != nil {
				return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), err.Error())
			}
		}
		return nil
	}
}

func Populate(op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	collectionKey := op.Metadata.GetFullName()

	autonumberStart, err := getAutonumber(connection, op.Metadata, session)
	if err != nil {
		return err
	}

	var populations []ChangeProcessor
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

	return op.LoopChanges(func(change *wire.ChangeItem) error {
		if change.IsNew {
			autonumberStart++
			change.Autonumber = autonumberStart
		}
		for _, population := range populations {
			if saveErr := population(change); saveErr != nil {
				op.AddError(saveErr)
			}
		}
		// Enforce field-level security for save
		return change.Loop(func(field string, value interface{}) error {
			if !session.GetContextPermissions().HasFieldEditPermission(collectionKey, field) {
				return exceptions.NewForbiddenException(fmt.Sprintf("Profile %s does not have edit access to the %s field.", session.GetContextProfile(), field))
			}
			return nil
		})
	})
}
