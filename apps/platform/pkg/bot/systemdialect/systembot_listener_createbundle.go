package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/deploy"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runCreateBundleListenerBot(params map[string]interface{}, connection wire.Connection, session *sess.Session) (map[string]interface{}, error) {

	options, err := deploy.NewCreateBundleOptions(params)
	if err != nil {
		return nil, err
	}

	bundle, err := deploy.CreateBundle(options, connection, session)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"major":       bundle.Major,
		"minor":       bundle.Minor,
		"patch":       bundle.Patch,
		"description": bundle.Description,
	}, nil
}
