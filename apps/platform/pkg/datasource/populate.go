package datasource

import (
	"fmt"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type ChangeProcessor func(change *wire.ChangeItem) *exceptions.SaveException

func populateAutoID(field *wire.FieldMetadata) ChangeProcessor {
	return func(change *wire.ChangeItem) *exceptions.SaveException {
		// only apply auto id to new records (inserts)
		if !change.IsNew {
			return nil
		}

		// if there is a current value, do not overwrite it
		// TODO: Maintaining backwards compat and simply ignoring ANY error that occurs from GetFieldAsString. Note that the error
		// could be because there was no value present on the change for the field or some other error occurred.  There needs
		// to be a way to differentiate so that if an unexpected error ocurred, we can return and not potentially overwrite a value
		// that is present.
		if current, err := change.GetFieldAsString(field.GetFullName()); err == nil && current != "" {
			return nil
		}

		autoNumberMeta := field.AutoNumberMetadata
		if autoNumberMeta == nil {
			autoNumberMeta = &meta.DefaultAutoNumberMetadata
		}

		aid, err := getAutoID()
		if err != nil {
			return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), "", err)
		}

		var an string
		if autoNumberMeta.Format == "" {
			an = aid
		} else {
			// TODO: Could consider supporting escaping {id} token if the user really wants the text {id} in the value. For now,
			// replacing all occurences of the token with the auto id
			an = strings.ReplaceAll(autoNumberMeta.Format, "{id}", aid)
		}

		if err := change.FieldChanges.SetField(field.GetFullName(), an); err != nil {
			return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), "", err)
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
				return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), "", err)
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
			err := change.FieldChanges.SetField(field.GetFullName(), map[string]any{
				commonfields.Id:        user.ID,
				commonfields.UniqueKey: user.UniqueKey, //TO-DO this not sure should be UUIIDD
				"uesio/core.firstname": user.FirstName,
				"uesio/core.lastname":  user.LastName,
				"uesio/core.picture": map[string]any{
					commonfields.Id: user.GetPictureID(),
				},
			})
			if err != nil {
				return exceptions.NewSaveException(change.RecordKey, field.GetFullName(), "", err)
			}
		}
		return nil
	}
}

func Populate(op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	collectionKey := op.CollectionName

	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return err
	}

	var populations []ChangeProcessor
	for _, field := range collectionMetadata.Fields {
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
			populations = append(populations, populateAutoID(field))
		}
	}

	return op.LoopChanges(func(change *wire.ChangeItem) error {
		for _, population := range populations {
			if saveErr := population(change); saveErr != nil {
				op.AddError(saveErr)
			}
		}
		// Enforce field-level security for save
		return change.Loop(func(field string, value any) error {
			if !session.GetContextPermissions().HasFieldEditPermission(collectionKey, field) {
				return exceptions.NewForbiddenException(fmt.Sprintf("Profile %s does not have edit access to the %s field.", session.GetContextProfile(), field))
			}
			return nil
		})
	})
}
