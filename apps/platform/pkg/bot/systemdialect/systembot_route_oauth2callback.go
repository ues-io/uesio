package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/controller"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/oauth2"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runOAuth2CallbackRouteBot(route *meta.Route, session *sess.Session) (*meta.Route, error) {

	authorizationCode := route.Params["code"]
	state := route.Params["state"]

	// If there's no code or state, it's an error
	if authorizationCode == "" {
		return controller.GetErrorRoute(route.Path, "authorization code not provided"), nil
	}
	if state == "" {
		return controller.GetErrorRoute(route.Path, "state not provided"), nil
	}

	// Parse the state
	stateObject, err := oauth2.UnmarshalState(state)
	if err != nil {
		return nil, errors.New("invalid state")
	}

	integrationName := stateObject.IntegrationName
	userId := session.GetSiteUser().ID

	integrationConnection, err := datasource.GetIntegration(integrationName, session)
	if err != nil {
		return nil, err
	}

	tok, err := oauth2.ExchangeAuthorizationCodeForAccessToken(integrationConnection.GetCredentials(), userId, authorizationCode)
	if err != nil {
		return nil, err
	}
	// Now that we have an access token (and maybe refresh token),
	// store this into an Integration Credential record in the DB.
	if err = upsertIntegrationCredential(oauth2.BuildIntegrationCredential(integrationName, userId, tok), session); err != nil {
		return nil, errors.New("failed to obtain access token from authorization code: " + err.Error())
	}

	return route, nil
}

func upsertIntegrationCredential(integrationCredential *adapt.Item, session *sess.Session) error {

	connection, err := datasource.GetPlatformConnection(nil, session, nil)
	if err != nil {
		return errors.New("failed to obtain platform connection: " + err.Error())
	}

	versionSession, err := datasource.EnterVersionContext("uesio/core", session, connection)
	if err != nil {
		return errors.New("failed to enter version context")
	}

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
	if err = datasource.SaveWithOptions(requests, versionSession, datasource.GetConnectionSaveOptions(connection)); err != nil {
		return err
	}
	return nil
}

//func getIntegrationCredential() {
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
//}
