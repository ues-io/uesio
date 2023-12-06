package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runCheckAvailabilityBot(params map[string]interface{}, connection wire.Connection, session *sess.Session) (map[string]interface{}, error) {

	paramItems := (wire.Item)(params)
	username, err := paramItems.GetFieldAsString("username")
	if err != nil || username == "" {
		return nil, exceptions.NewBadRequestException("no username provided")
	}

	systemSession, err := auth.GetSystemSession(session.GetSite(), nil)
	if err != nil {
		return nil, err
	}

	_, err = auth.GetUserByKey(username, systemSession, nil)
	_, recordNotFound := err.(*datasource.RecordNotFoundError)
	if recordNotFound {
		return map[string]interface{}{
			"message": "That username is available",
		}, nil
	}
	if err != nil {
		return nil, err
	}

	return nil, exceptions.NewBadRequestException("That username is not available")

}
