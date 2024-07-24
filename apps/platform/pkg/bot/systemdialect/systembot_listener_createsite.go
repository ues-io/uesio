package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runCreateSiteListenerBot(params map[string]interface{}, connection wire.Connection, session *sess.Session) (map[string]interface{}, error) {

	options, err := deploy.NewCreateSiteOptions(params)
	if err != nil {
		return nil, err
	}

	return deploy.CreateSite(options, connection, session)

}
