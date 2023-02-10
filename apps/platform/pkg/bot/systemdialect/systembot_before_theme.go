package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runThemeBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return processTheme(request, connection, session)
}

func processTheme(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return request.LoopInserts(func(change *adapt.ChangeItem) error {
		err := addThemeDefaultDefinition(change)
		if err != nil {
			return err
		}
		return nil
	})
}

func addThemeDefaultDefinition(change *adapt.ChangeItem) error {
	defaultDefinition := "# Choose the colors for your theme! here you have some examples. \n palette: \n    primary: '#111111' \n    secondary: '#dc004e' \n    error: '#f44336' \n    warning: '#ff9800' \n    info: '#2196f3' \n    success: '#4caf50' \n"
	definition, _ := change.GetField("uesio/studio.definition")
	if definition == nil {
		return change.SetField("uesio/studio.definition", defaultDefinition)
	}
	return nil
}
