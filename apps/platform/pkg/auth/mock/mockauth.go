package mock

import (
	"encoding/json"
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
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

func (c *Connection) Login(payload map[string]interface{}, session *sess.Session) (*auth.AuthenticationClaims, error) {

	token, err := auth.GetPayloadValue(payload, "token")
	if err != nil {
		return nil, errors.New("Mock login:" + err.Error())
	}
	claim := auth.AuthenticationClaims{}
	err = json.Unmarshal([]byte(token), &claim)
	if err != nil {
		return nil, err
	}
	return &claim, nil
}

func (c *Connection) Signup(payload map[string]interface{}, username string, session *sess.Session) (*auth.AuthenticationClaims, error) {
	return nil, nil
}

func (c *Connection) ForgotPassword(payload map[string]interface{}, session *sess.Session) error {
	return errors.New("Mock login: unfortunately you cannot change the password")
}
func (c *Connection) ConfirmForgotPassword(payload map[string]interface{}, session *sess.Session) error {
	return errors.New("Mock login: unfortunately you cannot change the password")
}
func (c *Connection) ConfirmSignUp(payload map[string]interface{}, session *sess.Session) error {
	return errors.New("Mock login: unfortunately you cannot change the password")
}
