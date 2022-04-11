package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getOldValue(change *adapt.ChangeItem) float64 {

	if change.OldValues != nil {

		value, _ := change.OldValues.GetField("uesio/core.total")

		if value != nil {
			return value.(float64)
		}
	}

	return 0

}

func getNewValue(change *adapt.ChangeItem) float64 {

	if change.FieldChanges != nil {

		value, _ := change.FieldChanges.GetField("uesio/core.total")

		if value != nil {
			return value.(float64)
		}
	}

	return 0

}

func runUsageBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	err := request.LoopChanges(func(change *adapt.ChangeItem) error {

		oldVal := getOldValue(change)
		newVal := getNewValue(change)
		total := oldVal + newVal

		change.SetField("uesio/core.total", total)

		return nil
	})
	if err != nil {
		return err
	}

	return nil

}
