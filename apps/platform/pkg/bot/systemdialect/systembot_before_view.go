package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runViewBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return request.LoopInserts(func(change *adapt.ChangeItem) error {
		err := addViewDefaultDefinition(change)
		if err != nil {
			return err
		}
		return nil
	})
}

func addViewDefaultDefinition(change *adapt.ChangeItem) error {
	defaultDefinition := "# Wires connect to data in collections\nwires: {}\n# Components determine the layout and composition of your view\ncomponents: []"
	definition, _ := change.GetField("uesio/studio.definition")
	if definition == nil {
		return change.SetField("uesio/studio.definition", defaultDefinition)
	}
	return nil
}
