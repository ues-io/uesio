package http

import (
	"net/http"
)

var defaultClient *http.Client

func init() {
	defaultClient = NewLocalhostClient()
}

// Get returns an HTTP client to use for HTTP operations.
// TODO: The way that http client is created and used throughout the code
// base needs to be evaluated.  See https://github.com/ues-io/uesio/issues/4781
func Get() *http.Client {
	return defaultClient
}
