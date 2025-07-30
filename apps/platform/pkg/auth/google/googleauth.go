package googleauth

import (
	"context"
	"errors"
	"net/http"

	"github.com/crewjam/saml"
	"github.com/crewjam/saml/samlsp"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
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

func (c *Connection) callListenerBot(ctx context.Context, botKey string, payload auth.AuthRequest) error {

	site := c.session.GetSite()

	domain, err := datasource.QueryDomainFromSite(ctx, site.ID, c.connection)
	if err != nil {
		return err
	}

	host := datasource.GetHostFromDomain(domain, site)
	payload["host"] = host

	namespace, name, err := meta.ParseKey(botKey)
	if err != nil {
		return err
	}

	_, err = datasource.CallListenerBot(context.Background(), namespace, name, payload, c.connection, c.session)
	if err != nil {
		return err
	}

	return nil
}

func (c *Connection) Validate(ctx context.Context, payload auth.AuthRequest) (*idtoken.Payload, error) {
	token, err := auth.GetPayloadValue(payload, "credential")
	if err != nil {
		return nil, exceptions.NewBadRequestException("google login", err)
	}

	trustedClientID, err := c.credentials.GetRequiredEntry("client_id")
	if err != nil {
		return nil, exceptions.NewBadRequestException("google login", err)
	}

	if trustedClientID == "" {
		return nil, exceptions.NewBadRequestException("google login: no client id associated with auth source", err)
	}

	validToken, err := idtoken.Validate(ctx, token, trustedClientID)
	if err != nil {
		return nil, exceptions.NewBadRequestException("google login", err)
	}

	return validToken, nil

}

func (c *Connection) Login(ctx context.Context, loginRequest auth.AuthRequest) (*auth.LoginResult, error) {
	user, loginMethod, err := c.DoLogin(ctx, loginRequest)
	if err != nil {
		return nil, err
	}
	return &auth.LoginResult{
		AuthResult:    auth.AuthResult{User: user, LoginMethod: loginMethod},
		PasswordReset: false,
	}, nil
}

func (c *Connection) LoginCLI(ctx context.Context, loginRequest auth.AuthRequest) (*auth.LoginResult, error) {
	return nil, exceptions.NewBadRequestException("google login: cli login is not supported, please use browser", nil)
}

func (c *Connection) DoLogin(ctx context.Context, payload auth.AuthRequest) (*meta.User, *meta.LoginMethod, error) {
	validated, err := c.Validate(ctx, payload)
	if err != nil {
		return nil, nil, err
	}
	return auth.GetUserFromFederationID(ctx, c.authSource.GetKey(), validated.Subject, c.connection, c.session)
}

func (c *Connection) Signup(ctx context.Context, signupMethod *meta.SignupMethod, payload auth.AuthRequest, username string) error {
	validated, err := c.Validate(ctx, payload)
	if err != nil {
		return err
	}
	user, err := auth.CreateUser(ctx, signupMethod, &meta.User{
		Username:  username,
		FirstName: validated.Claims["given_name"].(string),
		LastName:  validated.Claims["family_name"].(string),
		Email:     validated.Claims["email"].(string),
	}, c.connection, c.session)
	if err != nil {
		return err
	}
	err = auth.CreateLoginMethod(ctx, &meta.LoginMethod{
		FederationID: validated.Subject,
		User:         user,
		AuthSource:   signupMethod.AuthSource,
		SignupMethod: signupMethod.GetKey(),
	}, c.connection, c.session)
	if err != nil {
		return err
	}

	payload["email"] = validated.Claims["email"].(string)
	payload["firstname"] = validated.Claims["given_name"].(string)
	payload["lastname"] = validated.Claims["family_name"].(string)

	return c.callListenerBot(ctx, signupMethod.SignupBot, payload)
}
func (c *Connection) ResetPassword(ctx context.Context, payload auth.AuthRequest, authenticated bool) (*meta.LoginMethod, error) {
	return nil, exceptions.NewBadRequestException("google login: unfortunately you cannot change the password", nil)
}
func (c *Connection) ConfirmResetPassword(ctx context.Context, payload auth.AuthRequest) (*meta.User, error) {
	return nil, exceptions.NewBadRequestException("google login: unfortunately you cannot change the password", nil)
}
func (c *Connection) CreateLogin(ctx context.Context, signupMethod *meta.SignupMethod, payload auth.AuthRequest, user *meta.User) error {
	validated, err := c.Validate(ctx, payload)
	if err != nil {
		return err
	}
	return auth.CreateLoginMethod(ctx, &meta.LoginMethod{
		FederationID: validated.Subject,
		User:         user,
		AuthSource:   signupMethod.AuthSource,
		SignupMethod: signupMethod.GetKey(),
	}, c.connection, c.session)
}
func (c *Connection) ConfirmSignUp(ctx context.Context, signupMethod *meta.SignupMethod, payload auth.AuthRequest) error {
	return exceptions.NewBadRequestException("google login: unfortunately you cannot change the password", nil)
}
func (c *Connection) GetServiceProvider(r *http.Request) (*samlsp.Middleware, error) {
	return nil, errors.New("saml auth is not supported by this auth source type")
}
func (c *Connection) LoginServiceProvider(ctx context.Context, assertion *saml.Assertion) (*auth.LoginResult, error) {
	return nil, errors.New("saml auth login is not supported by this auth source type")
}
