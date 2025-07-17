package auth

import (
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func CLIAuthorize(w http.ResponseWriter, r *http.Request, session *sess.Session) {
	reqQuery := r.URL.Query()
	challengeMethod := reqQuery.Get("code_challenge_method")
	codeChallenge := reqQuery.Get("code_challenge")
	redirectURI := reqQuery.Get("redirect_uri")
	state := reqQuery.Get("state")

	if challengeMethod != "S256" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("unsupported_challenge_method", nil))
		return
	}

	if codeChallenge == "" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("missing_code_challenge", nil))
		return
	}

	if redirectURI == "" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("missing_redirect_uri", nil))
		return
	}
	redirectToURL, err := r.URL.Parse(redirectURI)
	if err != nil || redirectToURL.Scheme == "" || redirectToURL.Hostname() != "localhost" || redirectToURL.User != nil || len(redirectToURL.Query()) > 0 || redirectToURL.Fragment != "" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_redirect_uri", nil))
		return
	}

	if state == "" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("missing_state", nil))
		return
	}

	authCode, err := GenerateAuthorizationCode()
	if err != nil {
		redirectWithError(w, r, redirectToURL, fmt.Errorf("code_generation_failed: %w", err).Error())
		return
	}

	request := &authCodeRequest{
		CodeChallenge:   codeChallenge,
		ChallengeMethod: challengeMethod,
		UserID:          session.GetSiteUser().ID,
		ExpiresAt:       time.Now().Add(AuthCodeLifetime),
		RedirectURI:     redirectToURL.String(),
	}

	err = AddAuthorizationCode(authCode, request)
	if err != nil {
		redirectWithError(w, r, redirectToURL, fmt.Errorf("auth_code_storage_failed: %w", err).Error())
		return
	}

	qry := url.Values{}
	qry.Set("code", authCode)
	qry.Set("state", state)
	redirectToURL.RawQuery = qry.Encode()
	http.Redirect(w, r, redirectToURL.String(), http.StatusTemporaryRedirect)
}

func redirectWithError(w http.ResponseWriter, r *http.Request, redirectURL *url.URL, errMessage string) {
	qry := url.Values{}
	qry.Set("error", errMessage)
	redirectURL.RawQuery = qry.Encode()
	http.Redirect(w, r, redirectURL.String(), http.StatusInternalServerError)
}
