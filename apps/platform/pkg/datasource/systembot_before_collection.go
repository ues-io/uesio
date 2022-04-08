package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runCollectionBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	err := request.LoopChanges(func(change *adapt.ChangeItem) error {

		label, err := change.GetFieldAsString("uesio/studio.label")
		if err != nil {
			return err
		}

		if err = isRequired(label, "Collection", "Label"); err != nil {
			return err
		}

		plabel, err := change.GetFieldAsString("uesio/studio.plurallabel")
		if err != nil {
			return err
		}

		if err = isRequired(plabel, "Collection", "Plural Label"); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return err
	}

	return nil
}
