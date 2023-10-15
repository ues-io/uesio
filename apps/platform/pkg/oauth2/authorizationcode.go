package oauth2

import (
	"context"
	"errors"

	"golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
)

// ExchangeAuthorizationCodeForAccessToken takes an authorization code that is pushed to the redirect URL
// and exchanges it for an access token.
func ExchangeAuthorizationCodeForAccessToken(credentials *adapt.Credentials, userId string, code string) (*oauth2.Token, error) {
	conf, err := GetConfig(credentials)
	if err != nil {
		return nil, err
	}
	ctx := context.WithValue(context.Background(), oauth2.HTTPClient, httpClient.Get())
	tok, err := conf.Exchange(ctx, code)
	if err != nil {
		return nil, errors.New("failed to exchange authorization code for access token: " + err.Error())
	}
	return tok, nil
}
