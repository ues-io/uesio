package systemdialect

import (
	"bytes"
	"slices"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

const USER_FILE_DATA_FIELD = "uesio/core.data"

func runUserfileLoadBot(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	// If the op included the uesio/core.data field, get it separately.
	hasDataField := false
	originalFields := op.Fields
	newSlice := slices.DeleteFunc(op.Fields, func(field wire.LoadRequestField) bool {
		isDataField := field.ID == USER_FILE_DATA_FIELD
		if isDataField {
			hasDataField = true
		}
		return isDataField
	})

	if hasDataField {
		op.Fields = newSlice
	}

	err := datasource.LoadOp(op, connection, session)
	if err != nil {
		return err
	}

	if !hasDataField {
		return nil
	}

	op.Fields = originalFields

	return op.Collection.Loop(func(item meta.Item, index string) error {
		userFileID, err := item.GetField(commonfields.Id)
		if err != nil {
			return err
		}

		userFileIDString, ok := userFileID.(string)
		if !ok || userFileIDString == "" {
			return nil
		}

		buf := &bytes.Buffer{}
		_, err = filesource.Download(buf, userFileIDString, session)
		if err != nil {
			return err
		}
		err = item.SetField(USER_FILE_DATA_FIELD, buf.String())
		if err != nil {
			return err
		}
		return nil
	})

}
