package cognito

import (
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	cognito "github.com/aws/aws-sdk-go/service/cognitoidentityprovider"
)

type CognitoClient interface {
	SignUp(username string, email string, password string) (*cognito.SignUpOutput, error)
	ConfirmSignup(email string, code string) error
	ConfirmForgotPassword(username string, confirmationCode string, newPassword string) error
	ForgotPassword(username string) (string, error)
	DeleteUser(username string) error
}

type awsCognitoClient struct {
	cognitoClient *cognito.CognitoIdentityProvider
	appClientId   string
}

func NewCognitoClient(cognitoRegion string, cognitoAppClientID string) CognitoClient {
	conf := &aws.Config{
		Region:      aws.String(cognitoRegion),
		Credentials: credentials.NewEnvCredentials(),
	}
	sess, err := session.NewSession(conf)
	client := cognito.New(sess)

	if err != nil {
		panic((err))
	}

	return &awsCognitoClient{
		cognitoClient: client,
		appClientId:   cognitoAppClientID,
	}
}

func (ctx *awsCognitoClient) SignUp(username string, email string, password string) (*cognito.SignUpOutput, error) {
	user := &cognito.SignUpInput{
		Username: aws.String(username),
		Password: aws.String(password),
		ClientId: aws.String(ctx.appClientId),
		UserAttributes: []*cognito.AttributeType{
			{
				Name:  aws.String("email"),
				Value: aws.String(email),
			},
		},
	}

	result, err := ctx.cognitoClient.SignUp(user)

	if err != nil {
		return result, err
	}

	return result, nil
}

func (ctx *awsCognitoClient) DeleteUser(username string) error {
	user := &cognito.AdminDeleteUserInput{
		UserPoolId: aws.String(os.Getenv("COGNITO_POOL_ID")),
		Username:   aws.String(username),
	}

	_, err := ctx.cognitoClient.AdminDeleteUser(user)

	return err
}

func (ctx *awsCognitoClient) ConfirmSignup(username string, code string) error {
	confirmSignUpInput := &cognito.ConfirmSignUpInput{
		Username:         aws.String(username),
		ConfirmationCode: aws.String(code),
		ClientId:         aws.String(ctx.appClientId),
	}
	_, err := ctx.cognitoClient.ConfirmSignUp(confirmSignUpInput)

	return err
}

func (ctx *awsCognitoClient) ForgotPassword(username string) (string, error) {
	input := &cognito.ForgotPasswordInput{
		ClientId: aws.String(ctx.appClientId),
		Username: aws.String(username),
	}

	result, err := ctx.cognitoClient.ForgotPassword(input)

	if err != nil {
		return "", err
	}

	return result.String(), nil
}

func (ctx *awsCognitoClient) ConfirmForgotPassword(username string, confirmationnCode string, newPassword string) error {
	input := &cognito.ConfirmForgotPasswordInput{
		ConfirmationCode: aws.String(confirmationnCode),
		Password:         aws.String(newPassword),
		ClientId:         aws.String(ctx.appClientId),
		Username:         aws.String(username),
	}
	_, err := ctx.cognitoClient.ConfirmForgotPassword(input)
	return err
}
