package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getTotal(change *adapt.ChangeItem) (int64, error) {

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

func runUsageBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return request.LoopChanges(func(change *adapt.ChangeItem) error {
		total, err := getTotal(change)
		if err != nil {
			return err
		}
		return change.SetField("uesio/studio.total", total)
	})
}
