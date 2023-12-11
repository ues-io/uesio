package mock

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type Auth struct{}

func (a *Auth) GetAuthConnection(credentials *wire.Credentials, authSource *meta.AuthSource, connection wire.Connection, session *sess.Session) (auth.AuthConnection, error) {

	return &Connection{
		credentials: credentials,
		authSource:  authSource,
		connection:  connection,
		session:     session,
	}, nil
}

type Connection struct {
	credentials *wire.Credentials
	authSource  *meta.AuthSource
	connection  wire.Connection
	session     *sess.Session
}

func (c *Connection) Login(payload map[string]interface{}) (*meta.User, error) {
	federationID, err := auth.GetPayloadValue(payload, "token")
	if err != nil {
		return nil, errors.New("Mock login:" + err.Error())
	}
	return auth.GetUserFromFederationID(c.authSource.GetKey(), federationID, c.session)
}
func (c *Connection) Signup(signupMethod *meta.SignupMethod, payload map[string]interface{}, username string) error {
	return errors.New("Mock login: unfortunately you cannot sign up for mock login")
}
func (c *Connection) ForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return errors.New("Mock login: unfortunately you cannot change the password")
}
func (c *Connection) ConfirmForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return errors.New("Mock login: unfortunately you cannot change the password")
}
func (c *Connection) CreateLogin(signupMethod *meta.SignupMethod, payload map[string]interface{}, user *meta.User) error {
	return errors.New("Mock login: unfortunately you cannot create a login")
}
func (c *Connection) ConfirmSignUp(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return errors.New("Mock login: unfortunately you cannot change the password")
}
