package samlauth

import (
	"context"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"net/http"
	"net/url"
	"strings"
	"sync"

	"github.com/crewjam/saml/samlsp"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var spCache = map[string]*samlsp.Middleware{}
var lock sync.RWMutex

func getSP(requestURL string, authSource *meta.AuthSource, credentials *wire.Credentials) (*samlsp.Middleware, error) {
	hash := credentials.GetHash()
	// Check the pool for a client
	lock.RLock()
	client, ok := spCache[hash]
	lock.RUnlock()
	if ok {
		return client, nil
	}
	pool, err := getSPInternal(requestURL, authSource, credentials)
	if err != nil {
		return nil, err
	}

	lock.Lock()
	defer lock.Unlock()

	spCache[hash] = pool
	return pool, nil
}

func formatCert(cert string) string {
	s := strings.ReplaceAll(cert, "-----BEGIN CERTIFICATE----- ", "-----BEGIN CERTIFICATE-----\n")
	return strings.ReplaceAll(s, " -----END CERTIFICATE-----", "\n-----END CERTIFICATE-----\n")
}

func formatKey(cert string) string {
	s := strings.ReplaceAll(cert, "-----BEGIN PRIVATE KEY----- ", "-----BEGIN PRIVATE KEY-----\n")
	return strings.ReplaceAll(s, " -----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----\n")
}

func getSPInternal(requestURL string, authSource *meta.AuthSource, credentials *wire.Credentials) (*samlsp.Middleware, error) {

	metadataURL, err := credentials.GetRequiredEntry("metadataUrl")
	if err != nil {
		return nil, err
	}

	certificate, err := credentials.GetRequiredEntry("certificate")
	if err != nil {
		return nil, err
	}

	privateKey, err := credentials.GetRequiredEntry("privateKey")
	if err != nil {
		return nil, err
	}

	rootURLString := "https://" + requestURL
	acsURLString := "site/auth/" + authSource.Namespace + "/" + authSource.Name + "/login"

	keyPair, err := tls.X509KeyPair([]byte(formatCert(certificate)), []byte(formatKey(privateKey)))
	if err != nil {
		return nil, err
	}
	keyPair.Leaf, err = x509.ParseCertificate(keyPair.Certificate[0])
	if err != nil {
		return nil, err
	}

	idpMetadataURL, err := url.Parse(metadataURL)
	if err != nil {
		return nil, err
	}
	idpMetadata, err := samlsp.FetchMetadata(context.Background(), http.DefaultClient,
		*idpMetadataURL)
	if err != nil {
		return nil, err
	}

	rootURL, err := url.Parse(rootURLString)
	if err != nil {
		return nil, err
	}

	sp, err := samlsp.New(samlsp.Options{
		URL:               *rootURL,
		Key:               keyPair.PrivateKey.(*rsa.PrivateKey),
		Certificate:       keyPair.Leaf,
		IDPMetadata:       idpMetadata,
		AllowIDPInitiated: true,
	})
	if err != nil {
		return nil, err
	}
	acsURL := rootURL.ResolveReference(&url.URL{Path: acsURLString})
	sp.ServiceProvider.AcsURL = *acsURL
	return sp, nil

}
