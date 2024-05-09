package jsdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func botSave(collection string, changes wire.Collection, session *sess.Session, connection wire.Connection) (*wire.Collection, error) {
	requests := []datasource.SaveRequest{
		{
			Collection: collection,
			Wire:       "botsave",
			Changes:    &changes,
		},
	}
	err := datasource.SaveWithOptions(requests, session, datasource.GetConnectionSaveOptions(connection))
	err = datasource.HandleSaveRequestErrors(requests, err)
	if err != nil {
		return nil, err
	}
	return &changes, nil
}

func botDelete(collection string, deletes wire.Collection, session *sess.Session, connection wire.Connection) error {
	requests := []datasource.SaveRequest{
		{
			Collection: collection,
			Wire:       "botsave",
			Deletes:    &deletes,
		},
	}
	err := datasource.SaveWithOptions(requests, session, datasource.GetConnectionSaveOptions(connection))
	return datasource.HandleSaveRequestErrors(requests, err)
}

func botLoad(request BotLoadOp, session *sess.Session, connection wire.Connection) (*wire.Collection, error) {
	collection := &wire.Collection{}

	op := &wire.LoadOp{
		BatchSize:      request.BatchSize,
		CollectionName: request.Collection,
		Collection:     collection,
		WireName:       "botload",
		Fields:         request.Fields,
		Conditions:     request.Conditions,
		Order:          request.Order,
		Query:          true,
		LoadAll:        request.LoadAll,
	}

	_, err := datasource.Load([]*wire.LoadOp{op}, session, &datasource.LoadOptions{
		Connection: connection,
		Metadata:   datasource.GetConnectionMetadata(connection),
	})
	if err != nil {
		return nil, err
	}

	return collection, nil
}

func runIntegrationAction(integrationID string, action string, options interface{}, session *sess.Session, connection wire.Connection) (interface{}, error) {
	ic, err := datasource.GetIntegrationConnection(integrationID, session, connection)
	if err != nil {
		return nil, err
	}
	return datasource.RunIntegrationAction(ic, action, options, connection)
}

func botCall(botKey string, params map[string]interface{}, session *sess.Session, connection wire.Connection) (map[string]interface{}, error) {
	botNamespace, botName, err := meta.ParseKeyWithDefault(botKey, session.GetContextAppName())
	if err != nil {
		return nil, errors.New("invalid bot name provided")
	}
	return datasource.CallListenerBot(botNamespace, botName, params, connection, session)
}
