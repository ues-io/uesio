package cognito

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws/transport/http"
	"github.com/aws/smithy-go"

	"github.com/aws/aws-sdk-go-v2/aws"
	cognito "github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	"github.com/dgrijalva/jwt-go"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/creds"
	"github.com/thecloudmasters/uesio/pkg/meta"
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

func (c *Connection) Login(authSourceID string, payload map[string]interface{}, session *sess.Session) (*auth.AuthenticationClaims, error) {

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

func (c *Connection) Signup(signupMethod *meta.SignupMethod, payload map[string]interface{}, username string, session *sess.Session) (*auth.AuthenticationClaims, error) {

	site := session.GetSiteTenantID()
	fqUsername := getFullyQualifiedUsername(site, username)

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

	client := cognito.NewFromConfig(cfg)

	awsUserExists := &cognito.AdminGetUserInput{
		Username:   &fqUsername,
		UserPoolId: aws.String(poolID),
	}

	adminGetUserOutput, _ := client.AdminGetUser(context.Background(), awsUserExists)
	if adminGetUserOutput != nil && adminGetUserOutput.Username != nil {
		return nil, errors.New("User already exists")
	}

	password, err := auth.GetPayloadValue(payload, "password")
	if err != nil {
		return nil, errors.New("Cognito login:" + err.Error())
	}

	email, err := auth.GetPayloadValue(payload, "email")
	if err != nil {
		return nil, errors.New("Cognito login:" + err.Error())
	}

	subject, err := auth.GetRequiredPayloadValue(payload, "subject")
	if err != nil {
		return nil, errors.New("Cognito login:" + err.Error())
	}

	message, err := auth.GetRequiredPayloadValue(payload, "message")
	if err != nil {
		return nil, errors.New("Cognito login:" + err.Error())
	}

	signUpData := &cognito.SignUpInput{
		ClientId: aws.String(clientID),
		Username: &fqUsername,
		Password: &password,
		UserAttributes: []types.AttributeType{
			{
				Name:  aws.String("email"),
				Value: aws.String(email),
			},
		},
		ClientMetadata: map[string]string{
			"subject": subject,
			"message": message,
		},
	}

	signUpOutput, err := client.SignUp(context.Background(), signUpData)
	if err != nil {
		return nil, handleCognitoSignupError(err)
	}

	return &auth.AuthenticationClaims{
		Subject: *signUpOutput.UserSub,
	}, nil
}

// Make Cognito error messages more readable by returning the more specific error message
func handleCognitoSignupError(err error) error {
	if opErr, isOpError := err.(*smithy.OperationError); isOpError {
		if respErr, isRespErr := opErr.Err.(*http.ResponseError); isRespErr {
			return respErr.Err
		}
	}
	return err
}

func (c *Connection) ForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}, session *sess.Session) error {

	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return errors.New("Cognito Forgot Password:" + err.Error())
	}

	clientID, ok := (*c.credentials)["clientid"]
	if !ok {
		return errors.New("no client id provided in credentials")
	}

	cfg, err := creds.GetAWSConfig(context.Background(), c.credentials)
	if err != nil {
		return err
	}

	site := session.GetSiteTenantID()
	fqUsername := getFullyQualifiedUsername(site, username)

	subject, err := auth.GetRequiredPayloadValue(payload, "subject")
	if err != nil {
		return errors.New("Cognito login:" + err.Error())
	}

	message, err := auth.GetRequiredPayloadValue(payload, "message")
	if err != nil {
		return errors.New("Cognito login:" + err.Error())
	}

	authTry := &cognito.ForgotPasswordInput{
		Username: &fqUsername,
		ClientId: aws.String(clientID),
		ClientMetadata: map[string]string{
			"subject": subject,
			"message": message,
		},
	}

	client := cognito.NewFromConfig(cfg)

	_, err = client.ForgotPassword(context.Background(), authTry)
	if err != nil {
		return err
	}

	return nil

}

func (c *Connection) ConfirmForgotPassword(authSourceID string, payload map[string]interface{}, session *sess.Session) error {

	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return errors.New("Cognito Confirm Forgot Password:" + err.Error())
	}

	verificationCode, err := auth.GetPayloadValue(payload, "verificationcode")
	if err != nil {
		return errors.New("Cognito Confirm Forgot Password:" + err.Error())
	}

	newPassword, err := auth.GetPayloadValue(payload, "newpassword")
	if err != nil {
		return errors.New("Cognito Confirm Forgot Password:" + err.Error())
	}

	clientID, ok := (*c.credentials)["clientid"]
	if !ok {
		return errors.New("no client id provided in credentials")
	}

	cfg, err := creds.GetAWSConfig(context.Background(), c.credentials)
	if err != nil {
		return err
	}

	site := session.GetSiteTenantID()
	fqUsername := getFullyQualifiedUsername(site, username)

	authTry := &cognito.ConfirmForgotPasswordInput{
		Username:         &fqUsername,
		ClientId:         aws.String(clientID),
		ConfirmationCode: aws.String(verificationCode),
		Password:         aws.String(newPassword),
	}

	client := cognito.NewFromConfig(cfg)

	_, err = client.ConfirmForgotPassword(context.Background(), authTry)
	if err != nil {
		return err
	}

	return nil

}

