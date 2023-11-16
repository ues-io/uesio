package oauth2

import (
	"fmt"
	"strings"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/clientcredentials"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

const uesioAuthCodeCallbackPath = "/site/oauth2/callback"

func getCoreOAuthConfigFields(credentials *adapt.Credentials) (clientId, clientSecret, tokenUrl string, scopes []string, err error) {
	clientId, err = credentials.GetRequiredEntry("clientId")
	if err != nil {
		return "", "", "", nil, err
	}
	clientSecret, err = credentials.GetRequiredEntry("clientSecret")
	if err != nil {
		return "", "", "", nil, err
	}
	tokenUrl, err = credentials.GetRequiredEntry("tokenUrl")
	if err != nil {
		return "", "", "", nil, err
	}
	scopesString := strings.TrimSpace(credentials.GetEntry("scopes", ""))
	if scopesString != "" {
		scopes = strings.Split(scopesString, ",")
		for i, v := range scopes {
			scopes[i] = strings.TrimSpace(v)
		}
	}
	return clientId, clientSecret, tokenUrl, scopes, err
}

func GetConfig(credentials *adapt.Credentials, host string) (*oauth2.Config, error) {
	clientId, clientSecret, tokenUrl, scopes, err := getCoreOAuthConfigFields(credentials)
	if err != nil {
		return nil, err
	}
	authURL := credentials.GetEntry("authorizeUrl", "")

	return &oauth2.Config{
		ClientID:     clientId,
		ClientSecret: clientSecret,
		Scopes:       scopes,
		Endpoint: oauth2.Endpoint{
			TokenURL: tokenUrl,
			AuthURL:  authURL,
		},
		RedirectURL: fmt.Sprintf("%s%s", host, uesioAuthCodeCallbackPath),
	}, nil
}

func GetClientCredentialsConfig(credentials *adapt.Credentials) (*clientcredentials.Config, error) {
	clientId, clientSecret, tokenUrl, scopes, err := getCoreOAuthConfigFields(credentials)
	if err != nil {
		return nil, err
	}
	return &clientcredentials.Config{
		ClientID:     clientId,
		ClientSecret: clientSecret,
		Scopes:       scopes,
		TokenURL:     tokenUrl,
	}, nil
}
