package samlauth

import (
	"context"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net/http"
	"net/url"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"

	"github.com/crewjam/saml/samlsp"
)

type Auth struct{}

func (a *Auth) GetAuthConnection(credentials *wire.Credentials, authSource *meta.AuthSource, connection wire.Connection, session *sess.Session) (auth.AuthConnection, error) {

	return &Connection{
		credentials: credentials,
		authSource:  authSource,
		connection:  connection,
		session:     session,
	}, nil
}

type Connection struct {
	credentials *wire.Credentials
	authSource  *meta.AuthSource
	connection  wire.Connection
	session     *sess.Session
}

func (c *Connection) Login(payload map[string]interface{}) (*meta.User, error) {
	fmt.Println("Gooooo")
	keyPair, err := tls.LoadX509KeyPair("myservice.cert", "myservice.key")
	if err != nil {
		panic(err) // TODO handle error
	}
	keyPair.Leaf, err = x509.ParseCertificate(keyPair.Certificate[0])
	if err != nil {
		panic(err) // TODO handle error
	}

	idpMetadataURL, err := url.Parse("https://samltest.id/saml/idp")
	if err != nil {
		panic(err) // TODO handle error
	}
	idpMetadata, err := samlsp.FetchMetadata(context.Background(), http.DefaultClient,
		*idpMetadataURL)
	if err != nil {
		panic(err) // TODO handle error
	}

	rootURL, err := url.Parse("http://localhost:8000")
	if err != nil {
		panic(err) // TODO handle error
	}

	samlSP, _ := samlsp.New(samlsp.Options{
		URL:         *rootURL,
		Key:         keyPair.PrivateKey.(*rsa.PrivateKey),
		Certificate: keyPair.Leaf,
		IDPMetadata: idpMetadata,
	})

	fmt.Println(samlSP)

	return auth.GetUserFromFederationID(c.authSource.GetKey(), "Subject", c.session)
}

func (c *Connection) Signup(signupMethod *meta.SignupMethod, payload map[string]interface{}, username string) error {

	user, err := auth.CreateUser(signupMethod, &meta.User{
		Username:  username,
		FirstName: "FNAME",
		LastName:  "LNAME",
		Email:     "EMAIL",
	}, c.connection, c.session)
	if err != nil {
		return err
	}
	return auth.CreateLoginMethod(&meta.LoginMethod{
		FederationID: "FED_ID",
		User:         user,
		AuthSource:   signupMethod.AuthSource,
	}, c.connection, c.session)
}
func (c *Connection) ForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return exceptions.NewBadRequestException("SAML login: unfortunately you cannot change the password")
}
func (c *Connection) ConfirmForgotPassword(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return exceptions.NewBadRequestException("SAML login: unfortunately you cannot change the password")
}
func (c *Connection) CreateLogin(signupMethod *meta.SignupMethod, payload map[string]interface{}, user *meta.User) error {
	return exceptions.NewBadRequestException("SAML login: unfortunately you cannot create a login")
}
func (c *Connection) ConfirmSignUp(signupMethod *meta.SignupMethod, payload map[string]interface{}) error {
	return exceptions.NewBadRequestException("SAML login: unfortunately you cannot change the password")
}
