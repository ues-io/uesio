package systemdialect

import (
	"context"
	"io"
	"slices"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

const USER_FILE_DATA_FIELD = "uesio/core.data"

func runUserfileLoadBot(ctx context.Context, op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

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

	err := datasource.LoadOp(ctx, op, connection, session)
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

		r, _, err := filesource.Download(ctx, userFileIDString, session)
		if err != nil {
			return err
		}
		defer r.Close()

		b, err := io.ReadAll(r)
		err = item.SetField(USER_FILE_DATA_FIELD, string(b))
		if err != nil {
			return err
		}
		return nil
	})

}
