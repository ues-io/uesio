package cognito

import (
	"errors"

	"github.com/aws/aws-sdk-go/aws"

	cognito "github.com/aws/aws-sdk-go/service/cognitoidentityprovider"
	"github.com/dgrijalva/jwt-go"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/aws/aws-sdk-go/aws/session"
)

type Credentials map[string]string

type awsCognitoClient struct {
	cognitoClient *cognito.CognitoIdentityProvider
	clientId      string
}

// Init
func InitClient(credentialsKey string, sesh *sess.Session) (*awsCognitoClient, error) {
	credentials, err := adapt.GetCredentials(credentialsKey, sesh)
	if err != nil {
		return nil, errors.New("no Credentials found " + credentialsKey)
	}
	conf := &aws.Config{
		Region: aws.String((*credentials)["region"]),
		// We might want to support the credentials key optionally, some Cognito functions require AWS credentials.
		// But at the moment we don't expose these functions, so we're good for now
		// Credentials: credentials.NewEnvCredentials(),  /aws/credentials package
	}

	sess, err := session.NewSession(conf)
	client := cognito.New(sess)

	if err != nil {
		return nil, err
	}

	return &awsCognitoClient{
		cognitoClient: client,
		// Easy access tot the client ID, required for some cognito methods
		clientId: (*credentials)["clientId"],
	}, nil
}

type Auth struct {
}

// Verify function
func (a *Auth) Verify(token string, credentials string, session *sess.Session) error {

	return nil
}

// Decode function
func (a *Auth) Decode(token string, credentials string, session *sess.Session) (*auth.AuthenticationClaims, error) {
	// TODO: Actually verify the token
	parser := jwt.Parser{}
	tokenObj, _, err := parser.ParseUnverified(token, jwt.MapClaims{})
	if err != nil {
		return nil, err
	}
	claims := tokenObj.Claims.(jwt.MapClaims)
	return &auth.AuthenticationClaims{
		Subject:   claims["sub"].(string),
		FirstName: claims["given_name"].(string),
		LastName:  claims["family_name"].(string),
		Email:     claims["email"].(string),
	}, nil
}
