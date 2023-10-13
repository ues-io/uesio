package controller

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"golang.org/x/oauth2"
)

const uesioAuthCodeRedirectUrl = "/oauth2/redirect"

func OAuth2AuthorizationCodeCallback(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

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

	// TODO: Client Credentials

	conf := &oauth2.Config{
		ClientID:     clientId,
		ClientSecret: clientSecret,
		Scopes:       strings.Split(scopes, ","),
		Endpoint: oauth2.Endpoint{
			TokenURL: tokenURL,
			AuthURL:  authURL,
		},
		// TODO: figure out what URL to use here... should it be a constant, or site/app specific?
		RedirectURL: uesioAuthCodeRedirectUrl,
	}

	// Redirect user to consent page to ask for permission
	// for the scopes specified above.
	url := conf.AuthCodeURL("state", oauth2.AccessTypeOffline)
	fmt.Printf("Visit the URL for the auth dialog: %v", url)

	// Use the authorization code that is pushed to the redirect
	// URL. Exchange will do the handshake to retrieve the
	// initial access token. The HTTP Client returned by
	// conf.Client will refresh the token as necessary.
	var code string
	if _, err := fmt.Scan(&code); err != nil {
		slog.Error("unable to retrieve the code: " + err.Error())
	}
	ctx = context.WithValue(ctx, oauth2.HTTPClient, client)

	tok, err := conf.Exchange(ctx, code)
	if err != nil {
		return nil, err
	}

	// Now that we have an access token (and maybe refresh token),
	// store this into an Integration Credential record in the DB.

	// Return a View which has a custom component which does a postMessage to the opener window

}
