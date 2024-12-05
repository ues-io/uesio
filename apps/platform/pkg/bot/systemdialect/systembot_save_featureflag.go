package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runFeatureFlagSaveBot(op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	userID := session.GetContextUser().ID

	err := op.LoopUpdates(func(change *wire.ChangeItem) error {
		value, err := change.GetField("uesio/core.value")
		if err != nil {
			return err
		}
		key, err := change.GetFieldAsString("uesio/core.id")
		if err != nil {
			return err
		}
		return featureflagstore.SetValue(key, value, userID, session)
	})
	if err != nil {
		return err
	}
	return op.LoopDeletes(func(change *wire.ChangeItem) error {
		key, err := change.GetFieldAsString("uesio/core.id")
		if err != nil {
			return err
		}
		return featureflagstore.Remove(key, userID, session)
	})
}
