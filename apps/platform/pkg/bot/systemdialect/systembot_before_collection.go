package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runCollectionBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	err := request.LoopChanges(func(change *adapt.ChangeItem) error {

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
