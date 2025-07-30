package systemdialect

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runCreateSiteListenerBot(ctx context.Context, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {

	userOptions, err := deploy.NewCreateSiteOptions(params)
	if err != nil {
		return nil, err
	}

	site, err := deploy.CreateSite(ctx, userOptions, connection, session)
	if err != nil {
		return nil, err
	}

	siteOptions, err := deploy.NewCreateUserOptions(site.ID, params)
	if err != nil {
		return nil, err
	}

	_, err = deploy.CreateUser(ctx, siteOptions, connection, session)
	if err != nil {
		return nil, err
	}

	return map[string]any{}, nil

}
