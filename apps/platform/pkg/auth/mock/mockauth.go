package mock

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
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

func (c *Connection) RequestLogin(w http.ResponseWriter, r *http.Request) {
	ctlutil.HandleError(r.Context(), w, errors.New("requesting login is not supported by this auth source type"))
}

func (c *Connection) Login(w http.ResponseWriter, r *http.Request) {
	var loginRequest map[string]any
	err := json.NewDecoder(r.Body).Decode(&loginRequest)
	if err != nil {
		const msg = "invalid login request body"
		slog.InfoContext(r.Context(), fmt.Sprintf("%s: %v", msg, err))
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException(msg, nil))
		return
	}
	user, _, err := c.DoLogin(loginRequest)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	auth.LoginRedirectResponse(w, r, user, c.session)
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
