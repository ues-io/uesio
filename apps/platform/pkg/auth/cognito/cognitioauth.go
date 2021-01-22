package cognito

import (
	"github.com/dgrijalva/jwt-go"
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
	// TODO: Actually verify the token
	parser := jwt.Parser{}
	tokenObj, _, err := parser.ParseUnverified(token, jwt.MapClaims{})
	if err != nil {
		return nil, err
	}
	claims := tokenObj.Claims.(jwt.MapClaims)
	return &auth.AuthenticationClaims{
		Subject:   claims["sub"].(string),
		FirstName: claims["given_name"].(string),
		LastName:  claims["family_name"].(string),
		AuthType:  "cognito",
		Email:     claims["email"].(string),
	}, nil
}
