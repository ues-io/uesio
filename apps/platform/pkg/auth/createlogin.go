package auth

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func CreateLogin(ctx context.Context, signupMethod *meta.SignupMethod, payload AuthRequest, session *sess.Session) error {
	return datasource.WithTransaction(ctx, session, nil, func(conn wire.Connection) error {
		return CreateLoginWithConnection(ctx, signupMethod, payload, conn, session)
	})
}

func CreateLoginWithConnection(ctx context.Context, signupMethod *meta.SignupMethod, payload AuthRequest, connection wire.Connection, session *sess.Session) error {

	if !session.GetContextPermissions().HasNamedPermission(constant.UserAdminPerm) {
		return errors.New("you must be a user admin to create login methods for users")
	}

	site := session.GetContextSite()
	systemSession, err := GetSystemSession(ctx, site, connection)
	if err != nil {
		return err
	}

	authconn, err := GetAuthConnection(ctx, signupMethod.AuthSource, connection, systemSession)
	if err != nil {
		return err
	}

	username, err := mergeTemplate(payload, signupMethod.UsernameTemplate)
	if err != nil {
		return err
	}

	user, err := GetUserByKey(ctx, username, systemSession, connection)
	if err != nil {
		return err
	}

	return authconn.CreateLogin(ctx, signupMethod, payload, user)

}
