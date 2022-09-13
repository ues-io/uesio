package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getTotal(change *adapt.ChangeItem) (float64, error) {
	var oldTotal, newTotal float64
	oldVal, err := change.GetOldField("uesio/core.total")
	if err != nil {
		return 0, err
	}

	oldInt, ok := oldVal.(float64)
	if ok {
		oldTotal = oldInt
	}

	newVal, err := change.GetField("uesio/core.total")
	if err != nil {
		return 0, err
	}

	newInt, ok := newVal.(float64)
	if ok {
		newTotal = newInt
	}

	return oldTotal + newTotal, nil
}

func getSize(change *adapt.ChangeItem) (float64, error) {
	var oldSize, newSize float64
	oldVal, err := change.GetOldField("uesio/core.size")
	if err != nil {
		return 0, err
	}

	oldInt, ok := oldVal.(float64)
	if ok {
		oldSize = oldInt
	}

	newVal, err := change.GetField("uesio/core.size")
	if err != nil {
		return 0, err
	}

	newInt, ok := newVal.(float64)
	if ok {
		newSize = newInt
	}

	return oldSize + newSize, nil
}

func runUsageBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return request.LoopChanges(func(change *adapt.ChangeItem) error {
		total, err := getTotal(change)
		if err != nil {
			return err
		}

		err = change.SetField("uesio/core.total", total)

		if err != nil {
			return err
		}

		size, err := getSize(change)
		if err != nil {
			return err
		}

		return change.SetField("uesio/core.size", size)
	})
}
