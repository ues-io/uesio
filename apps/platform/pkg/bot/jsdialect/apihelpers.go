package jsdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func botSave(collection string, changes adapt.Collection, session *sess.Session, connection adapt.Connection) error {
	requests := []datasource.SaveRequest{
		{
			Collection: collection,
			Wire:       "botsave",
			Changes:    &changes,
		},
	}
	err := datasource.SaveWithOptions(requests, session, datasource.GetConnectionSaveOptions(connection))
	return datasource.HandleSaveRequestErrors(requests, err)
}

func botDelete(collection string, deletes adapt.Collection, session *sess.Session, connection adapt.Connection) error {
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

func botLoad(request BotLoadOp, session *sess.Session, connection adapt.Connection) (*adapt.Collection, error) {
	collection := &adapt.Collection{}

	op := &adapt.LoadOp{
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

	_, err := datasource.Load([]*adapt.LoadOp{op}, session, &datasource.LoadOptions{
		Connection: connection,
		Metadata:   datasource.GetConnectionMetadata(connection),
	})
	if err != nil {
		return nil, err
	}

	return collection, nil
}

func runIntegrationAction(integrationID string, action string, options interface{}, session *sess.Session, connection adapt.Connection) (interface{}, error) {
	ic, err := datasource.GetIntegrationConnection(integrationID, session, connection)
	if err != nil {
		return nil, err
	}
	return datasource.RunIntegrationAction(ic, action, options, connection)
}

func botCall(botKey string, params map[string]interface{}, session *sess.Session, connection adapt.Connection) (map[string]interface{}, error) {
	botNamespace, botName, err := meta.ParseKeyWithDefault(botKey, session.GetContextAppName())
	if err != nil {
		return nil, errors.New("invalid bot name provided")
	}
	return datasource.CallListenerBot(botNamespace, botName, params, connection, session)
}
