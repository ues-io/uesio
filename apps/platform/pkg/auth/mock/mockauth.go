package mock

import (
	"errors"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Auth struct
type Auth struct {
}

// Verify function
func (a *Auth) Verify(token string, session *sess.Session) error {
	return nil
}

// Decode function
func (a *Auth) Decode(token string, session *sess.Session) (*auth.AuthenticationClaims, error) {
	if token == "Ben" {
		return &auth.AuthenticationClaims{
			Subject:   "MockBen",
			FirstName: "Ben",
			LastName:  "Hubbard",
			AuthType:  "mock",
			Email:     "ben@thecloudmasters.com",
		}, nil
	}
	if token == "Abel" {
		return &auth.AuthenticationClaims{
			Subject:   "MockAbel",
			FirstName: "Abel",
			LastName:  "Abel",
			AuthType:  "mock",
			Email:     "abel@thecloudmasters.com",
		}, nil
	}
	if token == "Jackson" {
		return &auth.AuthenticationClaims{
			Subject:   "MockJackson",
			FirstName: "Jackson",
			LastName:  "Stone",
			AuthType:  "mock",
			Email:     "jackson@thecloudmasters.com",
		}, nil
	}
	return nil, errors.New("Unknown mocked user")

}
