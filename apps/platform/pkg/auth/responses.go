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
	Token string `json:"token,omitempty"`
}

type LoginResponse struct {
	UserResponse
	RedirectPath string `json:"redirectPath,omitempty"`
}

func NewUserResponse(user *preload.UserMergeData) *UserResponse {
	return &UserResponse{
		User: user,
	}
}

func NewTokenResponse(user *preload.UserMergeData, token string) *TokenResponse {
	return &TokenResponse{
		UserResponse: UserResponse{
			User: user,
		},
		Token: token,
	}
}

func NewLoginResponse(user *preload.UserMergeData, redirectPath string) *LoginResponse {
	return &LoginResponse{
		UserResponse: UserResponse{
			User: user,
		},
		RedirectPath: redirectPath,
	}
}

func NewLoginResponseFromRoute(user *preload.UserMergeData, session *sess.Session, route *meta.Route) (*LoginResponse, error) {
	segments := getRouteUrlPrefix(route, session)
	segments = append(segments, route.Path)
	redirectPath, err := url.JoinPath("/", segments...)
	if err != nil {
		return nil, err
	}
	return NewLoginResponse(user, redirectPath), nil
}

func getRouteUrlPrefix(route *meta.Route, session *sess.Session) []string {
	namespace := route.Namespace
	workspace := session.GetWorkspace()
	// NOTE: This is generic logic but specifically referring to "auth" related routes, We "sort of" support signup/login/etc when in a workspace context
	// although it really doesn't work because of the way the views are written and they always go to /site/auth and don't contemplate a workspace scenario.
	// Currently you can only perform auth related activities when in a workspace context directly via the API.
	// TODO: This may need to be adjusted once a final decision is made on how auth related activities should work in a workspace context.
	if workspace != nil && workspace.GetAppFullName() != "" && workspace.Name != "" {
		if namespace == "" {
			namespace = workspace.GetAppFullName()
		}
		return []string{"workspace", workspace.GetAppFullName(), workspace.Name, "app", namespace}
	}

	site := session.GetSite()
	if site != nil && site.GetAppFullName() != "" {
		if namespace != "" && site.GetAppFullName() != namespace {
			return []string{"site", "app", namespace}
		}
	}

	return nil
}
