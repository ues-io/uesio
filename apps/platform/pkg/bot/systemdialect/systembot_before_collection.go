package systemdialect

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runCollectionBeforeSaveBot(ctx context.Context, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	err := request.LoopChanges(func(change *wire.ChangeItem) error {

		_, err := requireValue(change, "uesio/studio.label")
		if err != nil {
			return err
		}

		_, err = requireValue(change, "uesio/studio.plurallabel")
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return err
	}

	return nil
}
