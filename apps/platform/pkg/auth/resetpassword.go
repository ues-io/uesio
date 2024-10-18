package auth

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func ResetPassword(ctx context.Context, authSourceID string, payload map[string]interface{}, site *meta.Site) (*meta.LoginMethod, error) {
	session, err := GetSystemSession(ctx, site, nil)
	if err != nil {
		return nil, err
	}
	connection, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		return nil, err
	}
	return datasource.WithTransactionResult(connection, func(connection wire.Connection) (*meta.LoginMethod, error) {
		authconn, err := GetAuthConnection(authSourceID, connection, session)
		if err != nil {
			return nil, err
		}
		return authconn.ResetPassword(payload, false)
	})
}

func ConfirmResetPassword(ctx context.Context, authSourceID string, payload map[string]interface{}, site *meta.Site) (*meta.User, error) {

	session, err := GetSystemSession(ctx, site, nil)
	if err != nil {
		return nil, err
	}

	authconn, err := GetAuthConnection(authSourceID, nil, session)
	if err != nil {
		return nil, err
	}
	return authconn.ConfirmResetPassword(payload)
}