func (c *Connection) ConfirmSignUp(authSourceID string, payload map[string]interface{}, session *sess.Session) error {

	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return errors.New("Cognito Confirm Forgot Password:" + err.Error())
	}

	verificationCode, err := auth.GetPayloadValue(payload, "verificationcode")
	if err != nil {
		return errors.New("Cognito Confirm Forgot Password:" + err.Error())
	}

	clientID, ok := (*c.credentials)["clientid"]
	if !ok {
		return errors.New("no client id provided in credentials")
	}

	cfg, err := creds.GetAWSConfig(context.Background(), c.credentials)
	if err != nil {
		return err
	}

	site := session.GetSiteTenantID()
	fqUsername := getFullyQualifiedUsername(site, username)

	authTry := &cognito.ConfirmSignUpInput{
		Username:         &fqUsername,
		ClientId:         aws.String(clientID),
		ConfirmationCode: aws.String(verificationCode),
	}

	client := cognito.NewFromConfig(cfg)

	_, err = client.ConfirmSignUp(context.Background(), authTry)
	if err != nil {
		return err
	}

	return nil

}

func (c *Connection) CreateLogin(signupMethod *meta.SignupMethod, payload map[string]interface{}, username string, session *sess.Session) (*auth.AuthenticationClaims, error) {

	site := session.GetSiteTenantID()
	fqUsername := getFullyQualifiedUsername(site, username)

	poolID, ok := (*c.credentials)["poolid"]
	if !ok {
		return nil, errors.New("no user pool provided in credentials")
	}

	cfg, err := creds.GetAWSConfig(context.Background(), c.credentials)
	if err != nil {
		return nil, err
	}

	client := cognito.NewFromConfig(cfg)

	awsUserExists := &cognito.AdminGetUserInput{
		Username:   &fqUsername,
		UserPoolId: aws.String(poolID),
	}

	adminGetUserOutput, _ := client.AdminGetUser(context.Background(), awsUserExists)
	if adminGetUserOutput != nil && adminGetUserOutput.Username != nil {
		return nil, errors.New("User already exists")
	}

	email, err := auth.GetRequiredPayloadValue(payload, "email")
	if err != nil {
		return nil, errors.New("Cognito login:" + err.Error())
	}

	signUpData := &cognito.AdminCreateUserInput{
		DesiredDeliveryMediums: []types.DeliveryMediumType{"EMAIL"},
		MessageAction:          types.MessageActionTypeSuppress,
		UserPoolId:             aws.String(poolID),
		Username:               &fqUsername,
		UserAttributes: []types.AttributeType{
			{
				Name:  aws.String("email"),
				Value: aws.String(email),
			},
		},
	}

	signUpOutput, err := client.AdminCreateUser(context.Background(), signUpData)
	if err != nil {
		return nil, err
	}

	attributes := signUpOutput.User.Attributes
	sub := findAttribute("sub", attributes)

	//set a random password
	AdminSetUserPasswordData := &cognito.AdminSetUserPasswordInput{
		UserPoolId: aws.String(poolID),
		Username:   &fqUsername,
		Permanent:  true,
		Password:   aws.String("Mysecretpassword1234*"),
	}

	_, err = client.AdminSetUserPassword(context.Background(), AdminSetUserPasswordData)
	if err != nil {
		return nil, err
	}

	//Trust user email
	trustEmailData := &cognito.AdminUpdateUserAttributesInput{
		UserAttributes: []types.AttributeType{{
			Name:  aws.String("email_verified"),
			Value: aws.String("true"),
		}},
		UserPoolId: aws.String(poolID),
		Username:   &fqUsername,
	}

	_, err = client.AdminUpdateUserAttributes(context.Background(), trustEmailData)
	if err != nil {
		return nil, err
	}

	subject, err := auth.GetRequiredPayloadValue(payload, "subject")
	if err != nil {
		return nil, errors.New("Cognito login:" + err.Error())
	}

	message, err := auth.GetRequiredPayloadValue(payload, "message")
	if err != nil {
		return nil, errors.New("Cognito login:" + err.Error())
	}

	//resetPassword
	resetPasswordData := &cognito.AdminResetUserPasswordInput{
		UserPoolId: aws.String(poolID),
		Username:   &fqUsername,
		ClientMetadata: map[string]string{
			"subject": subject,
			"message": message,
		},
	}

	_, err = client.AdminResetUserPassword(context.Background(), resetPasswordData)
	if err != nil {
		return nil, err
	}

	return &auth.AuthenticationClaims{
		Subject:  sub,
		Verified: true,
	}, nil
}

func findAttribute(name string, attributes []types.AttributeType) (result string) {
	result = ""
	for _, attribute := range attributes {
		if *attribute.Name == name {
			result = *attribute.Value
			break
		}
	}
	return result
}
