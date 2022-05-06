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

func (c *Connection) Login(payload map[string]string, session *sess.Session) (*auth.AuthenticationClaims, error) {
	token, ok := payload["token"]
	if !ok {
		return nil, errors.New("No token provided for Mock login")
	}
	claim := auth.AuthenticationClaims{}
	err := json.Unmarshal([]byte(token), &claim)
	if err != nil {
		return nil, err
	}
	return &claim, nil
}
