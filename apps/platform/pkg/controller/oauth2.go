package controller

import (
	"fmt"

	"golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	oauth "github.com/thecloudmasters/uesio/pkg/oauth2"
)

func GetOAuth2RedirectMetadata() {

	credentials := &adapt.Credentials{}
	conf, err := oauth.GetConfig(credentials)
	if err != nil {

	}
	// Redirect user to consent page to ask for permission
	// for the scopes specified above.
	url := conf.AuthCodeURL("state", oauth2.AccessTypeOffline)
	fmt.Printf("Visit the URL for the auth dialog: %v", url)
}
