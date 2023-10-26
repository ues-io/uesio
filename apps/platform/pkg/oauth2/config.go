package oauth2

import (
	"fmt"
	"strings"

	"golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

const uesioAuthCodeCallbackPath = "/site/oauth2/callback"

func GetConfig(credentials *adapt.Credentials, host string) (*oauth2.Config, error) {
	clientId, err := credentials.GetRequiredEntry("clientId")
	if err != nil {
		return nil, err
	}
	clientSecret, err := credentials.GetRequiredEntry("clientSecret")
	if err != nil {
		return nil, err
	}
	scopes := credentials.GetEntry("scopes", "")
	tokenURL, err := credentials.GetRequiredEntry("tokenUrl")
	if err != nil {
		return nil, err
	}
	authURL := credentials.GetEntry("authorizeUrl", "")

	scopesSlice := strings.Split(scopes, ",")
	for i, v := range scopesSlice {
		scopesSlice[i] = strings.TrimSpace(v)
	}

	return &oauth2.Config{
		ClientID:     clientId,
		ClientSecret: clientSecret,
		Scopes:       scopesSlice,
		Endpoint: oauth2.Endpoint{
			TokenURL: tokenURL,
			AuthURL:  authURL,
		},
		RedirectURL: fmt.Sprintf("%s%s", host, uesioAuthCodeCallbackPath),
	}, nil
}
