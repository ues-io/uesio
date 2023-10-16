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

func (c *Connection) callListnerBot(botKey, code string, payload map[string]interface{}) error {

	site := c.session.GetSite()

	domain, err := datasource.QueryDomainFromSite(site.ID)
	if err != nil {
		return err
	}

	host := datasource.GetHostFromDomain(domain, site)

	payload["host"] = host
	payload["code"] = code

	namespace, name, err := meta.ParseKey(botKey)
	if err != nil {
		return err
	}

	_, err = datasource.CallListenerBot(namespace, name, payload, c.connection, c.session)
	if err != nil {
		return err
	}

	return nil
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

	// TEMPORARY FOR MIGRATION FROM COGNITO
	if loginmethod.VerificationCode == "" && loginmethod.Hash == "" {
		cognitoConnection, err := auth.GetAuthConnection("uesio/core.cognito", c.connection, c.session)
		if err != nil {
			return nil, err
		}
		return cognitoConnection.Login(payload)
	}
	// END TEMPORARY

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

	code := generateCode()

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
	err = auth.CreateLoginMethod(&meta.LoginMethod{
		FederationID:        username,
		User:                user,
		Hash:                string(hash),
		VerificationCode:    code,
		VerificationExpires: time.Now().Add(time.Hour * 24).UnixNano(),
		AuthSource:          signupMethod.AuthSource,
	}, c.connection, c.session)
	if err != nil {
		return err
	}

	return c.callListnerBot(signupMethod.SignupBot, code, payload)

}
func (c *Connection) ForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return auth.NewAuthRequestError("Unable to reset password: you must provide a username")
	}

	code := generateCode()

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

	return c.callListnerBot(signupMethod.ForgotPasswordBot, code, payload)

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

	code := generateCode()

	err := auth.CreateLoginMethod(&meta.LoginMethod{
		FederationID:        user.Username,
		User:                user,
		AuthSource:          signupMethod.AuthSource,
		VerificationCode:    code,
		VerificationExpires: getExpireTimestamp(),
	}, c.connection, c.session)
	if err != nil {
		return err
	}

	return c.callListnerBot(signupMethod.CreateLoginBot, code, payload)

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
