package systemdialect

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runThemeBeforeSaveBot(ctx context.Context, request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	return processTheme(request, connection, session)
}

func processTheme(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	return request.LoopInserts(func(change *wire.ChangeItem) error {
		err := addThemeDefaultDefinition(change)
		if err != nil {
			return err
		}
		return nil
	})
}

func addThemeDefaultDefinition(change *wire.ChangeItem) error {
	defaultDefinition := "# Choose the colors for your theme! here you have some examples. \n palette: \n    primary: '#111111' \n    secondary: '#dc004e' \n    error: '#f44336' \n    warning: '#ff9800' \n    info: '#2196f3' \n    success: '#4caf50' \n"
	definition, _ := change.GetField("uesio/studio.definition")
	if definition == nil {
		return change.SetField("uesio/studio.definition", defaultDefinition)
	}
	return nil
}
