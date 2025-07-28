package mock

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/crewjam/saml"
	"github.com/crewjam/saml/samlsp"
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

func (c *Connection) Login(loginRequest auth.AuthRequest) (*auth.LoginResult, error) {
	user, loginMethod, err := c.DoLogin(loginRequest)
	if err != nil {
		return nil, err
	}
	return &auth.LoginResult{
		AuthResult:    auth.AuthResult{User: user, LoginMethod: loginMethod},
		PasswordReset: false,
	}, nil
}

func (c *Connection) DoLogin(payload map[string]any) (*meta.User, *meta.LoginMethod, error) {
	federationID, err := auth.GetPayloadValue(payload, "token")
	if err != nil {
		return nil, nil, fmt.Errorf("mock login: %w", err)
	}
	return auth.GetUserFromFederationID(c.authSource.GetKey(), federationID, c.connection, c.session)
}
func (c *Connection) Signup(signupMethod *meta.SignupMethod, payload map[string]any, username string) error {
	return errors.New("mock login: unfortunately you cannot sign up for mock login")
}
func (c *Connection) ResetPassword(payload map[string]any, authenticated bool) (*meta.LoginMethod, error) {
	return nil, errors.New("mock login: unfortunately you cannot change the password")
}
func (c *Connection) ConfirmResetPassword(payload map[string]any) (*meta.User, error) {
	return nil, errors.New("mock login: unfortunately you cannot change the password")
}
func (c *Connection) CreateLogin(signupMethod *meta.SignupMethod, payload map[string]any, user *meta.User) error {
	return errors.New("mock login: unfortunately you cannot create a login")
}
func (c *Connection) ConfirmSignUp(signupMethod *meta.SignupMethod, payload map[string]any) error {
	return errors.New("mock login: unfortunately you cannot change the password")
}
func (c *Connection) GetServiceProvider(r *http.Request) (*samlsp.Middleware, error) {
	return nil, errors.New("saml auth is not supported by this auth source type")
}
func (c *Connection) LoginServiceProvider(assertion *saml.Assertion) (*auth.LoginResult, error) {
	return nil, errors.New("saml auth login is not supported by this auth source type")
}
