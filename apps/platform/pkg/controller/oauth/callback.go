package oauth

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/controller"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	oauth "github.com/thecloudmasters/uesio/pkg/oauth2"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func Callback(w http.ResponseWriter, r *http.Request) {

	s := middleware.GetSession(r)

	authCode, state, err := extractAuthCodeAndState(r.URL.Query())
	if err != nil {
		controller.HandleErrorRoute(w, r, s, r.URL.Path, exceptions.NewBadRequestException(err.Error()), false)
		return
	}
	// If we have either workspace / site admin context embedded in the state token,
	// perform the corresponding authentication middleware
	var contextSession *sess.Session
	if state.HasWorkspaceContext() {
		contextSession, err = datasource.AddWorkspaceContextByKey(state.AppName+":"+state.WorkspaceName, s, nil)
	} else if state.HasSiteAdminContext() {
		contextSession, err = datasource.AddSiteAdminContextByKey(state.AppName+":"+state.SiteName, s, nil)
	}
	if contextSession != nil {
		s = contextSession
	} else if err != nil {
		controller.HandleErrorRoute(w, r, s, r.URL.Path, exceptions.NewForbiddenException("invalid state: insufficient privileges"), false)
		return
	}

	connection, err := datasource.GetPlatformConnection(nil, s, nil)
	if err != nil {
		controller.HandleError(w, errors.New("failed to obtain platform connection: "+err.Error()))
		return
	}
	versionSession, err := datasource.EnterVersionContext("uesio/core", s, connection)
	if err != nil {
		controller.HandleError(w, errors.New("failed to enter version context: "+err.Error()))
		return
	}
	route, err := loadCallbackRoute(r, versionSession, connection)
	if err != nil {
		controller.HandleErrorRoute(w, r, s, r.URL.Path, err, false)
		return
	}

	integrationName := state.IntegrationName
	userId := s.GetSiteUser().ID

	integrationConnection, err := datasource.GetIntegrationConnection(integrationName, s, connection)
	if err != nil {
		controller.HandleErrorRoute(w, r, s, r.URL.Path, err, false)
		return
	}

	host := fmt.Sprintf("https://%s", r.Host)
	tok, err := oauth.ExchangeAuthorizationCodeForAccessToken(integrationConnection.GetCredentials(), host, authCode, state)
	if err != nil {
		controller.HandleErrorRoute(w, r, s, r.URL.Path, err, false)
		return
	}
	// Now that we have an access token (and maybe refresh token),
	// store this into an Integration Credential record in the DB.
	if err = oauth.UpsertIntegrationCredential(oauth.BuildIntegrationCredential(integrationName, userId, tok), versionSession, connection); err != nil {
		controller.HandleErrorRoute(w, r, s, r.URL.Path, errors.New("failed to obtain access token from authorization code: "+err.Error()), false)
		return
	}

	controller.ServeRouteInternal(w, r, s, route.Path, route)
}

func loadCallbackRoute(r *http.Request, coreSession *sess.Session, platformConn wire.Connection) (*meta.Route, error) {
	route := meta.NewBaseRoute("uesio/core", "oauth2callback")
	if err := bundle.Load(route, coreSession, platformConn); err != nil {
		return nil, errors.New("unable to load oauth callback route: " + err.Error())
	}
	// Make sure to do a copy to avoid mutating in-memory/cached metadata
	cloned := &meta.Route{}
	err := meta.Copy(cloned, route)
	if err != nil {
		return nil, err
	}
	params, err := routing.ResolveRouteParams(route.Params, coreSession, r.URL.Query())
	if err != nil {
		return nil, err
	}
	cloned.Params = params
	return cloned, nil
}

func extractAuthCodeAndState(query url.Values) (authCode string, state *oauth.State, err error) {

	authCode = query.Get("code")
	stateString := query.Get("state")

	// If there's no code or state, it's an error
	if authCode == "" {
		return "", nil, extractCallbackErrorFromQuery(query, "authorization code not provided")
	}
	if stateString == "" {
		return "", nil, extractCallbackErrorFromQuery(query, "state not provided")
	}

	// Parse the state
	state, err = oauth.UnmarshalState(stateString)
	if err != nil {
		return "", nil, errors.New("invalid state")
	}
	return authCode, state, nil
}

// extract standard OAuth error fields from the query string,
// so that we can return them to the user
func extractCallbackErrorFromQuery(query url.Values, defaultMsg string) error {
	if query.Has("error") {
		if query.Has("error_description") {
			return fmt.Errorf("%s: %s", query.Get("error"), query.Get("error_description"))
		} else {
			return errors.New(query.Get("error"))
		}
	}
	return errors.New(defaultMsg)
}
