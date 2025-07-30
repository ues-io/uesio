package systemdialect

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runCheckAvailabilityBot(ctx context.Context, params map[string]any, connection wire.Connection, session *sess.Session) (map[string]any, error) {

	paramItems := (wire.Item)(params)
	username, err := paramItems.GetFieldAsString("username")
	if err != nil || username == "" {
		return nil, exceptions.NewBadRequestException("no username provided", nil)
	}

	systemSession, err := auth.GetSystemSession(ctx, session.GetSite(), nil)
	if err != nil {
		return nil, err
	}

	_, err = auth.GetUserByKey(ctx, username, systemSession, nil)
	if exceptions.IsNotFoundException(err) {
		return map[string]any{
			"message": "That username is available",
		}, nil
	}
	if err != nil {
		return nil, err
	}

	return nil, exceptions.NewBadRequestException("That username is not available", nil)

}
