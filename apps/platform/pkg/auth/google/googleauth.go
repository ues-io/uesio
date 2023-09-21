package googleauth

import (
	"context"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"google.golang.org/api/idtoken"
)

type Auth struct{}

func (a *Auth) GetAuthConnection(credentials *adapt.Credentials) (auth.AuthConnection, error) {

	return &Connection{
		credentials: credentials,
	}, nil
}

type Connection struct {
	credentials *adapt.Credentials
}

func (c *Connection) Login(payload map[string]interface{}, session *sess.Session) (*auth.AuthenticationClaims, error) {

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

	validated, err := idtoken.Validate(context.Background(), token, clientID)
	if err != nil {
		return nil, err
	}
	return &auth.AuthenticationClaims{
		Subject: validated.Subject,
	}, nil
}

func (c *Connection) Signup(payload map[string]interface{}, username string, session *sess.Session) (*auth.AuthenticationClaims, error) {
	return c.Login(payload, session)
}
func (c *Connection) ForgotPassword(payload map[string]interface{}, session *sess.Session) error {
	return errors.New("Google login: unfortunately you cannot change the password")
}
func (c *Connection) ConfirmForgotPassword(payload map[string]interface{}, session *sess.Session) error {
	return errors.New("Google login: unfortunately you cannot change the password")
}
func (c *Connection) CreateLogin(payload map[string]interface{}, username string, session *sess.Session) (*auth.AuthenticationClaims, error) {
	return c.Login(payload, session)
}
func (c *Connection) ConfirmSignUp(payload map[string]interface{}, session *sess.Session) error {
	return errors.New("Google login: unfortunately you cannot change the password")
}
