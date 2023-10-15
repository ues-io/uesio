package oauth2

import (
	"strings"

	"golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

const UesioAuthCodeCallbackUrl = "/oauth2/callback"

func GetConfig(credentials *adapt.Credentials) (*oauth2.Config, error) {
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

	return &oauth2.Config{
		ClientID:     clientId,
		ClientSecret: clientSecret,
		Scopes:       strings.Split(scopes, ","),
		Endpoint: oauth2.Endpoint{
			TokenURL: tokenURL,
			AuthURL:  authURL,
		},
		RedirectURL: UesioAuthCodeCallbackUrl,
	}, nil
}
