package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runViewBeforeSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	return request.LoopInserts(func(change *wire.ChangeItem) error {
		err := addViewDefaultDefinition(change)
		if err != nil {
			return err
		}
		return nil
	})
}

func addViewDefaultDefinition(change *wire.ChangeItem) error {
	defaultDefinition := "# Wires connect to data in collections\nwires: {}\n# Components determine the layout and composition of your view\ncomponents: []"
	definition, _ := change.GetField("uesio/studio.definition")
	if definition == nil {
		return change.SetField("uesio/studio.definition", defaultDefinition)
	}
	return nil
}
