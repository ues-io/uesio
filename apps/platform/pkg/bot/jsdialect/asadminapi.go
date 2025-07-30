package jsdialect

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func NewAsAdminAPI(ctx context.Context, session *sess.Session, connection wire.Connection) *AsAdminApi {
	return &AsAdminApi{
		session:    session,
		connection: connection,
		ctx:        ctx,
	}
}

type AsAdminApi struct {
	session    *sess.Session
	connection wire.Connection
	// Intentionally maintaining a context here because this code is called from javascript so we have to keep track of the context
	// upon creation so we can use as the bot processes. This is an exception to the rule of avoiding keeping context in structs.
	ctx context.Context
}

func (aaa *AsAdminApi) Save(collection string, changes wire.Collection, options *wire.SaveOptions) (*wire.Collection, error) {
	return botSave(aaa.ctx, collection, changes, options, datasource.GetSiteAdminSession(aaa.session), aaa.connection, nil)
}

func (aaa *AsAdminApi) Delete(collection string, deletes wire.Collection) error {
	return botDelete(aaa.ctx, collection, deletes, datasource.GetSiteAdminSession(aaa.session), aaa.connection, nil)
}

func (aaa *AsAdminApi) RunIntegrationAction(integrationID string, action string, options any) (any, error) {
	return runIntegrationAction(aaa.ctx, integrationID, action, options, datasource.GetSiteAdminSession(aaa.session), aaa.connection)
}

func (aaa *AsAdminApi) CallBot(botKey string, params map[string]any) (any, error) {
	return botCall(aaa.ctx, botKey, params, aaa.session, aaa.connection)
}

func (aaa *AsAdminApi) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValue(aaa.ctx, configValueKey, datasource.GetSiteAdminSession(aaa.session))
}

func (aaa *AsAdminApi) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(aaa.ctx, request, datasource.GetSiteAdminSession(aaa.session), aaa.connection, nil)
}
