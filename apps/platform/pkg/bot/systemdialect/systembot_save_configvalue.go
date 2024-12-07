package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runConfigValueSaveBot(op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	err := op.LoopUpdates(func(change *wire.ChangeItem) error {

		key, err := change.GetFieldAsString("uesio/core.id")
		if err != nil {
			return err
		}

		value, err := change.GetFieldAsString("uesio/core.value")
		if err != nil {
			return err
		}

		return configstore.SetValue(key, value, session)
	})
	if err != nil {
		return err
	}
	return op.LoopDeletes(func(change *wire.ChangeItem) error {
		key, err := change.GetFieldAsString("uesio/core.id")
		if err != nil {
			return err
		}
		return configstore.Remove(key, session)
	})
}
