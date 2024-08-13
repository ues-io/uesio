package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type AsAdminApi struct {
	session    *sess.Session
	connection wire.Connection
}

func (aaa *AsAdminApi) Save(collection string, changes wire.Collection, options *wire.SaveOptions) (*wire.Collection, error) {
	return botSave(collection, changes, options, datasource.GetSiteAdminSession(aaa.session), aaa.connection, nil)
}

func (aaa *AsAdminApi) Delete(collection string, deletes wire.Collection) error {
	return botDelete(collection, deletes, datasource.GetSiteAdminSession(aaa.session), aaa.connection, nil)
}

func (aaa *AsAdminApi) RunIntegrationAction(integrationID string, action string, options interface{}) (interface{}, error) {
	return runIntegrationAction(integrationID, action, options, datasource.GetSiteAdminSession(aaa.session), aaa.connection)
}

func (aaa *AsAdminApi) CallBot(botKey string, params map[string]interface{}) (interface{}, error) {
	return botCall(botKey, params, aaa.session, aaa.connection)
}

func (aaa *AsAdminApi) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, datasource.GetSiteAdminSession(aaa.session))
}

func (aaa *AsAdminApi) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(request, datasource.GetSiteAdminSession(aaa.session), aaa.connection, nil)
}
