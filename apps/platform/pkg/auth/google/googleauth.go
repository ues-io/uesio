package googleauth

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
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

	trustedClientID, err := c.credentials.GetRequiredEntry("client_id")
	if err != nil {
		return nil, exceptions.NewBadRequestException("google login: " + err.Error())
	}

	if trustedClientID == "" {
		return nil, exceptions.NewBadRequestException("google login: no client id associated with auth source")
	}

	validToken, err := idtoken.Validate(c.session.Context(), token, trustedClientID)
	if err != nil {
		return nil, exceptions.NewBadRequestException(err.Error())
	}

	return validToken, nil

}

func (c *Connection) RequestLogin(w http.ResponseWriter, r *http.Request) {
	ctlutil.HandleError(w, errors.New("Requesting login is not supported by this auth source type"))
	return
}

func (c *Connection) Login(w http.ResponseWriter, r *http.Request) {
	var loginRequest map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&loginRequest)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("invalid login request body"))
		return
	}
	user, err := c.DoLogin(loginRequest)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	auth.LoginRedirectResponse(w, r, user, c.session)
}

func (c *Connection) DoLogin(payload map[string]interface{}) (*meta.User, error) {
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
