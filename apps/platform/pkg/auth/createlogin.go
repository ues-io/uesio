package auth

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func CreateLogin(signupMethod *meta.SignupMethod, payload map[string]interface{}, session *sess.Session) error {

	connection, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		return err
	}

	err = connection.BeginTransaction()
	if err != nil {
		return err
	}

	err = CreateLoginWithConnection(signupMethod, payload, connection, session)
	if err != nil {
		rollbackError := connection.RollbackTransaction()
		if rollbackError != nil {
			return rollbackError
		}
		return err
	}

	err = connection.CommitTransaction()
	if err != nil {
		return err
	}

	return nil
}

func CreateLoginWithConnection(signupMethod *meta.SignupMethod, payload map[string]interface{}, connection wire.Connection, session *sess.Session) error {

	if !session.GetContextPermissions().HasNamedPermission(constant.UserAdminPerm) {
		return errors.New("you must be a user admin to create login methods for users")
	}

	site := session.GetContextSite()
	systemSession, err := GetSystemSession(session.Context(), site, connection)
	if err != nil {
		return err
	}

	authconn, err := GetAuthConnection(signupMethod.AuthSource, connection, systemSession)
	if err != nil {
		return err
	}

	username, err := mergeTemplate(payload, signupMethod.UsernameTemplate)
	if err != nil {
		return err
	}

	user, err := GetUserByKey(username, systemSession, connection)
	if err != nil {
		return err
	}

	return authconn.CreateLogin(signupMethod, payload, user)

}
