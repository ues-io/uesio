package platform

import (
	"errors"
	"fmt"
	"math/rand"
	"regexp"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/integ/sendgrid"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type Auth struct{}

func (a *Auth) GetAuthConnection(credentials *adapt.Credentials, authSource *meta.AuthSource, connection adapt.Connection, session *sess.Session) (auth.AuthConnection, error) {

	return &Connection{
		credentials: credentials,
		authSource:  authSource,
		connection:  connection,
		session:     session,
	}, nil
}

func generateCode() string {
	return strings.Replace(strings.Trim(fmt.Sprint(rand.Perm(6)), "[]"), " ", "", -1)
}

func getExpireTimestamp() int64 {
	return time.Now().Add(time.Hour * 24).UnixNano()
}

func isExpired(timestamp int64) bool {
	return time.Unix(0, timestamp).Sub(time.Now()) < 0
}

type PasswordTest struct {
	test         string
	errorMessage string
}

var tests = []PasswordTest{{".{8,}", "password must have at least 8 characters"}, {"[a-z]", "password must have at least 1 lower case character"}, {"[A-Z]", "password must have at least 1 upper case character"}, {"[0-9]", "password must have at least 1 number"}, {"[^\\d\\w]", "password must have at least 1 special character"}}

func passwordPolicyValidation(password string) error {
	for _, test := range tests {
		t, _ := regexp.MatchString(test.test, password)
		if !t {
			return errors.New(test.errorMessage)
		}
	}
	return nil
}

type Connection struct {
	credentials *adapt.Credentials
	authSource  *meta.AuthSource
	connection  adapt.Connection
	session     *sess.Session
}

func (c *Connection) Login(payload map[string]interface{}) (*meta.User, error) {

	username, err := auth.GetRequiredPayloadValue(payload, "username")
	if err != nil {
		return nil, auth.NewAuthRequestError("Unable to login, " + err.Error())
	}
	plainPassword, err := auth.GetRequiredPayloadValue(payload, "password")
	if err != nil {
		return nil, auth.NewAuthRequestError("Unable to login, " + err.Error())
	}

	loginmethod, err := auth.GetLoginMethod(username, c.authSource.GetKey(), c.session)
	if err != nil {
		return nil, auth.NewAuthRequestError("Failed getting login method data: " + err.Error())
	}

	if loginmethod == nil {
		return nil, auth.NewAuthRequestError("No account found with this login method")
	}

	if loginmethod.VerificationCode != "" {
		return nil, auth.NewNotAuthorizedError("Unable to login - your email address has not yet been verified. Please verify your email and then try again.")
	}

	err = bcrypt.CompareHashAndPassword([]byte(loginmethod.Hash), []byte(plainPassword))
	if err != nil {
		return nil, auth.NewNotAuthorizedError("The password you are trying to log in with is incorrect")
	}

	return auth.GetUserByID(loginmethod.User.ID, c.session, c.connection)

}

func (c *Connection) Signup(signupMethod *meta.SignupMethod, payload map[string]interface{}, username string) error {

	email, err := auth.GetRequiredPayloadValue(payload, "email")
	if err != nil {
		return errors.New("Signup failed, " + err.Error())
	}

	firstname, err := auth.GetRequiredPayloadValue(payload, "firstname")
	if err != nil {
		return errors.New("Signup failed, " + err.Error())
	}

	lastname, err := auth.GetRequiredPayloadValue(payload, "lastname")
	if err != nil {
		return errors.New("Signup failed, " + err.Error())
	}

	password, err := auth.GetRequiredPayloadValue(payload, "password")
	if err != nil {
		return errors.New("Signup failed, " + err.Error())
	}

	err = passwordPolicyValidation(password)
	if err != nil {
		return errors.New("Signup failed: " + err.Error())
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	//Studio session is required to use the right integration
	integration, err := datasource.GetIntegration("uesio/core.sendgrid", sess.GetStudioAnonSession())
	if err != nil {
		return err
	}

	subject, err := auth.GetRequiredPayloadValue(payload, "subject")
	if err != nil {
		return err
	}

	message, err := auth.GetRequiredPayloadValue(payload, "message")
	if err != nil {
		return err
	}

	code := generateCode()
	plainBody := strings.Replace(message, "{####}", code, 1)

	options := sendgrid.SendEmailOptions{To: []string{email}, From: signupMethod.FromEmail, Subject: subject, PlainBody: plainBody, ContentType: signupMethod.Signup.EmailContentType}
	_, err = integration.RunAction("sendEmail", options)
	if err != nil {
		return fmt.Errorf("error sending signup email: %w", err)
	}

	user, err := auth.CreateUser(signupMethod, &meta.User{
		Username:  username,
		FirstName: firstname,
		LastName:  lastname,
		Email:     email,
	}, c.connection, c.session)
	if err != nil {
		return err
	}

	// Add verification code and password hash
	return auth.CreateLoginMethod(&meta.LoginMethod{
		FederationID:        username,
		User:                user,
		Hash:                string(hash),
		VerificationCode:    code,
		VerificationExpires: time.Now().Add(time.Hour * 24).UnixNano(),
		AuthSource:          signupMethod.AuthSource,
	}, c.connection, c.session)

}
func (c *Connection) ForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return auth.NewAuthRequestError("Unable to reset password: you must provide a username")
	}

	user, err := auth.GetUserByKey(username, c.session, nil)
	if err != nil {
		return auth.NewAuthRequestError("Unable to reset password forgot: this user cannot be found")
	}

	//Studio session is required to use the right integration
	integration, err := datasource.GetIntegration("uesio/core.sendgrid", sess.GetStudioAnonSession())
	if err != nil {
		return errors.New("Unable to send email: " + err.Error())
	}

	subject, err := auth.GetRequiredPayloadValue(payload, "subject")
	if err != nil {
		return errors.New("Uesio forgot password: " + err.Error())
	}

	message, err := auth.GetRequiredPayloadValue(payload, "message")
	if err != nil {
		return errors.New("Uesio forgot password: " + err.Error())
	}

	code := generateCode()
	plainBody := strings.Replace(message, "{####}", code, 1)

	adminSession := sess.GetAnonSession(c.session.GetSite())
	loginmethod, err := auth.GetLoginMethod(username, signupMethod.AuthSource, adminSession)
	if err != nil {
		return errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	loginmethod.VerificationCode = code
	loginmethod.VerificationExpires = getExpireTimestamp()
	err = datasource.PlatformSaveOne(loginmethod, nil, c.connection, c.session)
	if err != nil {
		return err
	}

	options := sendgrid.SendEmailOptions{To: []string{user.Email}, From: signupMethod.FromEmail, Subject: subject, PlainBody: plainBody, ContentType: signupMethod.ForgotPassword.EmailContentType}
	_, err = integration.RunAction("sendEmail", options)
	if err != nil {
		return errors.New("Could not reset password - unable to password reset email: " + err.Error())
	}

	return nil

}
func (c *Connection) ConfirmForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return auth.NewAuthRequestError("A username must be provided")
	}

	verificationCode, err := auth.GetPayloadValue(payload, "verificationcode")
	if err != nil {
		return auth.NewAuthRequestError("A verification code must be provided")
	}

	newPassword, err := auth.GetPayloadValue(payload, "newpassword")
	if err != nil {
		return auth.NewAuthRequestError("A new password must be provided")
	}

	err = passwordPolicyValidation(newPassword)
	if err != nil {
		return auth.NewAuthRequestError("This password does not meet the password policy requirements: " + err.Error())
	}

	loginmethod, err := auth.GetLoginMethod(username, c.authSource.GetKey(), c.session)
	if err != nil {
		return errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return auth.NewAuthRequestError("Unable to find this login method")
	}

	if isExpired(loginmethod.VerificationExpires) {
		return auth.NewAuthRequestError("The provided verification code has expired.")
	}

	if loginmethod.VerificationCode != verificationCode {
		return auth.NewAuthRequestError("The provided verification code does not match.")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return auth.NewAuthRequestError("The new password could not be used, please try another password")
	}

	loginmethod.Hash = string(hash)
	loginmethod.VerificationCode = ""
	loginmethod.VerificationExpires = 0
	return datasource.PlatformSaveOne(loginmethod, nil, c.connection, c.session)

}
func (c *Connection) CreateLogin(signupMethod *meta.SignupMethod, payload map[string]interface{}, user *meta.User) error {

	email, err := auth.GetPayloadValue(payload, "email")
	if err != nil {
		return err
	}

	//Studio session is required to use the right integration
	integration, err := datasource.GetIntegration("uesio/core.sendgrid", sess.GetStudioAnonSession())
	if err != nil {
		return err
	}

	subject, err := auth.GetRequiredPayloadValue(payload, "subject")
	if err != nil {
		return err
	}

	message, err := auth.GetRequiredPayloadValue(payload, "message")
	if err != nil {
		return err
	}

	code := generateCode()
	plainBody := strings.Replace(message, "{####}", code, 1)

	options := sendgrid.SendEmailOptions{To: []string{email}, From: signupMethod.FromEmail, Subject: subject, PlainBody: plainBody, ContentType: signupMethod.AdminCreate.EmailContentType}
	_, err = integration.RunAction("sendEmail", options)
	if err != nil {
		return err
	}

	return auth.CreateLoginMethod(&meta.LoginMethod{
		FederationID:        user.Username,
		User:                user,
		AuthSource:          signupMethod.AuthSource,
		VerificationCode:    code,
		VerificationExpires: getExpireTimestamp(),
	}, c.connection, c.session)

}
func (c *Connection) ConfirmSignUp(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	username, err := auth.GetRequiredPayloadValue(payload, "username")
	if err != nil {
		return auth.NewAuthRequestError("Username not provided")
	}

	verificationCode, err := auth.GetRequiredPayloadValue(payload, "verificationcode")
	if err != nil {
		return auth.NewAuthRequestError("Verification code not provided")
	}

	loginmethod, err := auth.GetLoginMethod(username, c.authSource.GetKey(), c.session)
	if err != nil {
		return errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return errors.New("No account found with this login method")
	}

	if loginmethod.VerificationCode == "" {
		return auth.NewAuthRequestError("This account is already verified")
	}

	if isExpired(loginmethod.VerificationExpires) {
		return auth.NewAuthRequestError("The code is expired, please request a new one")
	}

	if loginmethod.VerificationCode != verificationCode {
		return auth.NewAuthRequestError("The codes do not match")
	}

	loginmethod.VerificationCode = ""
	loginmethod.VerificationExpires = 0
	return datasource.PlatformSaveOne(loginmethod, nil, c.connection, c.session)

}
