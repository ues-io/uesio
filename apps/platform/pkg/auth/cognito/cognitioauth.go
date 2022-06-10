package cognito

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	cognito "github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/dgrijalva/jwt-go"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/sess"
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

func (c *Connection) Verify(token string, session *sess.Session) error {
	return nil
}

func getFullyQualifiedUsername(site string, username string) string {
	return site + ":" + username
}

func (c *Connection) Login(payload map[string]interface{}, session *sess.Session) (*auth.AuthenticationClaims, error) {

	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return nil, errors.New("Cognito login:" + err.Error())
	}
	password, err := auth.GetPayloadValue(payload, "password")
	if err != nil {
		return nil, errors.New("Cognito login:" + err.Error())
	}
	clientID, ok := (*c.credentials)["clientid"]
	if !ok {
		return nil, errors.New("no client id provided in credentials")
	}
	poolID, ok := (*c.credentials)["poolid"]
	if !ok {
		return nil, errors.New("no user pool provided in credentials")
	}
	cfg, err := creds.GetAWSConfig(context.Background(), c.credentials)
	if err != nil {
		return nil, err
	}

	site := session.GetSiteTenantID()
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

	result, err := client.AdminInitiateAuth(context.Background(), authTry)
	if err != nil {
		return nil, err
	}

	parser := jwt.Parser{}
	tokenObj, _, err := parser.ParseUnverified(*result.AuthenticationResult.IdToken, jwt.MapClaims{})
	if err != nil {
		return nil, err
	}
	claims := tokenObj.Claims.(jwt.MapClaims)
	return &auth.AuthenticationClaims{
		Subject: claims["sub"].(string),
	}, nil

}

func (c *Connection) Signup(payload map[string]interface{}, username string, session *sess.Session) error {

	site := session.GetSiteTenantID()
	fqUsername := getFullyQualifiedUsername(site, username)

	clientID, ok := (*c.credentials)["clientid"]
	if !ok {
		return errors.New("no client id provided in credentials")
	}

	poolID, ok := (*c.credentials)["poolid"]
	if !ok {
		return errors.New("no user pool provided in credentials")
	}

	cfg, err := creds.GetAWSConfig(context.Background(), c.credentials)
	if err != nil {
		return err
	}

	client := cognito.NewFromConfig(cfg)

	awsUserExists := &cognito.AdminGetUserInput{
		Username:   &fqUsername,
		UserPoolId: aws.String(poolID),
	}

	adminGetUserOutput, _ := client.AdminGetUser(context.Background(), awsUserExists)
	if adminGetUserOutput != nil && adminGetUserOutput.Username != nil {
		return errors.New("User already exists")
	}

	password, err := auth.GetPayloadValue(payload, "password")
	if err != nil {
		return errors.New("Cognito login:" + err.Error())
	}

	signUpData := &cognito.SignUpInput{
		ClientId: aws.String(clientID),
		Username: &fqUsername,
		Password: &password,
	}

	_, err = client.SignUp(context.Background(), signUpData)
	if err != nil {
		return err
	}

	confirmSignUpData := &cognito.AdminConfirmSignUpInput{
		Username:   &fqUsername,
		UserPoolId: aws.String(poolID),
	}

	_, err = client.AdminConfirmSignUp(context.Background(), confirmSignUpData)
	if err != nil {
		return err
	}

	return nil
}
