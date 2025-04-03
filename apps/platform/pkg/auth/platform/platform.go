package platform

import (
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"net/http"
	"regexp"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
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
	credentials *wire.Credentials
	authSource  *meta.AuthSource
	connection  wire.Connection
	session     *sess.Session
}

func (c *Connection) callListenerBot(botKey, code string, payload map[string]interface{}) error {

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

func (c *Connection) RequestLogin(w http.ResponseWriter, r *http.Request) {
	ctlutil.HandleError(w, errors.New("Requesting login is not supported by this auth source type"))
	return
}

func (c *Connection) Login(w http.ResponseWriter, r *http.Request) {
	var loginRequest map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&loginRequest)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException(errors.New("invalid login request body")))
		return
	}
	user, loginmethod, err := c.DoLogin(loginRequest)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	if loginmethod.ForceReset {
		loginMethod, err := datasource.WithTransactionResult(c.session, c.connection, func(connection wire.Connection) (*meta.LoginMethod, error) {
			c.connection = connection
			return c.ResetPassword(loginRequest, true)
		})
		if err != nil {
			ctlutil.HandleError(w, err)
			return
		}
		auth.ResetPasswordRedirectResponse(w, r, user, loginMethod, c.session)
		return
	}
	auth.LoginRedirectResponse(w, r, user, c.session)
}

func (c *Connection) DoLogin(payload map[string]interface{}) (*meta.User, *meta.LoginMethod, error) {

	username, err := auth.GetRequiredPayloadValue(payload, "username")
	if err != nil {
		return nil, nil, exceptions.NewBadRequestException(errors.New("You must enter a username"))
	}
	plainPassword, err := auth.GetRequiredPayloadValue(payload, "password")
	if err != nil {
		return nil, nil, exceptions.NewBadRequestException(errors.New("You must enter a password"))
	}

	loginmethod, err := auth.GetLoginMethod(username, c.authSource.GetKey(), c.connection, c.session)
	if err != nil {
		return nil, nil, exceptions.NewBadRequestException(fmt.Errorf("Failed getting login method data: %w", err))
	}

	if loginmethod == nil {
		return nil, nil, exceptions.NewBadRequestException(errors.New("No account found with this login method"))
	}

	if loginmethod.VerificationCode != "" {
		return nil, nil, exceptions.NewUnauthorizedException("Unable to login - your email address has not yet been verified. Please verify your email and then try again.")
	}

	err = bcrypt.CompareHashAndPassword([]byte(loginmethod.Hash), []byte(plainPassword))
	if err != nil {
		return nil, nil, exceptions.NewUnauthorizedException("The password you are trying to log in with is incorrect")
	}

	user, err := auth.GetUserByID(loginmethod.User.ID, c.session, c.connection)
	if err != nil {
		return nil, nil, err
	}

	return user, loginmethod, nil

}

