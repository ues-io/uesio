package google

import (
	"errors"

	verifier "github.com/futurenda/google-auth-id-token-verifier"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/configstore"
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
		return nil, errors.New("Google login:" + err.Error())
	}
	v := verifier.Verifier{}

	aud, err := configstore.GetValueFromKey("uesio.google_client_id", session)
	if err != nil {
		return nil, err
	}

	err = v.VerifyIDToken(token, []string{
		aud,
	})
	if err != nil {
		return nil, err
	}

	claimSet, err := verifier.Decode(token)
	if err != nil {
		return nil, err
	}

	return &auth.AuthenticationClaims{
		Subject:   claimSet.Sub,
		FirstName: claimSet.GivenName,
		LastName:  claimSet.FamilyName,
		Email:     claimSet.Email,
	}, nil

}

func (c *Connection) Signup(payload map[string]interface{}, username string, session *sess.Session) (*auth.AuthenticationClaims, error) {
	return nil, nil
}

func (c *Connection) ForgotPassword(payload map[string]interface{}, session *sess.Session) error {
	return errors.New("Google login: unfortunately you cannot change the password")
}

func (c *Connection) ConfirmForgotPassword(payload map[string]interface{}, session *sess.Session) error {
	return errors.New("Google login: unfortunately you cannot change the password")
}

func (c *Connection) CreateLogin(payload map[string]interface{}, username string, session *sess.Session) (*auth.AuthenticationClaims, error) {
	return nil, nil
}
