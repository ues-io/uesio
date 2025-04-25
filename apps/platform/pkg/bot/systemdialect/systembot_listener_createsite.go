package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runCreateSiteListenerBot(params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {

	userOptions, err := deploy.NewCreateSiteOptions(params)
	if err != nil {
		return nil, err
	}

	site, err := deploy.CreateSite(userOptions, connection, session)
	if err != nil {
		return nil, err
	}

	siteOptions, err := deploy.NewCreateUserOptions(site.ID, params)
	if err != nil {
		return nil, err
	}

	_, err = deploy.CreateUser(siteOptions, connection, session)
	if err != nil {
		return nil, err
	}

	return map[string]any{}, nil

}
