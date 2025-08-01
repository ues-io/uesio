package oauth

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/controller"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	oauth "github.com/thecloudmasters/uesio/pkg/oauth2"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/tls"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func Callback(w http.ResponseWriter, r *http.Request) {

	s := middleware.GetSession(r)

	authCode, state, err := extractAuthCodeAndState(r.URL.Query())
	if err != nil {
		controller.HandleErrorRoute(w, r, s, r.URL.Path, "", exceptions.NewBadRequestException("", err), false)
		return
	}
	// If we have either workspace / site admin context embedded in the state token,
	// perform the corresponding authentication middleware
	var contextSession *sess.Session
	if state.HasWorkspaceContext() {
		contextSession, err = datasource.AddWorkspaceContextByKey(r.Context(), state.AppName+":"+state.WorkspaceName, s, nil)
	} else if state.HasSiteAdminContext() {
		contextSession, err = datasource.AddSiteAdminContextByKey(r.Context(), state.AppName+":"+state.SiteName, s, nil)
	}
	if contextSession != nil {
		s = contextSession
	} else if err != nil {
		controller.HandleErrorRoute(w, r, s, r.URL.Path, "", exceptions.NewForbiddenException("invalid state: insufficient privileges"), false)
		return
	}

	connection, err := datasource.GetPlatformConnection(r.Context(), s, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("failed to obtain platform connection: %w", err))
		return
	}
	versionSession, err := datasource.EnterVersionContext(r.Context(), "uesio/core", s, connection)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("failed to enter version context: %w", err))
		return
	}
	route, err := loadCallbackRoute(r, versionSession, connection)
	if err != nil {
		controller.HandleErrorRoute(w, r, s, r.URL.Path, "", err, false)
		return
	}

	integrationName := state.IntegrationName
	userId := s.GetSiteUser().ID

	integrationConnection, err := datasource.GetIntegrationConnection(r.Context(), integrationName, s, connection)
	if err != nil {
		controller.HandleErrorRoute(w, r, s, r.URL.Path, "", err, false)
		return
	}

	host := fmt.Sprintf("%s://%s", tls.ServeAppDefaultScheme(), r.Host)
	tok, err := oauth.ExchangeAuthorizationCodeForAccessToken(r.Context(), integrationConnection.GetCredentials(), host, authCode, state)
	if err != nil {
		controller.HandleErrorRoute(w, r, s, r.URL.Path, "", err, false)
		return
	}
	// Now that we have an access token (and maybe refresh token),
	// store this into an Integration Credential record in the DB.
	if err = oauth.UpsertIntegrationCredential(r.Context(), oauth.BuildIntegrationCredential(integrationName, userId, tok), versionSession, connection); err != nil {
		controller.HandleErrorRoute(w, r, s, r.URL.Path, "", fmt.Errorf("failed to obtain access token from authorization code: %w", err), false)
		return
	}

	controller.ServeRouteInternal(w, r, s, route.Path, route)
}

func loadCallbackRoute(r *http.Request, coreSession *sess.Session, platformConn wire.Connection) (*meta.Route, error) {
	route := meta.NewBaseRoute("uesio/core", "oauth2callback")
	if err := bundle.Load(r.Context(), route, nil, coreSession, platformConn); err != nil {
		return nil, fmt.Errorf("unable to load oauth callback route: %w", err)
	}
	// Make sure to do a copy to avoid mutating in-memory/cached metadata
	cloned := route.Copy()
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
