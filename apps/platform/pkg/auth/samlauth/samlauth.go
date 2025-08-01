package samlauth

import (
	"context"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"sync"

	"github.com/crewjam/saml"
	"github.com/crewjam/saml/samlsp"
	"github.com/thecloudmasters/uesio/pkg/auth"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	uesiotls "github.com/thecloudmasters/uesio/pkg/tls"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
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

func formatCert(cert string) string {
	s := strings.ReplaceAll(cert, "-----BEGIN CERTIFICATE----- ", "-----BEGIN CERTIFICATE-----\n")
	return strings.ReplaceAll(s, " -----END CERTIFICATE-----", "\n-----END CERTIFICATE-----\n")
}

func formatKey(cert string) string {
	s := strings.ReplaceAll(cert, "-----BEGIN PRIVATE KEY----- ", "-----BEGIN PRIVATE KEY-----\n")
	return strings.ReplaceAll(s, " -----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----\n")
}

var spCache = map[string]*samlsp.Middleware{}
var lock sync.RWMutex

func (c *Connection) getSP(ctx context.Context, requestURL string) (*samlsp.Middleware, error) {
	hash := c.credentials.GetHash()
	// Check the pool for a client
	lock.RLock()
	client, ok := spCache[hash]
	lock.RUnlock()
	if ok {
		return client, nil
	}
	pool, err := c.getSPInternal(ctx, requestURL)
	if err != nil {
		return nil, err
	}

	lock.Lock()
	defer lock.Unlock()

	spCache[hash] = pool
	return pool, nil
}

func (c *Connection) getSPInternal(ctx context.Context, requestURL string) (*samlsp.Middleware, error) {

	entityID := c.credentials.GetEntry("entityId", "")
	metadataXMLURL := c.credentials.GetEntry("metadataXmlUrl", "")
	metadataXML := c.credentials.GetEntry("metadataXml", "")

	var idpMetadata *saml.EntityDescriptor

	if metadataXML == "" {
		if metadataXMLURL == "" {
			return nil, errors.New("you must provide a metadata xml value or url value")
		}

		idpMetadataURL, err := url.Parse(metadataXMLURL)
		if err != nil {
			return nil, err
		}

		idpMetadata, err = samlsp.FetchMetadata(ctx, http.DefaultClient,
			*idpMetadataURL)
		if err != nil {
			return nil, err
		}
	} else {
		var err error
		idpMetadata, err = samlsp.ParseMetadata([]byte(metadataXML))
		if err != nil {
			return nil, err
		}
	}

	certificate, err := c.credentials.GetRequiredEntry("certificate")
	if err != nil {
		return nil, err
	}

	privateKey, err := c.credentials.GetRequiredEntry("privateKey")
	if err != nil {
		return nil, err
	}

	rootURLString := uesiotls.ServeAppDefaultScheme() + "://" + requestURL
	contextPrefix := c.session.GetContextURLPrefix()
	acsURLString := contextPrefix + "/auth/" + c.authSource.Namespace + "/" + c.authSource.Name + "/login"

	keyPair, err := tls.X509KeyPair([]byte(formatCert(certificate)), []byte(formatKey(privateKey)))
	if err != nil {
		return nil, err
	}
	keyPair.Leaf, err = x509.ParseCertificate(keyPair.Certificate[0])
	if err != nil {
		return nil, err
	}

	rootURL, err := url.Parse(rootURLString)
	if err != nil {
		return nil, err
	}

	sp, err := samlsp.New(samlsp.Options{
		EntityID:          entityID,
		URL:               *rootURL,
		Key:               keyPair.PrivateKey.(*rsa.PrivateKey),
		Certificate:       keyPair.Leaf,
		IDPMetadata:       idpMetadata,
		AllowIDPInitiated: true,
		SignRequest:       true,
	})
	if err != nil {
		return nil, err
	}
	acsURL := rootURL.ResolveReference(&url.URL{Path: acsURLString})
	sp.ServiceProvider.AcsURL = *acsURL
	return sp, nil

}

func (c *Connection) Login(ctx context.Context, loginRequest auth.AuthRequest) (*auth.LoginResult, error) {
	return nil, exceptions.NewBadRequestException("SAML login: unfortunately you cannot login", nil)
}
func (c *Connection) Signup(ctx context.Context, signupMethod *meta.SignupMethod, payload auth.AuthRequest, username string) error {
	return exceptions.NewBadRequestException("SAML login: unfortunately you cannot sign up", nil)
}
func (c *Connection) ResetPassword(ctx context.Context, payload auth.AuthRequest, authenticated bool) (*meta.LoginMethod, error) {
	return nil, exceptions.NewBadRequestException("SAML login: unfortunately you cannot change the password", nil)
}
func (c *Connection) ConfirmResetPassword(ctx context.Context, payload auth.AuthRequest) (*meta.User, error) {
	return nil, exceptions.NewBadRequestException("SAML login: unfortunately you cannot change the password", nil)
}
func (c *Connection) CreateLogin(ctx context.Context, signupMethod *meta.SignupMethod, payload auth.AuthRequest, user *meta.User) error {
	return exceptions.NewBadRequestException("SAML login: unfortunately you cannot create a login", nil)
}
func (c *Connection) ConfirmSignUp(ctx context.Context, signupMethod *meta.SignupMethod, payload auth.AuthRequest) error {
	return exceptions.NewBadRequestException("SAML login: unfortunately you cannot change the password", nil)
}
func (c *Connection) GetServiceProvider(r *http.Request) (*samlsp.Middleware, error) {
	return c.getSP(r.Context(), r.Host)
}
func (c *Connection) LoginServiceProvider(ctx context.Context, assertion *saml.Assertion) (*auth.LoginResult, error) {
	sess, err := samlsp.JWTSessionCodec{}.New(assertion)
	if err != nil {
		return nil, err
	}
	claims, ok := sess.(samlsp.JWTSessionClaims)
	if !ok {
		return nil, errors.New("invalid session type")
	}

	user, loginMethod, err := auth.GetUserFromFederationID(ctx, c.authSource.GetKey(), claims.Subject, c.connection, c.session)
	if err != nil {
		return nil, err
	}
	return &auth.LoginResult{
		AuthResult:    auth.AuthResult{User: user, LoginMethod: loginMethod},
		PasswordReset: false,
	}, nil
}
func (c *Connection) LoginCLI(ctx context.Context, loginRequest auth.AuthRequest) (*auth.LoginResult, error) {
	return nil, exceptions.NewBadRequestException("SAML login: cli login is not supported, please use browser", nil)
}
