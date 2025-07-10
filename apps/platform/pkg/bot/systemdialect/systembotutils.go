package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func getIDsFromUpdatesAndDeletes(request *wire.SaveOp) []string {
	keys := make([]string, len(request.Updates)+len(request.Deletes))
	index := 0
	for i := range request.Updates {
		keys[index] = request.Updates[i].IDValue
		index++
	}
	for i := range request.Deletes {
		keys[index] = request.Deletes[i].IDValue
		index++
	}
	return keys
}

func getUniqueKeysFromUpdatesAndDeletes(request *wire.SaveOp) []string {
	keys := make([]string, len(request.Updates)+len(request.Deletes))
	index := 0
	for i := range request.Updates {
		keys[index] = request.Updates[i].UniqueKey
		index++
	}
	for i := range request.Deletes {
		keys[index] = request.Deletes[i].UniqueKey
		index++
	}
	return keys
}

func getUniqueKeysFromDeletes(request *wire.SaveOp) []string {
	keys := make([]string, len(request.Deletes))
	index := 0
	for i := range request.Deletes {
		keys[index] = request.Deletes[i].UniqueKey
		index++
	}
	return keys
}

func checkValidItems(workspaceID string, items []meta.BundleableItem, session *sess.Session, connection wire.Connection) error {
	if len(items) == 0 {
		return nil
	}

	wsSession, err := datasource.AddWorkspaceContextByID(workspaceID, session, connection)
	if err != nil {
		return err
	}
	return bundle.IsValid(items, wsSession, connection)

}

func requireValue(change *wire.ChangeItem, fieldName string) (string, error) {

	value, err := change.GetFieldAsString(fieldName)
	valueIsUndefined := err != nil
	valueIsEmpty := value == ""
	isMissingInsert := change.IsNew && (valueIsUndefined || valueIsEmpty)
	isMissingUpdate := !change.IsNew && !valueIsUndefined && valueIsEmpty
	if isMissingInsert || isMissingUpdate {
		msg := fieldName + " is required"
		if change.Metadata != nil {
			if isMissingInsert {
				msg = "unable to insert new record into collection " + change.Metadata.GetFullName() + " at index " + change.RecordKey + ": " + msg
			} else {
				msg = "unable to update existing record of collection " + change.Metadata.GetFullName() + " with key " + change.RecordKey + ": " + msg
			}
		}
		return "", exceptions.NewSaveException(change.RecordKey, fieldName, msg, nil)
	}

	return value, nil

}

func newSaveExceptionError(change *wire.ChangeItem, fieldName string, msg string) error {
	var m string
	if change.Metadata != nil {
		if change.IsNew {
			m = "unable to insert new record into collection " + change.Metadata.GetFullName() + " at index " + change.RecordKey + ": "
		} else {
			m = "unable to update existing record of collection " + change.Metadata.GetFullName() + " with key " + change.RecordKey + ": "
		}
	}
	return exceptions.NewSaveException(change.RecordKey, fieldName, m+fieldName+" "+msg, nil)
}
