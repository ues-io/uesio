package cognito

import (
	"errors"
	"net/http"

	"github.com/aws/smithy-go"

	"github.com/aws/aws-sdk-go-v2/aws"
	awshttp "github.com/aws/aws-sdk-go-v2/aws/transport/http"
	cognito "github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	"github.com/golang-jwt/jwt/v5"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/creds"
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

func getFullyQualifiedUsername(site string, username string) string {
	return site + ":" + username
}

func (c *Connection) RequestLogin(w http.ResponseWriter, r *http.Request) {
	ctlutil.HandleError(w, errors.New("Requesting login is not supported by this auth source type"))
	return
}

func (c *Connection) Login(w http.ResponseWriter, r *http.Request) {
	ctlutil.HandleError(w, errors.New("Logging in directly with cognito is not supported"))
	return
}

func (c *Connection) DoLogin(payload map[string]interface{}) (*meta.User, *meta.LoginMethod, error) {
	ctx := c.session.Context()
	username, err := auth.GetRequiredPayloadValue(payload, "username")
	if err != nil {
		return nil, nil, exceptions.NewBadRequestException("You must enter a username")
	}
	password, err := auth.GetRequiredPayloadValue(payload, "password")
	if err != nil {
		return nil, nil, exceptions.NewBadRequestException("You must enter a password")
	}
	clientID, ok := (*c.credentials)["clientid"]
	if !ok {
		return nil, nil, exceptions.NewBadRequestException("no client id provided in credentials")
	}
	poolID, ok := (*c.credentials)["poolid"]
	if !ok {
		return nil, nil, exceptions.NewBadRequestException("no user pool provided in credentials")
	}
	cfg, err := creds.GetAWSConfig(ctx, c.credentials)
	if err != nil {
		return nil, nil, exceptions.NewBadRequestException(err.Error())
	}

	site := c.session.GetSiteTenantID()
	fqUsername := getFullyQualifiedUsername(site, username)

	authTry := &cognito.AdminInitiateAuthInput{
		AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
		AuthParameters: map[string]string{
			"USERNAME": fqUsername,
			"PASSWORD": password,
		},
		ClientId:   aws.String(clientID),
		UserPoolId: aws.String(poolID),
	}

	client := cognito.NewFromConfig(cfg)

	result, err := client.AdminInitiateAuth(ctx, authTry)
	if err != nil {
		return nil, nil, handleCognitoError(err)
	}

	parser := jwt.Parser{}
	tokenObj, _, err := parser.ParseUnverified(*result.AuthenticationResult.IdToken, jwt.MapClaims{})
	if err != nil {
		return nil, nil, err
	}
	claims := tokenObj.Claims.(jwt.MapClaims)

	// TEMPORARY FIX
	// since this authsource used to be called uesio/core.platform,
	// to match it with existing loginmethods, we need to use the
	// uesio/core.platform auth source key.
	// Once the migration is complete, all this code will be deleted anyways.
	authSourceKey := "uesio/core.platform"
	// END TEMPORARY FIX

	return auth.GetUserFromFederationID(authSourceKey, claims["sub"].(string), c.connection, c.session)

}

func (c *Connection) Signup(signupMethod *meta.SignupMethod, payload map[string]interface{}, username string) error {
	return errors.New("Signup with cognito is not supported")
}

func (c *Connection) ResetPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}, authenticated bool) (*meta.LoginMethod, error) {
	return nil, errors.New("Password Reset with cognito is not supported")
}

func (c *Connection) ConfirmResetPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) (*meta.User, error) {
	return nil, errors.New("Password Reset with cognito is not supported")
}

func (c *Connection) ConfirmSignUp(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return errors.New("Signup with cognito is not supported")
}

func (c *Connection) CreateLogin(signupMethod *meta.SignupMethod, payload map[string]interface{}, user *meta.User) error {
	return errors.New("Creating logins with cognito is not supported")
}

// Make Cognito error messages more readable by returning the more specific error message
func handleCognitoError(err error) error {
	if opErr, isOpError := err.(*smithy.OperationError); isOpError {
		if respErr, isRespErr := opErr.Err.(*awshttp.ResponseError); isRespErr {
			switch cognitoErr := respErr.Err.(type) {
			case *types.NotAuthorizedException:
				return exceptions.NewUnauthorizedException(cognitoErr.ErrorMessage())
			case *types.InvalidPasswordException:
				return exceptions.NewBadRequestException(cognitoErr.ErrorMessage())
			default:
				return exceptions.NewBadRequestException(cognitoErr.Error())
			}
		}
	}
	return err
}