func (c *Connection) Signup(signupMethod *meta.SignupMethod, payload map[string]interface{}, username string) error {

	email, err := auth.GetRequiredPayloadValue(payload, "email")
	if err != nil {
		return exceptions.NewBadRequestException(fmt.Errorf("Signup failed: %w", err))
	}

	firstname, err := auth.GetRequiredPayloadValue(payload, "firstname")
	if err != nil {
		return exceptions.NewBadRequestException(fmt.Errorf("Signup failed: %w", err))
	}

	lastname, err := auth.GetRequiredPayloadValue(payload, "lastname")
	if err != nil {
		return exceptions.NewBadRequestException(fmt.Errorf("Signup failed: %w", err))
	}

	password, err := auth.GetRequiredPayloadValue(payload, "password")
	if err != nil {
		return exceptions.NewBadRequestException(fmt.Errorf("Signup failed: %w", err))
	}

	err = passwordPolicyValidation(password)
	if err != nil {
		return exceptions.NewBadRequestException(fmt.Errorf("Signup failed: %w", err))
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
func (c *Connection) ResetPassword(payload map[string]interface{}, authenticated bool) (*meta.LoginMethod, error) {
	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return nil, exceptions.NewBadRequestException(fmt.Errorf("Unable to reset password: you must provide a username"))
	}

	code := generateCode()

	adminSession := sess.GetAnonSessionFrom(c.session)
	loginmethod, err := auth.GetLoginMethod(username, c.authSource.GetKey(), c.connection, adminSession)
	if err != nil {
		return nil, errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	user, err := auth.GetUserByKey(username, c.session, c.connection)
	if err != nil {
		return nil, err
	}

	loginmethod, err = auth.GetLoginMethodByUserID(user.ID, c.authSource.GetKey(), c.connection, c.session)
	if err != nil {
		return nil, err
	}

	if loginmethod == nil {
		return nil, exceptions.NewBadRequestException(fmt.Errorf("No account found with this login method"))
	}
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
func (c *Connection) ConfirmResetPassword(payload map[string]interface{}) (*meta.User, error) {
	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return nil, exceptions.NewBadRequestException(errors.New("A username must be provided"))
	}

	verificationCode, err := auth.GetPayloadValue(payload, "verificationcode")
	if err != nil {
		return nil, exceptions.NewBadRequestException(errors.New("A verification code must be provided"))
	}

	newPassword, err := auth.GetPayloadValue(payload, "newpassword")
	if err != nil {
		return nil, exceptions.NewBadRequestException(errors.New("A new password must be provided"))
	}

	err = passwordPolicyValidation(newPassword)
	if err != nil {
		return nil, exceptions.NewBadRequestException(fmt.Errorf("This password does not meet the password policy requirements: %w", err))
	}

	loginmethod, err := auth.GetLoginMethod(username, c.authSource.GetKey(), c.connection, c.session)
	if err != nil {
		return nil, errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return nil, exceptions.NewBadRequestException(errors.New("Unable to find this login method"))
	}

	if isExpired(loginmethod.VerificationExpires) {
		return nil, exceptions.NewBadRequestException(errors.New("The provided verification code has expired."))
	}

	if loginmethod.VerificationCode != verificationCode {
		return nil, exceptions.NewBadRequestException(errors.New("The provided verification code does not match."))
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, exceptions.NewBadRequestException(errors.New("The new password could not be used, please try another password"))
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
func (c *Connection) CreateLogin(signupMethod *meta.SignupMethod, payload map[string]interface{}, user *meta.User) error {

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
	}

	// 3. If the payload includes a "password" and a "forceReset" flag, set the forceReset flag on
	//    the login method.
	forceReset := param.GetBoolean(payload, "forceReset")
	if forceReset {
		loginMethod.ForceReset = true
	}

	err := auth.CreateLoginMethod(loginMethod, c.connection, c.session)
	if err != nil {
		return err
	}

	if hasPassword {
		_, err := c.ConfirmResetPassword(map[string]interface{}{
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
func (c *Connection) ConfirmSignUp(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	username, err := auth.GetRequiredPayloadValue(payload, "username")
	if err != nil {
		return exceptions.NewBadRequestException(errors.New("Username not provided"))
	}

	verificationCode, err := auth.GetRequiredPayloadValue(payload, "verificationcode")
	if err != nil {
		return exceptions.NewBadRequestException(errors.New("Verification code not provided"))
	}

	loginmethod, err := auth.GetLoginMethod(username, c.authSource.GetKey(), c.connection, c.session)
	if err != nil {
		return errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return errors.New("No account found with this login method")
	}

	if loginmethod.VerificationCode == "" {
		return exceptions.NewBadRequestException(errors.New("This account is already verified"))
	}

	if isExpired(loginmethod.VerificationExpires) {
		return exceptions.NewBadRequestException(errors.New("The code is expired, please request a new one"))
	}

	if loginmethod.VerificationCode != verificationCode {
		return exceptions.NewBadRequestException(errors.New("The codes do not match"))
	}

	loginmethod.VerificationCode = ""
	loginmethod.VerificationExpires = 0
	return datasource.PlatformSaveOne(loginmethod, nil, c.connection, c.session)

}
