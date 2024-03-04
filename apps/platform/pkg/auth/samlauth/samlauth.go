package samlauth

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/crewjam/saml"
	"github.com/crewjam/saml/samlsp"
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
	samlSP, err := getSP(r.Host, c.authSource, c.credentials)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	samlSP.HandleStartAuthFlow(w, r)
}

func (c *Connection) Login(w http.ResponseWriter, r *http.Request) {

	sp, err := getSP(r.Host, c.authSource, c.credentials)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	err = r.ParseForm()
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	assertion, err := sp.ServiceProvider.ParseResponse(r, []string{})
	if err != nil {
		target := &saml.InvalidResponseError{}
		if errors.As(err, &target) {
			fmt.Println(target.PrivateErr)
		}

		ctlutil.HandleError(w, err)
		return
	}

	sess, err := samlsp.JWTSessionCodec{}.New(assertion)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	claims := sess.(samlsp.JWTSessionClaims)

	user, err := auth.GetUserFromFederationID(c.authSource.GetKey(), claims.Subject, c.session)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	response, err := auth.GetLoginRedirectResponse(w, r, user, c.session)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	redirectPath := "/" + response.RedirectRouteName

	if c.session.GetContextAppName() != response.RedirectRouteNamespace {
		redirectPath = "/site/app/" + response.RedirectRouteNamespace + "/" + response.RedirectRouteName
	}

	http.Redirect(w, r, redirectPath, http.StatusSeeOther)
	return
}

func (c *Connection) Signup(signupMethod *meta.SignupMethod, payload map[string]interface{}, username string) error {
	return exceptions.NewBadRequestException("SAML login: unfortunately you cannot sign up")
}
func (c *Connection) ForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return exceptions.NewBadRequestException("SAML login: unfortunately you cannot change the password")
}
func (c *Connection) ConfirmForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return exceptions.NewBadRequestException("SAML login: unfortunately you cannot change the password")
}
func (c *Connection) CreateLogin(signupMethod *meta.SignupMethod, payload map[string]interface{}, user *meta.User) error {
	return exceptions.NewBadRequestException("SAML login: unfortunately you cannot create a login")
}
func (c *Connection) ConfirmSignUp(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return exceptions.NewBadRequestException("SAML login: unfortunately you cannot change the password")
}
