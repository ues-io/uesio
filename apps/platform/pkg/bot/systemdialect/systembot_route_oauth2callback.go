package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/controller"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
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
	// TODO: PUT THIS IN OAUTH module
	stateObject, err := controller.UnmarshalState(state)
	if err != nil {
		return nil, errors.New("invalid state")
	}

	connection, err := datasource.GetPlatformConnection(nil, session, nil)
	if err != nil {
		return nil, errors.New("failed to obtain platform connection: " + err.Error())
	}

	err = controller.ExchangeAuthorizationCodeForToken(authorizationCode, stateObject.IntegrationName, session, connection)
	if err != nil {
		return nil, errors.New("failed to obtain access token from authorization code: " + err.Error())
	}

	return route, nil
}
