package oauth2

import (
	"context"
	"errors"
	"time"

	"golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/cache"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var oauthExchangeCache cache.Cache[string]

func init() {
	resetCacheImpl()
}

// used by tests to use an alternative cache implementation
func setCacheImpl(cacheImpl cache.Cache[string]) {
	oauthExchangeCache = cacheImpl
}

func resetCacheImpl() {
	// This Redis cache can have a very short expiration, to prevent replay attacks,
	// but should be long enough to allow for 2FA exchanges initiated by the auth server
	oauthExchangeCache = cache.NewPlatformCache[string]("oauthExchange", time.Minute*5)
}

type RedirectMetadata struct {
	AuthURL string `json:"authUrl"`
	State   string `json:"state"`
}

// ExchangeAuthorizationCodeForAccessToken takes an authorization code that is pushed to the redirect URL
// and exchanges it for an access token.
func ExchangeAuthorizationCodeForAccessToken(ctx context.Context, credentials *wire.Credentials, host, code string, state *State) (*oauth2.Token, error) {
	conf, err := GetConfig(credentials, host)
	if err != nil {
		return nil, err
	}
	newCtx := context.WithValue(ctx, oauth2.HTTPClient, httpClient.Get())

	// Make sure that this is a valid exchange we initiated, and extract the PKCE identifier
	verifier, err := oauthExchangeCache.Get(state.Nonce)
	if err != nil {
		return nil, errors.New("invalid oauth state parameter")
	}
	tok, err := conf.Exchange(newCtx, code, oauth2.VerifierOption(verifier))
	if err != nil {
		return nil, errors.New("failed to exchange authorization code for access token: " + err.Error())
	}
	// Now that the exchange succeeded, prevent replay attacks
	oauthExchangeCache.Del(state.Nonce)
	// Override the token type, if necessary
	if tokenTypeOverride := credentials.GetEntry("tokenType", ""); tokenTypeOverride != "" {
		tok.TokenType = tokenTypeOverride
	}
	return tok, nil
}

func GetRedirectMetadata(conf *oauth2.Config, integrationName string, s *sess.Session) (*RedirectMetadata, error) {

	// Generate a state token, with workspace/site admin context as necessary, and serialize it
	stateObject := NewState(integrationName).WithContext(s)
	stateString, err := stateObject.Marshal()
	if err != nil {
		return nil, errors.New("unable to generate an OAuth state token: " + err.Error())
	}

	// Generate the fully-qualified authorization code URL
	verifier := oauth2.GenerateVerifier()
	url := conf.AuthCodeURL(stateString, oauth2.AccessTypeOffline, oauth2.S256ChallengeOption(verifier))

	// Store the verifier in Redis, associated with the state nonce,
	// so that we can use it to exchange the access token
	if err = oauthExchangeCache.Set(stateObject.Nonce, verifier); err != nil {
		return nil, errors.New("unable to store oauth exchange state in Redis: " + err.Error())
	}

	return &RedirectMetadata{
		AuthURL: url,
		State:   stateString,
	}, nil
}
