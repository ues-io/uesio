package systemdialect

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runResetRecordAccessTokensListenerBot(ctx context.Context, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {
	paramItems := (wire.Item)(params)
	collectionName, err := paramItems.GetFieldAsString("collection")
	if err != nil {
		return nil, exceptions.NewInvalidParamException("must provide a collection to reset record tokens", "collection")
	}
	app, err := paramItems.GetFieldAsString("app")
	if err != nil {
		return nil, exceptions.NewInvalidParamException("must provide an app to reset record tokens", "app")
	}
	siteName, _ := paramItems.GetFieldAsString("sitename")
	workspaceName, _ := paramItems.GetFieldAsString("workspacename")

	inContextSession, err := datasource.GetContextSessionFromParams(ctx, map[string]any{
		"app":           app,
		"sitename":      siteName,
		"workspacename": workspaceName,
	}, connection, session)
	if err != nil {
		return nil, err
	}
	err = datasource.ResetRecordTokens(ctx, collectionName, inContextSession)
	if err != nil {
		return nil, err
	}
	return nil, nil
}
