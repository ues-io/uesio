package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func getTotal(change *wire.ChangeItem) (int64, error) {

	oldTotal, err := change.GetOldFieldAsInt("uesio/studio.total")
	if err != nil {
		return 0, err
	}

	newTotal, err := change.GetFieldAsInt("uesio/studio.total")
	if err != nil {
		return 0, err
	}

	return oldTotal + newTotal, nil
}

func runUsageBeforeSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	return request.LoopChanges(func(change *wire.ChangeItem) error {
		total, err := getTotal(change)
		if err != nil {
			return err
		}
		return change.SetField("uesio/studio.total", total)
	})
}
