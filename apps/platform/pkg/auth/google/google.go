package google

import (
	verifier "github.com/futurenda/google-auth-id-token-verifier"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// Auth struct
type Auth struct {
}

// Verify function
func (a *Auth) Verify(token string, site *metadata.Site) error {
	v := verifier.Verifier{}
	aud, err := configstore.GetValue("uesio.googleClientId", site)
	if err != nil {
		return err
	}
	return v.VerifyIDToken(token, []string{
		aud,
	})
}

// Decode function
func (a *Auth) Decode(token string, site *metadata.Site) (*auth.AuthenticationClaims, error) {
	claimSet, err := verifier.Decode(token)
	if err != nil {
		return nil, err
	}

	return &auth.AuthenticationClaims{
		Subject:   claimSet.Sub,
		FirstName: claimSet.GivenName,
		LastName:  claimSet.FamilyName,
		AuthType:  "google",
		Email:     claimSet.Email,
	}, nil
}
