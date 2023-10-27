package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runResetRecordAccessTokensListenerBot(params map[string]interface{}, connection adapt.Connection, session *sess.Session) (map[string]interface{}, error) {
	paramItems := (adapt.Item)(params)
	collectionName, err := paramItems.GetFieldAsString("collection")
	if err != nil {
		return nil, meta.NewParamError("must provide a collection to reset record tokens", "collection")
	}
	app, err := paramItems.GetFieldAsString("app")
	if err != nil {
		return nil, meta.NewParamError("must provide an app to reset record tokens", "app")
	}
	siteName, _ := paramItems.GetFieldAsString("sitename")
	workspaceName, _ := paramItems.GetFieldAsString("workspacename")

	inContextSession, err := datasource.GetContextSessionFromParams(map[string]string{
		"app":           app,
		"sitename":      siteName,
		"workspacename": workspaceName,
	}, connection, session)
	if err != nil {
		return nil, err
	}
	err = datasource.ResetRecordTokens(collectionName, inContextSession)
	if err != nil {
		return nil, err
	}
	return nil, nil
}
