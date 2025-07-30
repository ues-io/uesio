package systemdialect

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/secretstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runSecretSaveBot(ctx context.Context, op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	err := op.LoopUpdates(func(change *wire.ChangeItem) error {

		key, err := change.GetFieldAsString("uesio/core.id")
		if err != nil {
			return err
		}

		value, err := change.GetFieldAsString("uesio/core.value")
		if err != nil {
			return err
		}

		return secretstore.SetSecret(ctx, key, value, session)
	})
	if err != nil {
		return err
	}
	return op.LoopDeletes(func(change *wire.ChangeItem) error {
		key, err := change.GetFieldAsString("uesio/core.id")
		if err != nil {
			return err
		}
		return secretstore.Remove(ctx, key, session)
	})
}
