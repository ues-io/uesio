package mock

import (
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

// Auth struct
type Auth struct {
}

// Verify function
func (a *Auth) Verify(token string, site *meta.Site) error {
	return nil
}

// Decode function
func (a *Auth) Decode(token string, site *meta.Site) (*auth.AuthenticationClaims, error) {
	return &auth.AuthenticationClaims{
		Subject:   "MockSubject",
		FirstName: "Ben",
		LastName:  "Hubbard",
		AuthType:  "mock",
		Email:     "plusplusben@gmail.com",
	}, nil
}
