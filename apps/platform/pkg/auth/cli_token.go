package auth

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"mime"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/preload"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func CLIToken(w http.ResponseWriter, r *http.Request, requestingSession *sess.Session) {
	// NOTE: intentionally using generic error messages for general failures

	// token requests should be application/x-www-form-urlencoded per https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3
	contentType := r.Header.Get("Content-Type")
	if contentType == "" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_request: content_type", nil))
		return
	}

	// Parse media type to handle charset parameters like "application/x-www-form-urlencoded; charset=utf-8"
	mediaType, _, err := mime.ParseMediaType(contentType)
	if err != nil || mediaType != "application/x-www-form-urlencoded" {
		if err != nil {
			slog.ErrorContext(r.Context(), fmt.Sprintf("expected mediaType application/x-www-form-urlencoded got %s", mediaType))
		}
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_request: media_type", nil))
		return
	}

	err = r.ParseForm()
	if err != nil {
		slog.ErrorContext(r.Context(), "failed to parse form data", "error", err)
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_request: form_parsing", nil))
		return
	}

	authCode := r.FormValue("code")
	if authCode == "" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_request: missing_code", nil))
		return
	}
	authRequest, err := GetAuthorizationCode(authCode)
	if err != nil {
		if !errors.Is(err, cache.ErrKeyNotFound) {
			slog.ErrorContext(r.Context(), "failed to get authorization code", "error", err)
		}
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_request: invalid_code", nil))
		return
	}
	// auth codes are single use regardless of outcome
	defer func() {
		// nothing we can do if error occurs here
		_ = DelAuthorizationCode(authCode)
	}()

	// CLI does not have a session when exchanging so this should always be public
	if !requestingSession.IsPublicUser() {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_request: invalid_user", nil))
		return
	}

	codeVerifier := r.FormValue("code_verifier")
	if codeVerifier == "" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_request: missing_code_verifier", nil))
		return
	}

	redirectURI := r.FormValue("redirect_uri")
	if redirectURI == "" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_request: missing_redirect_uri", nil))
		return
	}

	if authRequest.RedirectURI != redirectURI {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_request: invalid_redirect_uri", nil))
		return
	}

	if !VerifyPKCEChallenge(authRequest.CodeChallenge, authRequest.ChallengeMethod, codeVerifier) {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_request: invalid_code_verifier", nil))
		return
	}

	site := requestingSession.GetSite()
	user, err := GetCachedUserByID(authRequest.UserID, site)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	cliSession, err := ProcessLogin(r.Context(), user, site)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	DelAuthorizationCode(authCode)

	response := NewTokenResponse(preload.GetUserMergeData(cliSession), cliSession.GetAuthToken())
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("failed to encode response: %w", err))
		return
	}
}
