package googleauth

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"google.golang.org/api/idtoken"
)

type Auth struct{}

func (a *Auth) GetAuthConnection(credentials *adapt.Credentials, authSource *meta.AuthSource, connection adapt.Connection, session *sess.Session) (auth.AuthConnection, error) {

	return &Connection{
		credentials: credentials,
		authSource:  authSource,
		connection:  connection,
		session:     session,
	}, nil
}

type Connection struct {
	credentials *adapt.Credentials
	authSource  *meta.AuthSource
	connection  adapt.Connection
	session     *sess.Session
}

func (c *Connection) Validate(payload map[string]interface{}) (*idtoken.Payload, error) {
	token, err := auth.GetPayloadValue(payload, "credential")
	if err != nil {
		return nil, auth.NewAuthRequestError("google login: " + err.Error())
	}
	clientID, err := auth.GetPayloadValue(payload, "client_id")
	if err != nil {
		return nil, auth.NewAuthRequestError("google login: " + err.Error())
	}

	// Verify that the client id sent in the payload matches the client id
	// associated with our auth source.
	trustedClientID, err := c.credentials.GetRequiredEntry("client_id")
	if err != nil {
		return nil, err
	}

	if trustedClientID == "" {
		return nil, auth.NewAuthRequestError("google login: no client id associated with auth source")
	}

	if trustedClientID != clientID {
		return nil, auth.NewAuthRequestError("google login: invalid client id")
	}

	return idtoken.Validate(context.Background(), token, clientID)

}

func (c *Connection) Login(payload map[string]interface{}) (*meta.User, error) {
	validated, err := c.Validate(payload)
	if err != nil {
		return nil, err
	}
	return auth.GetUserFromFederationID(c.authSource.GetKey(), validated.Subject, c.session)
}

func (c *Connection) Signup(signupMethod *meta.SignupMethod, payload map[string]interface{}, username string) error {
	validated, err := c.Validate(payload)
	if err != nil {
		return err
	}
	user, err := auth.CreateUser(signupMethod, username, c.connection, c.session)
	if err != nil {
		return err
	}
	return auth.CreateLoginMethod(user, signupMethod, validated.Subject, c.connection, c.session)
}
func (c *Connection) ForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return errors.New("Google login: unfortunately you cannot change the password")
}
func (c *Connection) ConfirmForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return errors.New("Google login: unfortunately you cannot change the password")
}
func (c *Connection) CreateLogin(signupMethod *meta.SignupMethod, payload map[string]interface{}, user *meta.User) error {
	validated, err := c.Validate(payload)
	if err != nil {
		return err
	}
	return auth.CreateLoginMethod(user, signupMethod, validated.Subject, c.connection, c.session)
}
func (c *Connection) ConfirmSignUp(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return errors.New("Google login: unfortunately you cannot change the password")
}
