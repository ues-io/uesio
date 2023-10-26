package http

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	tlsConfig "github.com/thecloudmasters/uesio/pkg/tls"
)

var client *http.Client

func init() {
	client = buildClient()
}

// Returns an HTTP client to use for HTTP operations.
// In production, this will just return the default client,
// but for local dev / tests we need to return a client which trusts
// our self-signed TLS certificate as a Root CA so that we can
// make HTTP requests to it successfully from Go.
func Get() *http.Client {
	return client
}

func buildClient() *http.Client {
	if !tlsConfig.ServeAppWithTLS() {
		return http.DefaultClient
	}
	// Get the SystemCertPool, continue with an empty pool on error
	rootCAs, _ := x509.SystemCertPool()
	if rootCAs == nil {
		rootCAs = x509.NewCertPool()
	}
	// Read in the cert file
	wd, _ := os.Getwd()
	baseDir := wd
	// Handle path resolution issues when running tests
	if strings.Contains(wd, filepath.Join("pkg", "")) {
		baseDir = strings.Split(baseDir, "/pkg/")[0]
	}
	certFilePath := filepath.Join(baseDir, tlsConfig.GetSelfSignedCertFilePath())

	cert, err := os.ReadFile(certFilePath)
	if err != nil {
		slog.Error(fmt.Sprintf("Failed to append %q to RootCAs: %v", certFilePath, err))
		return http.DefaultClient
	}

	// Append our cert to the system pool
	if ok := rootCAs.AppendCertsFromPEM(cert); !ok {
		slog.Info("No certs appended, using system certs only")
		return http.DefaultClient
	}

	// Make a custom client which trusts the augmented cert pool
	customTransport := http.DefaultTransport.(*http.Transport).Clone()
	customTransport.TLSClientConfig = &tls.Config{
		RootCAs: rootCAs,
	}
	return &http.Client{Transport: customTransport}
}
