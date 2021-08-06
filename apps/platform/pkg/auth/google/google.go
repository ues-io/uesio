package google

import (
	verifier "github.com/futurenda/google-auth-id-token-verifier"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Auth struct
type Auth struct {
}

// Verify function
func (a *Auth) Verify(token string, session *sess.Session) error {
	v := verifier.Verifier{}
	/*
		aud, err := configstore.GetValueFromKey("uesio.googleClientId", session)
		if err != nil {
			return err
		}*/
	aud := "326429742195-75u6chmqe4ue5lm1qg3aoa1tg070qj1e.apps.googleusercontent.com"
	return v.VerifyIDToken(token, []string{
		aud,
	})
}

// Decode function
func (a *Auth) Decode(token string, session *sess.Session) (*auth.AuthenticationClaims, error) {
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
