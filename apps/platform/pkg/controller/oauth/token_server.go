package oauth

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/file"
)

type OAuthTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int64  `json:"expires_in"`
	Scopes      string `json:"scopes"`
}

// GetOAuthToken is currently just a mock oauth token server, only exposed in dev.
// Someday we could transform it into a real one, but for now it exists because
// we can't use Call Bots to simulate an access-token-returning API endpoint.
func GetOAuthToken(w http.ResponseWriter, r *http.Request) {

	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid_grant: unable to parse form data", http.StatusBadRequest)
		return
	}

	if r.Form == nil {
		http.Error(w, "invalid_grant: no body provided", http.StatusBadRequest)
		return
	}
	grantType := r.Form.Get("grant_type")

	if grantType != "authorization_code" {
		http.Error(w, "unsupported_grant_type: ", http.StatusBadRequest)
		return
	}
	authorizationCode := r.Form.Get("code")
	if authorizationCode == "" {
		http.Error(w, "invalid_grant: code is required", http.StatusBadRequest)
		return
	}

	response := &OAuthTokenResponse{
		AccessToken: authorizationCode + "-access-token",
		TokenType:   "Bearer",
		ExpiresIn:   3600,
		Scopes:      "openid email profile",
	}

	file.RespondJSON(w, r, response)

}
