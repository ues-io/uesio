package platform

import (
	"errors"
	"fmt"
	"math/rand"
	"net/http"
	"regexp"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/crewjam/saml"
	"github.com/crewjam/saml/samlsp"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/param"
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

func generateCode() string {
	return strings.ReplaceAll(strings.Trim(fmt.Sprint(rand.Perm(6)), "[]"), " ", "")
}

func getExpireTimestamp() int64 {
	return time.Now().Add(time.Hour * 24).UnixNano()
}

func isExpired(timestamp int64) bool {
	return time.Until(time.Unix(0, timestamp)) < 0
}

type PasswordTest struct {
	test         string
	errorMessage string
}

var tests = []PasswordTest{
	{".{8,}", "password must have at least 8 characters"},
	{"[a-z]", "password must have at least 1 lower case character"},
	{"[A-Z]", "password must have at least 1 upper case character"},
	{"[0-9]", "password must have at least 1 number"},
	{"[" + regexp.QuoteMeta(PasswordPolicyAllowedSymbols) + "]",
		"password must have at least 1 special character: " + PasswordPolicyAllowedSymbols},
}

// NOTE: Hypen must be at beginning or end of the list to avoid being treated as a range when used in regex.
const PasswordPolicyAllowedSymbols = `~!@#$%^&*()_+={}|[]\:"<>?,./` + "`-"
const PasswordPolicySimplifiedSymbols = `!@#$%^&*(){}[]` // should be a subset of PasswordPolicyAllowedSymbols

func passwordPolicyValidation(password string) error {
	for _, test := range tests {
		if t, err := regexp.MatchString(test.test, password); err != nil {
			return err
		} else if !t {
			return errors.New(test.errorMessage)
		}
	}
	return nil
}

type Connection struct {
	credentials *wire.Credentials
	authSource  *meta.AuthSource
	connection  wire.Connection
	session     *sess.Session
}

func (c *Connection) callListenerBot(botKey, code string, payload auth.AuthRequest) error {

	site := c.session.GetSite()

	domain, err := datasource.QueryDomainFromSite(site.ID, c.connection)
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

func (c *Connection) Login(loginRequest auth.AuthRequest) (*auth.LoginResult, error) {
	user, loginMethod, err := c.DoLogin(loginRequest)
	if err != nil {
		return nil, err
	}

	requiresReset := loginMethod.ForceReset
	if requiresReset {
		loginMethod, err = datasource.WithTransactionResult(c.session, c.connection, func(connection wire.Connection) (*meta.LoginMethod, error) {
			c.connection = connection
			return c.ResetPassword(loginRequest, true)
		})
		if err != nil {
			return nil, err
		}
	}

	return &auth.LoginResult{
		AuthResult:    auth.AuthResult{User: user, LoginMethod: loginMethod},
		PasswordReset: requiresReset,
	}, nil
}

func (c *Connection) DoLogin(payload auth.AuthRequest) (*meta.User, *meta.LoginMethod, error) {

	username, err := auth.GetRequiredPayloadValue(payload, "username")
	if err != nil {
		return nil, nil, exceptions.NewBadRequestException("you must enter a username", nil)
	}
	plainPassword, err := auth.GetRequiredPayloadValue(payload, "password")
	if err != nil {
		return nil, nil, exceptions.NewBadRequestException("you must enter a password", nil)
	}

	loginmethod, err := auth.GetLoginMethod(username, c.authSource.GetKey(), c.connection, c.session)
	if err != nil {
		return nil, nil, exceptions.NewBadRequestException("failed getting login method data", err)
	}

	if loginmethod == nil {
		return nil, nil, exceptions.NewBadRequestException("no account found with this login method", nil)
	}

	if loginmethod.VerificationCode != "" {
		return nil, nil, exceptions.NewUnauthorizedException("unable to login - your email address has not yet been verified, please check your email for a verification code")
	}

	err = bcrypt.CompareHashAndPassword([]byte(loginmethod.Hash), []byte(plainPassword))
	if err != nil {
		return nil, nil, exceptions.NewUnauthorizedException("the password you are trying to log in with is incorrect")
	}

	user, err := auth.GetUserByID(loginmethod.User.ID, c.session, c.connection)
	if err != nil {
		return nil, nil, err
	}

	return user, loginmethod, nil

}

func (c *Connection) Signup(signupMethod *meta.SignupMethod, payload auth.AuthRequest, username string) error {

	email, err := auth.GetRequiredPayloadValue(payload, "email")
	if err != nil {
		return exceptions.NewBadRequestException("Signup failed", err)
	}

	firstname, err := auth.GetRequiredPayloadValue(payload, "firstname")
	if err != nil {
		return exceptions.NewBadRequestException("Signup failed", err)
	}

	lastname, err := auth.GetRequiredPayloadValue(payload, "lastname")
	if err != nil {
		return exceptions.NewBadRequestException("Signup failed", err)
	}

	password, err := auth.GetRequiredPayloadValue(payload, "password")
	if err != nil {
		return exceptions.NewBadRequestException("Signup failed", err)
	}

	err = passwordPolicyValidation(password)
	if err != nil {
		return exceptions.NewBadRequestException("Signup failed", err)
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
		SignupMethod:        signupMethod.GetKey(),
	}, c.connection, c.session)
	if err != nil {
		return err
	}

	return c.callListenerBot(signupMethod.SignupBot, code, payload)

}
func (c *Connection) ResetPassword(payload auth.AuthRequest, authenticated bool) (*meta.LoginMethod, error) {
	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return nil, exceptions.NewBadRequestException("unable to reset password: you must provide a username", nil)
	}

	user, err := auth.GetUserByKey(username, c.session, c.connection)
	if err != nil {
		return nil, err
	}

	loginmethod, err := auth.GetLoginMethodByUserID(user.ID, c.authSource.GetKey(), c.connection, c.session)
	if err != nil {
		return nil, err
	}

	if loginmethod == nil {
		return nil, exceptions.NewBadRequestException("no account found with this login method", nil)
	}

	code := generateCode()

	loginmethod.FederationID = username
	loginmethod.VerificationCode = code
	loginmethod.VerificationExpires = getExpireTimestamp()
	loginmethod.TemporaryPassword = ""
	loginmethod.ForceReset = false
	err = datasource.PlatformSaveOne(loginmethod, nil, c.connection, c.session)
	if err != nil {
		return nil, err
	}

	// For now, don't send the email to the reset password bot if the reset request is authenticated
	// The flow for authenticated resets is to just redirect the user to the reset page with the
	// reset code already included in the url.
	if authenticated {
		payload["authenticated"] = true
	} else {
		payload["email"] = user.Email
	}

	// Get the signup method from the login method
	signupMethodKey := loginmethod.SignupMethod
	if signupMethodKey == "" {
		return loginmethod, nil
	}

	signupMethod, err := auth.GetSignupMethod(signupMethodKey, c.session)
	if err != nil {
		return nil, err
	}

	if signupMethod.ResetPasswordBot == "" {
		return loginmethod, nil
	}

	return loginmethod, c.callListenerBot(signupMethod.ResetPasswordBot, code, payload)

}
func (c *Connection) ConfirmResetPassword(payload auth.AuthRequest) (*meta.User, error) {
	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return nil, exceptions.NewBadRequestException("a username must be provided", nil)
	}

	verificationCode, err := auth.GetPayloadValue(payload, "verificationcode")
	if err != nil {
		return nil, exceptions.NewBadRequestException("a verification code must be provided", nil)
	}

	newPassword, err := auth.GetPayloadValue(payload, "newpassword")
	if err != nil {
		return nil, exceptions.NewBadRequestException("a new password must be provided", nil)
	}

	err = passwordPolicyValidation(newPassword)
	if err != nil {
		return nil, exceptions.NewBadRequestException("this password does not meet the password policy requirements", err)
	}

	loginmethod, err := auth.GetLoginMethod(username, c.authSource.GetKey(), c.connection, c.session)
	if err != nil {
		return nil, fmt.Errorf("failed getting login method data: %w", err)
	}

	if loginmethod == nil {
		return nil, exceptions.NewBadRequestException("unable to find this login method", nil)
	}

	if isExpired(loginmethod.VerificationExpires) {
		return nil, exceptions.NewBadRequestException("the provided verification code has expired", nil)
	}

	if loginmethod.VerificationCode != verificationCode {
		return nil, exceptions.NewBadRequestException("the provided verification code does not match", nil)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, exceptions.NewBadRequestException("the new password could not be used, please try another password", nil)
	}

	loginmethod.Hash = string(hash)
	loginmethod.VerificationCode = ""
	loginmethod.VerificationExpires = 0
	err = datasource.PlatformSaveOne(loginmethod, nil, c.connection, c.session)
	if err != nil {
		return nil, err
	}
	return auth.GetUserByID(loginmethod.User.ID, c.session, c.connection)

}
func (c *Connection) CreateLogin(signupMethod *meta.SignupMethod, payload auth.AuthRequest, user *meta.User) error {

	code := generateCode()

	loginMethod := &meta.LoginMethod{
		FederationID:        user.Username,
		User:                user,
		AuthSource:          signupMethod.AuthSource,
		VerificationCode:    code,
		VerificationExpires: getExpireTimestamp(),
		SignupMethod:        signupMethod.GetKey(),
	}

	// 1. If the payload includes a "password", go ahead and auto verify and set the password
	var password string
	if passwordValue, ok := payload["password"]; ok {
		if passwordValue, ok := passwordValue.(string); !ok {
			return exceptions.NewInvalidParamException("password must be a string", "password")
		} else {
			password = passwordValue
		}
	}
	hasPassword := password != ""
	payload["hasPassword"] = hasPassword

	// 2. If the payload includes a "password" and a "setTemporary" flag, set the password into
	//    the temporary password field as well.
	setTemporary := param.GetBoolean(payload, "setTemporary")
	if hasPassword && setTemporary {
		loginMethod.TemporaryPassword = password
		loginMethod.ForceReset = true
	}

	// 3. If the payload includes a "password" and a "forceReset" flag, set the forceReset flag on
	//    the login method or if we do not have a password.
	// NOTE: If there is no password, all of the required values for the email notification (e.g., email address)
	// must be provided in the payload.
	forceReset := !hasPassword || param.GetBoolean(payload, "forceReset")
	if forceReset {
		loginMethod.ForceReset = true
	}

	err := auth.CreateLoginMethod(loginMethod, c.connection, c.session)
	if err != nil {
		return err
	}

	if hasPassword {
		_, err := c.ConfirmResetPassword(auth.AuthRequest{
			"username":         user.Username,
			"verificationcode": code,
			"newpassword":      password,
		})
		if err != nil {
			return err
		}
	}

	// For security purposes, don't send passwords to create login bots.
	delete(payload, "password")

	if signupMethod.CreateLoginBot == "" {
		return nil
	}

	return c.callListenerBot(signupMethod.CreateLoginBot, code, payload)

}
func (c *Connection) ConfirmSignUp(signupMethod *meta.SignupMethod, payload auth.AuthRequest) error {
	username, err := auth.GetRequiredPayloadValue(payload, "username")
	if err != nil {
		return exceptions.NewBadRequestException("username not provided", nil)
	}

	verificationCode, err := auth.GetRequiredPayloadValue(payload, "verificationcode")
	if err != nil {
		return exceptions.NewBadRequestException("verification code not provided", nil)
	}

	loginmethod, err := auth.GetLoginMethod(username, c.authSource.GetKey(), c.connection, c.session)
	if err != nil {
		return fmt.Errorf("failed getting login method data: %w", err)
	}

	if loginmethod == nil {
		return errors.New("no account found with this login method")
	}

	if loginmethod.VerificationCode == "" {
		return exceptions.NewBadRequestException("this account is already verified", nil)
	}

	if isExpired(loginmethod.VerificationExpires) {
		return exceptions.NewBadRequestException("the code is expired, please request a new one", nil)
	}

	if loginmethod.VerificationCode != verificationCode {
		return exceptions.NewBadRequestException("the codes do not match", nil)
	}

	loginmethod.VerificationCode = ""
	loginmethod.VerificationExpires = 0
	return datasource.PlatformSaveOne(loginmethod, nil, c.connection, c.session)

}
func (c *Connection) GetServiceProvider(r *http.Request) (*samlsp.Middleware, error) {
	return nil, errors.New("saml auth is not supported by this auth source type")
}
func (c *Connection) LoginServiceProvider(assertion *saml.Assertion) (*auth.LoginResult, error) {
	return nil, errors.New("saml auth login is not supported by this auth source type")
}
func (c *Connection) LoginCLI(loginRequest auth.AuthRequest) (*auth.LoginResult, error) {
	return c.Login(loginRequest)
}
