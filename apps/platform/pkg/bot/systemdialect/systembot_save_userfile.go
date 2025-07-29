package systemdialect

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runUserfileSaveBot(op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	fileData := []string{}
	err := op.LoopChanges(func(change *wire.ChangeItem) error {
		if change.IsNew {
			// It's ok if we have an error here.
			fieldID, _ := change.GetFieldAsString("uesio/core.fieldid")
			change.SetField("uesio/core.type", filesource.GetFileType(fieldID))
		}
		value, err := change.GetFieldAsString(USER_FILE_DATA_FIELD)
		if err != nil {
			// Ignore missing data field
			return nil
		}
		fileData = append(fileData, value)

		// Remove the data field so it's not put into the database
		return change.SetField(USER_FILE_DATA_FIELD, nil)
	})
	if err != nil {
		return err
	}

	err = datasource.SaveOp(op, connection, session)
	if err != nil {
		return err
	}

	if len(fileData) == 0 {
		return nil
	}

	uploadOps := []*filesource.FileUploadOp{}

	index := 0
	err = op.LoopChanges(func(change *wire.ChangeItem) error {
		path, err := change.GetFieldAsString("uesio/core.path")
		if err != nil {
			return err
		}
		collectionID, err := change.GetFieldAsString("uesio/core.collectionid")
		if err != nil {
			return err
		}
		recordID, err := change.GetFieldAsString("uesio/core.recordid")
		if err != nil {
			return err
		}
		// It's ok if we have an error here.
		fieldID, _ := change.GetFieldAsString("uesio/core.fieldid")
		data := fileData[index]
		uploadOps = append(uploadOps, &filesource.FileUploadOp{
			Data:         strings.NewReader(data),
			Path:         path,
			CollectionID: collectionID,
			RecordID:     recordID,
			FieldID:      fieldID,
		})
		index = index + 1

		// Add the change back
		return change.SetField(USER_FILE_DATA_FIELD, data)
	})
	if err != nil {
		return err
	}

	_, err = filesource.Upload(session.Context(), uploadOps, connection, session, op.Params)
	if err != nil {
		return err
	}

	return nil
}
