package platform

import (
	"errors"
	"fmt"
	"math/rand"
	"regexp"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/integ/sendgrid"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"golang.org/x/crypto/bcrypt"
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
	ErrorMessage string
}

var tests = []PasswordTest{{".{8,}", "password must have at least 8 characters"}, {"[a-z]", "password must have at least 1 lower case character"}, {"[A-Z]", "password must have at least 1 upper case character"}, {"[0-9]", "password must have at least 1 number"}, {"[^\\d\\w]", "password must have at least 1 special character"}}

func passwordPolicyValidation(password string) error {
	for _, test := range tests {
		t, _ := regexp.MatchString(test.test, password)
		if !t {
			return errors.New(test.ErrorMessage)
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

	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return nil, errors.New("Uesio login:" + err.Error())
	}
	plainPassword, err := auth.GetPayloadValue(payload, "password")
	if err != nil {
		return nil, errors.New("Uesio login:" + err.Error())
	}

	loginmethod, err := auth.GetLoginMethod(username, c.authSource.GetKey(), c.session)
	if err != nil {
		return nil, errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return nil, errors.New("No account found with this login method")
	}

	if loginmethod.VerificationCode != "" {
		return nil, errors.New("Please verify your email")
	}

	err = bcrypt.CompareHashAndPassword([]byte(loginmethod.Hash), []byte(plainPassword))
	if err != nil {
		return nil, errors.New("The password you are trying to log in with is incorrect")
	}

	return auth.GetUserByID(loginmethod.User.ID, c.session, c.connection)

}

func (c *Connection) Signup(signupMethod *meta.SignupMethod, payload map[string]interface{}, username string) error {

	email, err := auth.GetPayloadValue(payload, "email")
	if err != nil {
		return err
	}

	password, err := auth.GetPayloadValue(payload, "password")
	if err != nil {
		return err
	}

	err = passwordPolicyValidation(password)
	if err != nil {
		return err
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

	firstname, err := auth.GetRequiredPayloadValue(payload, "firstname")
	if err != nil {
		return err
	}

	lastname, err := auth.GetRequiredPayloadValue(payload, "lastname")
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

	options := sendgrid.SendEmailOptions{To: []string{email}, From: signupMethod.FromEmail, Subject: subject, PlainBody: plainBody}
	_, err = integration.RunAction("sendEmail", options)
	if err != nil {
		return fmt.Errorf("Error sending signup Email: %w", err)
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
		return errors.New("Uesio forgot password:" + err.Error())
	}

	user, err := auth.GetUserByKey(username, c.session, nil)
	if err != nil {
		return errors.New("Uesio forgot password:" + err.Error())
	}

	//Studio session is required to use the right integration
	integration, err := datasource.GetIntegration("uesio/core.sendgrid", sess.GetStudioAnonSession())
	if err != nil {
		return errors.New("Uesio forgot password:" + err.Error())
	}

	subject, err := auth.GetRequiredPayloadValue(payload, "subject")
	if err != nil {
		return errors.New("Uesio forgot password:" + err.Error())
	}

	message, err := auth.GetRequiredPayloadValue(payload, "message")
	if err != nil {
		return errors.New("Uesio forgot password:" + err.Error())
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

	options := sendgrid.SendEmailOptions{To: []string{user.Email}, From: signupMethod.FromEmail, Subject: subject, PlainBody: plainBody}
	_, err = integration.RunAction("sendEmail", options)
	if err != nil {
		return errors.New("Uesio forgot password:" + err.Error())
	}

	return nil

}
func (c *Connection) ConfirmForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return err
	}

	verificationCode, err := auth.GetPayloadValue(payload, "verificationcode")
	if err != nil {
		return errors.New("Uesio confirm forgot password:" + err.Error())
	}

	newPassword, err := auth.GetPayloadValue(payload, "newpassword")
	if err != nil {
		return errors.New("Uesio confirm forgot password:" + err.Error())
	}

	err = passwordPolicyValidation(newPassword)
	if err != nil {
		return errors.New("Uesio confirm forgot password:" + err.Error())
	}

	loginmethod, err := auth.GetLoginMethod(username, c.authSource.GetKey(), c.session)
	if err != nil {
		return errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return errors.New("No account found with this login method")
	}

	if isExpired(loginmethod.VerificationExpires) {
		return errors.New("The code Expired, please request a new one")
	}

	if loginmethod.VerificationCode != verificationCode {
		return errors.New("The codes do not match")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("Uesio confirm forgot password:" + err.Error())
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

	options := sendgrid.SendEmailOptions{To: []string{email}, From: signupMethod.FromEmail, Subject: subject, PlainBody: plainBody}
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
	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return errors.New("Uesio confirm forgot password:" + err.Error())
	}

	verificationCode, err := auth.GetPayloadValue(payload, "verificationcode")
	if err != nil {
		return errors.New("Uesio confirm forgot password:" + err.Error())
	}

	loginmethod, err := auth.GetLoginMethod(username, c.authSource.GetKey(), c.session)
	if err != nil {
		return errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return errors.New("No account found with this login method")
	}

	if loginmethod.VerificationCode == "" {
		return errors.New("This account is already verified")
	}

	if isExpired(loginmethod.VerificationExpires) {
		return errors.New("The code Expired, please request a new one")
	}

	if loginmethod.VerificationCode != verificationCode {
		return errors.New("The codes do not match")
	}

	loginmethod.VerificationCode = ""
	loginmethod.VerificationExpires = 0
	return datasource.PlatformSaveOne(loginmethod, nil, c.connection, c.session)

}
