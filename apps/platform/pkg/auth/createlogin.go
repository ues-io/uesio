package auth

import (
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func CreateLogin(signupMethod *meta.SignupMethod, payload map[string]interface{}, session *sess.Session) error {

	connection, err := datasource.GetPlatformConnection(nil, session, nil)
	if err != nil {
		return err
	}

	err = connection.BeginTransaction()
	if err != nil {
		return err
	}

	err = createLoginWithConnection(signupMethod, payload, connection, session)
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

func createLoginWithConnection(signupMethod *meta.SignupMethod, payload map[string]interface{}, connection wire.Connection, siteAdminSession *sess.Session) error {

	siteAdmin := siteAdminSession.GetSiteAdmin()
	session, err := GetSystemSession(siteAdmin, nil)
	if err != nil {
		return err
	}

	authconn, err := GetAuthConnection(signupMethod.AuthSource, nil, session)
	if err != nil {
		return err
	}

	username, err := mergeTemplate(payload, signupMethod.UsernameTemplate)
	if err != nil {
		return err
	}

	user, err := GetUserByKey(username, session, nil)
	if err != nil {
		return err
	}

	return authconn.CreateLogin(signupMethod, payload, user)

}
