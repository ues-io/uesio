package oauth2

import (
	"errors"
	"net/http"
	"strings"

	"slices"

	"golang.org/x/oauth2"
)

// Modified from original source: https://cs.opensource.google/go/x/oauth2/+/master:transport.go;l=14

// Transport is an http.RoundTripper that makes OAuth 2.0 HTTP requests,
// wrapping a base RoundTripper and adding an Authorization header
// with a token from the supplied Sources.
//
// Transport is a low-level mechanism. Most code will use the
// higher-level Config.Client method instead.
type Transport struct {
	// Source supplies the token to add to outgoing requests'
	// Authorization headers.
	Source oauth2.TokenSource

	// Base is the base RoundTripper used to make HTTP requests.
	// If nil, http.DefaultTransport is used.
	Base http.RoundTripper

	// ClientOptions
	ClientOptions *ClientOptions
}

// RoundTrip authorizes and authenticates the request with an
// access token from Transport's Source.
func (t *Transport) RoundTrip(req *http.Request) (*http.Response, error) {
	reqBodyClosed := false
	if req.Body != nil {
		defer func() {
			if !reqBodyClosed {
				req.Body.Close()
			}
		}()
	}

	if t.Source == nil {
		return nil, errors.New("oauth2: Transport's Source is nil")
	}
	token, err := t.Source.Token()
	if err != nil {
		return nil, err
	}

	req2 := cloneRequest(req) // per RoundTripper contract
	// BEGIN UESIO modifications
	t.setAuthHeader(req2, token)
	// END UESIO modifications

	// req.Body is assumed to be closed by the base RoundTripper.
	reqBodyClosed = true
	return t.base().RoundTrip(req2)
}

func (t *Transport) base() http.RoundTripper {
	if t.Base != nil {
		return t.Base
	}
	return http.DefaultTransport
}

func (t *Transport) setAuthHeader(r *http.Request, token *oauth2.Token) {
	authHeader := ""
	// Special case - if we have a token type override of "none",
	// then just inject the access token directly, no prefix.
	if t.ClientOptions != nil && t.ClientOptions.TokenTypeOverride == "none" {
		authHeader = token.AccessToken
		token.TokenType = "none"
		r.Header.Set("Authorization", authHeader)
	} else {
		// Do the default functionality of the library
		token.SetAuthHeader(r)
		if token.TokenType == "" {
			token.TokenType = strings.ToLower(token.Type())
		}
		// Just grab whatever got set by the library
		authHeader = r.Header.Get("Authorization")
	}

	// Publish the results of the operation for downstream consumption
	if t.ClientOptions != nil && t.ClientOptions.OnAuthHeaderSet != nil {
		t.ClientOptions.OnAuthHeaderSet(token, authHeader)
	}
}

// cloneRequest returns a clone of the provided *http.Request.
// The clone is a shallow copy of the struct and its Header map.
func cloneRequest(r *http.Request) *http.Request {
	// shallow copy of the struct
	r2 := new(http.Request)
	*r2 = *r
	// deep copy of the Header
	r2.Header = make(http.Header, len(r.Header))
	for k, s := range r.Header {
		r2.Header[k] = slices.Clone(s)
	}
	return r2
}
