package controller

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const uesioAuthCodeCallbackUrl = "/oauth2/callback"

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
		RedirectURL: uesioAuthCodeCallbackUrl,
	}, nil
}

type State struct {
	// random characters
	Nonce string `json:"n"`
	// integration name
	IntegrationName string `json:"i"`
}

func NewState(integrationName string) *State {
	return &State{
		uuid.New().String(),
		integrationName,
	}
}

func UnmarshalState(state string) (*State, error) {
	var s *State
	b, err := base64.StdEncoding.DecodeString(state)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(b, s)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (s *State) Marshal() (string, error) {
	b, err := json.Marshal(s)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(b), nil
}

func GetOAuth2RedirectMetadata() {

	credentials := &adapt.Credentials{}
	conf, err := GetConfig(credentials)
	if err != nil {

	}
	// Redirect user to consent page to ask for permission
	// for the scopes specified above.
	url := conf.AuthCodeURL("state", oauth2.AccessTypeOffline)
	fmt.Printf("Visit the URL for the auth dialog: %v", url)
}

func ExchangeAuthorizationCodeForToken(authCode, integrationName string, session *sess.Session, connection adapt.Connection) error {
	ctx := context.Background()

	integrationConnection, err := datasource.GetIntegration(integrationName, session)
	if err != nil {
		return err
	}
	conf, err := GetConfig(integrationConnection.GetCredentials())
	if err != nil {
		return err
	}
	userId := session.GetSiteUser().ID

	// Use the authorization code that is pushed to the redirect
	// URL. Exchange will do the handshake to retrieve the
	// initial access token.
	ctx = context.WithValue(ctx, oauth2.HTTPClient, httpClient.Get())

	tok, err := conf.Exchange(ctx, authCode)
	if err != nil {
		return errors.New("failed to exchange authorization code for access token: " + err.Error())
	}

	// Now that we have an access token (and maybe refresh token),
	// store this into an Integration Credential record in the DB.
	versionSession, err := datasource.EnterVersionContext("uesio/core", session, connection)
	if err != nil {
		return errors.New("failed to enter version context")
	}
	//var integrationCredentials *adapt.Collection
	//fetchIntegrationCredentialOp := &adapt.LoadOp{
	//	CollectionName: "uesio/core.integrationcollection",
	//	Collection:     integrationCredentials,
	//	BatchSize:      1,
	//	Fields: []adapt.LoadRequestField{
	//		{
	//			ID: "uesio/core.id",
	//		},
	//		{
	//			ID: "uesio/core.refreshtoken",
	//		},
	//	},
	//	Conditions: []adapt.LoadRequestCondition{
	//		{
	//			Field: "uesio/core.integration",
	//			Value: integrationName,
	//		},
	//		{
	//			Field: "uesio/core.user",
	//			Value: userId,
	//		},
	//	},
	//}
	//err = datasource.LoadOp(
	//	fetchIntegrationCredentialOp,
	//	connection,
	//	versionSession,
	//)
	//if err != nil {
	//	return errors.New("unable to load existing integration credentials")
	//}
	//// was there an existing record? if so , upsert?
	//var integrationCredential *adapt.Item
	//if integrationCredentials.Len() == 1 {
	//	integrationCredential = (*integrationCredentials)[0]
	//} else {
	integrationCredential := &adapt.Item{}
	integrationCredential.SetField("uesio/core.integration", integrationName)
	integrationCredential.SetField("uesio/core.user", userId)
	integrationCredential.SetField("uesio/core.accesstoken", tok.AccessToken)
	integrationCredential.SetField("uesio/core.refreshtoken", tok.RefreshToken)
	integrationCredential.SetField("uesio/core.accesstokenexpiration", tok.Expiry.Unix())

	requests := []datasource.SaveRequest{
		{
			Collection: "uesio/core.integrationcredential",
			Wire:       "integrationcreds",
			Options:    &adapt.SaveOptions{Upsert: true},
			Changes: &adapt.Collection{
				integrationCredential,
			},
		},
	}
	err = datasource.SaveWithOptions(requests, versionSession, datasource.GetConnectionSaveOptions(connection))
	if err != nil {
		return err
	}

	return nil

}
