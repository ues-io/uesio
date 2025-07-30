package auth

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func ResetPassword(ctx context.Context, authSourceID string, payload AuthRequest, site *meta.Site) (*meta.LoginMethod, error) {
	session, err := GetSystemSession(ctx, site, nil)
	if err != nil {
		return nil, err
	}
	return datasource.WithTransactionResult(ctx, session, nil, func(connection wire.Connection) (*meta.LoginMethod, error) {
		authconn, err := GetAuthConnection(ctx, authSourceID, connection, session)
		if err != nil {
			return nil, err
		}
		return authconn.ResetPassword(ctx, payload, false)
	})
}

func ConfirmResetPassword(ctx context.Context, authSourceID string, payload AuthRequest, site *meta.Site) (*meta.User, error) {

	session, err := GetSystemSession(ctx, site, nil)
	if err != nil {
		return nil, err
	}

	authconn, err := GetAuthConnection(ctx, authSourceID, nil, session)
	if err != nil {
		return nil, err
	}
	return authconn.ConfirmResetPassword(ctx, payload)
}
