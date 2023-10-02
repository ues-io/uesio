package uesioauth

import (
	"errors"
	"fmt"
	"math/rand"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/integ/sendgrid"
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

func (c *Connection) Login(payload map[string]interface{}, session *sess.Session) (*auth.AuthenticationClaims, error) {

	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return nil, errors.New("Cognito login:" + err.Error())
	}
	plainPassword, err := auth.GetPayloadValue(payload, "password")
	if err != nil {
		return nil, errors.New("Cognito login:" + err.Error())
	}

	adminSession := sess.GetAnonSession(session.GetSite())

	loginmethod, err := auth.GetLoginMethod(&auth.AuthenticationClaims{Subject: username}, "uesio/core.platform", adminSession)
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

func (c *Connection) Signup(payload map[string]interface{}, username string, session *sess.Session) (*auth.AuthenticationClaims, error) {

	email, err := auth.GetPayloadValue(payload, "email")
	if err != nil {
		return nil, errors.New("Uesio Signup:" + err.Error())
	}

	password, err := auth.GetPayloadValue(payload, "password")
	if err != nil {
		return nil, errors.New("Uesio Signup:" + err.Error())
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("Uesio Signup:" + err.Error())
	}
	//email part
	integration, err := datasource.GetIntegration("uesio/core.sendgrid", session)
	if err != nil {
		return nil, err
	}
	subject, err := auth.GetRequiredPayloadValue(payload, "subject")
	if err != nil {
		return nil, errors.New("Uesio Signup:" + err.Error())
	}
	message, err := auth.GetRequiredPayloadValue(payload, "message")
	if err != nil {
		return nil, errors.New("Uesio Signup:" + err.Error())
	}
	options := sendgrid.SendEmailOptions{To: []string{email}, From: "info@ues.io", Subject: subject, PlainBody: message}
	test, err := integration.RunAction("sendEmail", options)
	if err != nil {
		return nil, err
	}
	println(test)

	//TO-DO
	//CREATE the user in pending state
	//shall we check if the email already exists? no need to check
	//send an email with a code --> verification code and is pending
	//what shall we use as subject --> abel the username? like mock?

	return &auth.AuthenticationClaims{
		Subject:  username,
		Hash:     string(hash),
		Verified: false,
		Code:     strings.Trim(fmt.Sprint(rand.Perm(6)), "[]"),
	}, nil
}
func (c *Connection) ForgotPassword(payload map[string]interface{}, session *sess.Session) error {
	return errors.New("Mock login: unfortunately you cannot change the password")
}
func (c *Connection) ConfirmForgotPassword(payload map[string]interface{}, session *sess.Session) error {
	return errors.New("Mock login: unfortunately you cannot change the password")
}
func (c *Connection) CreateLogin(payload map[string]interface{}, username string, session *sess.Session) (*auth.AuthenticationClaims, error) {
	return nil, errors.New("Mock login: unfortunately you cannot create a login")
}
func (c *Connection) ConfirmSignUp(payload map[string]interface{}, session *sess.Session) error {

	username, err := auth.GetPayloadValue(payload, "username")
	if err != nil {
		return errors.New("Cognito Confirm Forgot Password:" + err.Error())
	}

	verificationCode, err := auth.GetPayloadValue(payload, "verificationcode")
	if err != nil {
		return errors.New("Cognito Confirm Forgot Password:" + err.Error())
	}

	adminSession := sess.GetAnonSession(session.GetSite())

	loginmethod, err := auth.GetLoginMethod(&auth.AuthenticationClaims{Subject: username}, "uesio/core.platform", adminSession)
	if err != nil {
		return errors.New("Failed Getting Login Method Data: " + err.Error())
	}

	if loginmethod == nil {
		return errors.New("No account found with this login method")
	}

	if loginmethod.Code != verificationCode {
		return errors.New("The codes do not match")
	}

	loginmethod.Verified = true
	//TO-DO maybe the adminsession?
	err = datasource.PlatformSaveOne(loginmethod, nil, nil, session)
	if err != nil {
		return err
	}

	return nil
}
