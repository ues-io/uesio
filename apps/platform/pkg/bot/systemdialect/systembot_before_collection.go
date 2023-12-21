package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runCollectionBeforeSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	err := request.LoopChanges(func(change *wire.ChangeItem) error {

		_, err := requireValue(change, "uesio/studio.label")
		if err != nil {
			return err
		}

		_, err = requireValue(change, "uesio/studio.plurallabel")
		if err != nil {
			return err
		}

		nameField, _ := change.GetFieldAsString("uesio/studio.namefield")
		if nameField != "" {
			workspaceID, err := change.GetField(meta.WORKSPACE_COLLECTION_NAME + "->" + wire.ID_FIELD)
			if err != nil {
				return err
			}
			_, namenameField, err := meta.ParseKey(nameField)
			if err != nil {
				return err
			}
			var nameFieldMetadata meta.Field
			err = datasource.PlatformLoadOne(
				&nameFieldMetadata,
				&datasource.PlatformLoadOptions{
					Conditions: []wire.LoadRequestCondition{
						{
							Field: "uesio/studio.name",
							Value: namenameField,
						},
						{
							Field: meta.WORKSPACE_COLLECTION_NAME,
							Value: workspaceID,
						},
					},
					Params:     request.Params,
					Connection: connection,
				},
				session,
			)
			if err != nil {
				return err
			}

			if !isTextAlike(nameFieldMetadata.Type) {
				return errors.New("The Name Field of a collection must be of type text")
			}

		}

		return nil
	})
	if err != nil {
		return err
	}

	return nil
}
