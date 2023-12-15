package googleauth

import (
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

	"google.golang.org/api/idtoken"
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

func (c *Connection) Validate(payload map[string]interface{}) (*idtoken.Payload, error) {
	token, err := auth.GetPayloadValue(payload, "credential")
	if err != nil {
		return nil, exceptions.NewBadRequestException("google login: " + err.Error())
	}
	clientID, err := auth.GetPayloadValue(payload, "client_id")
	if err != nil {
		return nil, exceptions.NewBadRequestException("google login: " + err.Error())
	}

	// Verify that the client id sent in the payload matches the client id
	// associated with our auth source.
	trustedClientID, err := c.credentials.GetRequiredEntry("client_id")
	if err != nil {
		return nil, exceptions.NewBadRequestException("google login: " + err.Error())
	}

	if trustedClientID == "" {
		return nil, exceptions.NewBadRequestException("google login: no client id associated with auth source")
	}

	if trustedClientID != clientID {
		return nil, exceptions.NewBadRequestException("google login: invalid client id")
	}

	return idtoken.Validate(c.session.Context(), token, clientID)

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
	user, err := auth.CreateUser(signupMethod, &meta.User{
		Username:  username,
		FirstName: validated.Claims["given_name"].(string),
		LastName:  validated.Claims["family_name"].(string),
		Email:     validated.Claims["email"].(string),
	}, c.connection, c.session)
	if err != nil {
		return err
	}
	return auth.CreateLoginMethod(&meta.LoginMethod{
		FederationID: validated.Subject,
		User:         user,
		AuthSource:   signupMethod.AuthSource,
	}, c.connection, c.session)
}
func (c *Connection) ForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return exceptions.NewBadRequestException("Google login: unfortunately you cannot change the password")
}
func (c *Connection) ConfirmForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return exceptions.NewBadRequestException("Google login: unfortunately you cannot change the password")
}
func (c *Connection) CreateLogin(signupMethod *meta.SignupMethod, payload map[string]interface{}, user *meta.User) error {
	validated, err := c.Validate(payload)
	if err != nil {
		return err
	}
	return auth.CreateLoginMethod(&meta.LoginMethod{
		FederationID: validated.Subject,
		User:         user,
		AuthSource:   signupMethod.AuthSource,
	}, c.connection, c.session)
}
func (c *Connection) ConfirmSignUp(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return exceptions.NewBadRequestException("Google login: unfortunately you cannot change the password")
}
