package oauth

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

type OAuthTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
	Scopes       string `json:"scopes"`
}

// GetOAuthToken is currently just a mock oauth token server, only exposed in dev.
// Someday we could transform it into a real one, but for now it exists because
// we can't use Call Bots to simulate an access-token-returning API endpoint.
func GetOAuthToken(w http.ResponseWriter, r *http.Request) {

	if err := r.ParseForm(); err != nil {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_grant: unable to parse form data", err))
		return
	}

	if r.Form == nil {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_grant: no body provided", nil))
		return
	}
	grantType := r.Form.Get("grant_type")

	if grantType != "authorization_code" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("unsupported_grant_type: "+grantType, nil))
		return
	}
	authorizationCode := r.Form.Get("code")
	if authorizationCode == "" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_grant: code is required", nil))
		return
	}

	response := &OAuthTokenResponse{
		AccessToken:  authorizationCode + "-access-token",
		RefreshToken: authorizationCode + "-refresh-token",
		TokenType:    "Bearer",
		ExpiresIn:    3600,
		Scopes:       "openid email profile",
	}

	filejson.RespondJSON(w, r, response)

}
