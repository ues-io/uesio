package mock

import (
	"encoding/json"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Auth struct
type Auth struct {
}

// Verify function
func (a *Auth) Verify(token string, credentialsKey string, session *sess.Session) error {
	return nil
}

// Decode function
func (a *Auth) Decode(token string, credentialsKey string, session *sess.Session) (*auth.AuthenticationClaims, error) {
	claim := auth.AuthenticationClaims{}
	err := json.Unmarshal([]byte(token), &claim)
	if err != nil {
		return nil, err
	}
	return &claim, nil
}
