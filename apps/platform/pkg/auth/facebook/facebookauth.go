package facebook

import (
	fb "github.com/huandu/facebook/v2"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Auth struct
type Auth struct {
}

// Verify function
func (a *Auth) Verify(token string, session *sess.Session) error {
	// We verify in the Decode function since we call there the FB API.
	return nil
}

// Decode function
func (a *Auth) Decode(token string, session *sess.Session) (*auth.AuthenticationClaims, error) {

	res, err := fb.Get("/me", fb.Params{
		"fields":       "id,first_name,last_name,email",
		"access_token": token,
	})

	if err != nil {
		return nil, err
	}

	Subject := res.GetField("id").(string)
	FirstName := res.GetField("first_name").(string)
	LastName := res.GetField("last_name").(string)
	Email := res.GetField("email").(string)

	return &auth.AuthenticationClaims{
		Subject:   Subject,
		FirstName: FirstName,
		LastName:  LastName,
		AuthType:  "facebook",
		Email:     Email,
	}, nil
}
