package auth

import (
	"net/url"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/preload"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type UserResponse struct {
	// TODO: The CLI uses a subset of the properties in these types but we currently return the full User type payload. This
	// should be refactored to have a "base" and "full" version and only use the "full" version where needed to
	// improve performance, reduce payload size and not expose information that isn't needed to the respective client.
	// Also, the AuthCheck API uses this type and it's unlikely that any use of AuthCheck API would neeed all the data so this
	// too should be refactored.
	User *preload.UserMergeData `json:"user"`
}

type TokenResponse struct {
	UserResponse
	SessionID string `json:"sessionId"`
}

type LoginResponse struct {
	TokenResponse
	RedirectPath string `json:"redirectPath,omitempty"`
}

func NewUserResponse(user *preload.UserMergeData) *UserResponse {
	return &UserResponse{
		User: user,
	}
}

func NewTokenResponse(user *preload.UserMergeData, sessionID string) *TokenResponse {
	return &TokenResponse{
		UserResponse: UserResponse{
			User: user,
		},
		SessionID: sessionID,
	}
}

func NewLoginResponse(user *preload.UserMergeData, sessionID string, redirectPath string) *LoginResponse {
	return &LoginResponse{
		TokenResponse: TokenResponse{
			UserResponse: UserResponse{
				User: user,
			},
			SessionID: sessionID,
		},
		RedirectPath: redirectPath,
	}
}

// sessionID will be included in the response, session is used to evaluate the final redirect path
func NewLoginResponseFromRoute(user *preload.UserMergeData, sessionID string, session *sess.Session, route *meta.Route) (*LoginResponse, error) {
	segments := getRouteUrlPrefix(route, session)
	segments = append(segments, route.Path)
	redirectPath, err := url.JoinPath("/", segments...)
	if err != nil {
		return nil, err
	}
	return NewLoginResponse(user, sessionID, redirectPath), nil
}

// TODO: This approach mirrors what is done in navigateToRoute (operations.ts) which the previous code that redirected
// to the route on login used to use prior to always returning redirectPath instead of routeNamespace/routeName. However,
// in other areas of the code (e.g., https://github.com/ues-io/uesio/blob/8c7f8f20abbdaaa3b123a1fb3ce2211d545bc81b/apps/platform/pkg/auth/login.go#L157)
// we use session.GetContextAppName() to compare namspaces. GetContextAppName() gets the site in context vs.
// the base site which the code in navigateToRoute uses. Not sure if the client side code has an issue and it should
// be using the site in context or if the code at https://github.com/ues-io/uesio/blob/8c7f8f20abbdaaa3b123a1fb3ce2211d545bc81b/apps/platform/pkg/auth/login.go#L157
// is wrong and it should be using the base site instead - or possibly they are both right or I'm just misunderstanding.
// For now, mimicking what used to happen (at least I think this does) client side until this can be reviewed with @humandad.
func getRouteUrlPrefix(route *meta.Route, session *sess.Session) []string {
	namespace := route.Namespace
	workspace := session.GetWorkspace()
	// TODO: We "sort of" support logging in in a workspace context although it really doesn't work because of the way
	// the views are written and they always go to /site/auth and don't contemplate a workspace scenario. That said,
	// the below code exists in navigateToRoute but doesn't work properly to derive the redirectPath after login when
	// logging in within a workspace context. This needs to be evaluated for both client side and server side although
	// for client side, we derive redirectPath on server only.
	if workspace != nil && workspace.GetAppFullName() != "" && workspace.Name != "" {
		if namespace == "" {
			namespace = workspace.GetAppFullName()
		}
		return []string{"workspace", workspace.GetAppFullName(), workspace.Name, "app", namespace}
	}

	// TODO: See note above regarding wether this should be as-is or if it should use GetContextAppName.
	// The code in navigateToRoute would use "site" from merge data which is the base site, not the site
	// in context (https://github.com/ues-io/uesio/blob/8c7f8f20abbdaaa3b123a1fb3ce2211d545bc81b/apps/platform/pkg/controller/mergedata.go#L261)
	site := session.GetSite()
	if site != nil && site.GetAppFullName() != "" {
		if namespace != "" && site.GetAppFullName() != namespace {
			return []string{"site", "app", namespace}
		}
	}

	return nil
}
