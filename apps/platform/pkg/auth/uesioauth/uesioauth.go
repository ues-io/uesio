package uesioauth

import (
	"errors"
	"fmt"
	"math/rand"
	"regexp"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/integ/sendgrid"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"golang.org/x/crypto/bcrypt"
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

func generateCode() string {
	return strings.Replace(strings.Trim(fmt.Sprint(rand.Perm(6)), "[]"), " ", "", -1)
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

func (c *Connection) Login(authSourceID string, payload map[string]interface{}, session *sess.Session) (*auth.AuthenticationClaims, error) {

	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return nil, errors.New("Uesio login:" + err.Error())
	}
	plainPassword, err := auth.GetPayloadValue(payload, "password")
	if err != nil {
		return nil, errors.New("Uesio login:" + err.Error())
	}

	adminSession := sess.GetAnonSession(session.GetSite())

	loginmethod, err := auth.GetLoginMethod(&auth.AuthenticationClaims{Subject: username}, authSourceID, adminSession)
	if err != nil {
		return nil, errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return nil, errors.New("No account found with this login method")
	}

	if !loginmethod.Verified {
		return nil, errors.New("Please verify your email")
	}

	err = bcrypt.CompareHashAndPassword([]byte(loginmethod.Hash), []byte(plainPassword))
	if err != nil {
		return nil, errors.New("The password you are trying to log in with is incorrect")
	}

	return &auth.AuthenticationClaims{
		Subject: username,
	}, nil

}

func (c *Connection) Signup(signupMethod *meta.SignupMethod, payload map[string]interface{}, username string, session *sess.Session) (*auth.AuthenticationClaims, error) {

	email, err := auth.GetPayloadValue(payload, "email")
	if err != nil {
		return nil, errors.New("Uesio singup:" + err.Error())
	}

	password, err := auth.GetPayloadValue(payload, "password")
	if err != nil {
		return nil, errors.New("Uesio singup:" + err.Error())
	}

	err = passwordPolicyValidation(password)
	if err != nil {
		return nil, errors.New("Uesio singup:" + err.Error())
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("Uesio singup:" + err.Error())
	}

	//Studio session is required to use the right integration
	integration, err := datasource.GetIntegration("uesio/core.sendgrid", sess.GetStudioAnonSession())
	if err != nil {
		return nil, errors.New("Uesio singup:" + err.Error())
	}

	subject, err := auth.GetRequiredPayloadValue(payload, "subject")
	if err != nil {
		return nil, errors.New("Uesio singup:" + err.Error())
	}

	message, err := auth.GetRequiredPayloadValue(payload, "message")
	if err != nil {
		return nil, errors.New("Uesio singup:" + err.Error())
	}

	code := generateCode()
	plainBody := strings.Replace(message, "{####}", code, 1)

	options := sendgrid.SendEmailOptions{To: []string{email}, From: signupMethod.FromEmail, Subject: subject, PlainBody: plainBody}
	_, err = integration.RunAction("sendEmail", options)
	if err != nil {
		return nil, errors.New("Uesio singup:" + err.Error())
	}

	return &auth.AuthenticationClaims{
		Subject:  username,
		Hash:     string(hash),
		Verified: false,
		Code:     code,
	}, nil
}
func (c *Connection) ForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}, session *sess.Session) error {

	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return errors.New("Uesio forgot password:" + err.Error())
	}

	user, err := auth.GetUserByKey(username, session, nil)
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

	adminSession := sess.GetAnonSession(session.GetSite())
	loginmethod, err := auth.GetLoginMethod(&auth.AuthenticationClaims{Subject: username}, signupMethod.AuthSource, adminSession)
	if err != nil {
		return errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	loginmethod.Code = code
	err = datasource.PlatformSaveOne(loginmethod, nil, nil, session)
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
func (c *Connection) ConfirmForgotPassword(authSourceID string, payload map[string]interface{}, session *sess.Session) error {
	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return errors.New("Uesio confirm forgot password:" + err.Error())
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

	adminSession := sess.GetAnonSession(session.GetSite())

	loginmethod, err := auth.GetLoginMethod(&auth.AuthenticationClaims{Subject: username}, authSourceID, adminSession)
	if err != nil {
		return errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return errors.New("No account found with this login method")
	}

	if loginmethod.Code != verificationCode {
		return errors.New("The codes do not match")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("Uesio confirm forgot password:" + err.Error())
	}

	loginmethod.Hash = string(hash)
	loginmethod.Verified = true
	err = datasource.PlatformSaveOne(loginmethod, nil, nil, session)
	if err != nil {
		return err
	}

	return nil

}
func (c *Connection) CreateLogin(signupMethod *meta.SignupMethod, payload map[string]interface{}, username string, session *sess.Session) (*auth.AuthenticationClaims, error) {

	email, err := auth.GetPayloadValue(payload, "email")
	if err != nil {
		return nil, errors.New("Uesio create login:" + err.Error())
	}

	//Studio session is required to use the right integration
	integration, err := datasource.GetIntegration("uesio/core.sendgrid", sess.GetStudioAnonSession())
	if err != nil {
		return nil, errors.New("Uesio create login:" + err.Error())
	}

	subject, err := auth.GetRequiredPayloadValue(payload, "subject")
	if err != nil {
		return nil, errors.New("Uesio create login:" + err.Error())
	}

	message, err := auth.GetRequiredPayloadValue(payload, "message")
	if err != nil {
		return nil, errors.New("Uesio create login:" + err.Error())
	}

	code := generateCode()
	plainBody := strings.Replace(message, "{####}", code, 1)

	options := sendgrid.SendEmailOptions{To: []string{email}, From: signupMethod.FromEmail, Subject: subject, PlainBody: plainBody}
	_, err = integration.RunAction("sendEmail", options)
	if err != nil {
		return nil, errors.New("Uesio create login:" + err.Error())
	}

	return &auth.AuthenticationClaims{
		Subject: username,
		Code:    code,
	}, nil

}
func (c *Connection) ConfirmSignUp(authSourceID string, payload map[string]interface{}, session *sess.Session) error {

	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return errors.New("Uesio confirm forgot password:" + err.Error())
	}

	verificationCode, err := auth.GetPayloadValue(payload, "verificationcode")
	if err != nil {
		return errors.New("Uesio confirm forgot password:" + err.Error())
	}

	adminSession := sess.GetAnonSession(session.GetSite())

	loginmethod, err := auth.GetLoginMethod(&auth.AuthenticationClaims{Subject: username}, authSourceID, adminSession)
	if err != nil {
		return errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return errors.New("No account found with this login method")
	}

	if loginmethod.Verified {
		return errors.New("This account is already verified")
	}

	if loginmethod.Code != verificationCode {
		return errors.New("The codes do not match")
	}

	loginmethod.Verified = true
	err = datasource.PlatformSaveOne(loginmethod, nil, nil, session)
	if err != nil {
		return err
	}

	return nil
}
