package systemdialect

import (
	"context"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runFieldBeforeSaveBot(ctx context.Context, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	// early return if we only have deletes
	if !request.HasChanges() {
		return nil
	}

	wsAccessResult := datasource.RequestWorkspaceWriteAccess(ctx, request.Params, connection, session)
	if !wsAccessResult.HasWriteAccess() {
		return wsAccessResult.Error()
	}
	workspaceID := wsAccessResult.GetWorkspaceID()

	depMap := wire.MetadataDependencyMap{}

	err := request.LoopChanges(func(change *wire.ChangeItem) error {

		ftype, err := change.GetFieldAsString("uesio/studio.type")
		if err != nil {
			return err
		}

		_, ok := meta.GetFieldTypes()[ftype]
		if !ok {
			return fmt.Errorf("invalid field type for field: %s", ftype)
		}

		err = depMap.AddRequired(change, "collection", "uesio/studio.collection")
		if err != nil {
			return err
		}

		err = depMap.AddOptional(change, "label", "uesio/studio.languagelabel")
		if err != nil {
			return err
		}

		_, err = change.GetField("uesio/studio.validate")
		if err == nil {
			validateType, _ := change.GetFieldAsString("uesio/studio.validate->uesio/studio.type")
			if validateType == "REGEX" {
				err = depMap.AddRequired(change, "field", "uesio/studio.validate->uesio/studio.regex")
				if err != nil {
					return err
				}
			}
		}

		switch ftype {
		case "AUTONUMBER":
			// TODO: There is no way to differentiate between "NoValue" or "Some other error" currently
			// so we follow existing behavior in other places and "assume" that any error is "no value".
			// Per comment in GetFieldAsString, there needs to be a way to differentiate between these
			// two scenarios
			f, _ := change.GetFieldAsString("uesio/studio.autonumber->uesio/studio.format")
			if f != "" && !strings.Contains(f, "{id}") {
				return newSaveExceptionError(change, "uesio/studio.autonumber->uesio/studio.format", "invalid autoid format, must contain {id} token")
			}
		case "FILE":
			_, err := requireValue(change, "uesio/studio.file->uesio/studio.accept")
			if err != nil {
				return err
			}
		case "SELECT", "MULTISELECT":
			err = depMap.AddRequired(change, "selectlist", "uesio/studio.selectlist")
			if err != nil {
				return err
			}
		case "REFERENCE":
			isMultiCollection, err := change.GetField("uesio/studio.reference->uesio/studio.multicollection")
			if err != nil {
				// GetField throws an error if the field it's trying to find is undefined.
				// In this case, it's fine if uesio/studio.multicollection is undefined. We still check
				// to make sure that the uesio/studio.collection field exists and is valid.
				isMultiCollection = false
			}
			if isMultiCollection == nil || !isMultiCollection.(bool) {
				err = depMap.AddRequired(change, "collection", "uesio/studio.reference->uesio/studio.collection")
				if err != nil {
					return err
				}
			}
		case "FORMULA":

			_, err := requireValue(change, "uesio/studio.formula->uesio/studio.expression")
			if err != nil {
				return err
			}

			_, err = requireValue(change, "uesio/studio.formula->uesio/studio.returntype")
			if err != nil {
				return err
			}

		}

		return nil
	})
	if err != nil {
		return err
	}

	items, err := depMap.GetItems()
	if err != nil {
		return err
	}

	return checkValidItems(ctx, workspaceID, items, session, connection)

}
