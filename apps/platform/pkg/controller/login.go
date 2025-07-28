package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"mime"
	"net/http"
	"net/url"
	"time"

	"github.com/crewjam/saml"
	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/preload"
	"github.com/thecloudmasters/uesio/pkg/routing"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func getAuthSourceID(vars map[string]string) string {
	authSourceNamespace := vars["namespace"]
	authSourceName := vars["name"]
	return authSourceNamespace + "." + authSourceName
}

func Login(w http.ResponseWriter, r *http.Request) {
	// See comments in ensurePublicSession for why we do this.
	session, err := ensurePublicSession(r.Context())
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	handleLogin(w, r, session)
}

func LoginWorkspace(w http.ResponseWriter, r *http.Request) {
	// NOTE - When this route was originally added (see https://github.com/ues-io/uesio/pull/3173/files#diff-32534e43cb95bca7a16bd38e55836771f681dc0c5a86be6672db6bcbd7745788R330),
	// according to @humandad, the thinking was to provide a way for users to preview their signup/login/etc. pages within a workspace and perform the operation
	// without impacting their current logged in session. As it stands, the appkit login that is used always navigates to /site/auth/<loginmethod> routes so other than direct API
	// usage, there is no way to get to a workspace login route currently. Most importantly, by using a "Login" process for this, the current user session would be replaced with the
	// new signed in user and the previously logged in user session removed rendering it somewhat limited in its benefit. All is to say that this route should likely utilize the
	// "impersonation" concept so that the current user stays logged in or simply "no-op" the login, signup, etc. activities when in a workspace context, although that would limit
	// the benefit of having them be "usable" in a workspace context. For now, leaving the functionality as it was prior to the introducing the "ensurePublicSession" concept for standard
	// login operations.
	session := middleware.GetSession(r)
	handleLogin(w, r, session)
}

func handleLogin(w http.ResponseWriter, r *http.Request, session *sess.Session) {
	loginRequest, err := getAuthRequest(r)
	if err != nil {
		ctlutil.HandleError(session.Context(), w, exceptions.NewBadRequestException("invalid login request body", err))
		return
	}

	conn, err := auth.GetAuthConnection(getAuthSourceID(mux.Vars(r)), nil, datasource.GetSiteAdminSession(session))
	if err != nil {
		ctlutil.HandleError(session.Context(), w, err)
		return
	}

	result, err := conn.Login(loginRequest)
	if err != nil {
		ctlutil.HandleError(session.Context(), w, err)
		return
	}

	if result.PasswordReset {
		ResetPasswordRedirectResponse(w, r, result.User, result.LoginMethod, session)
		return
	}

	LoginRedirectResponse(w, r, result.User, session)
}

func SAMLLoginRequest(w http.ResponseWriter, r *http.Request) {
	// See comments in ensurePublicSession for why we do this.
	session, err := ensurePublicSession(r.Context())
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	handleSAMLLoginRequest(w, r, session)
}

func SAMLLoginRequestWorkspace(w http.ResponseWriter, r *http.Request) {
	// NOTE - See details in comment in LoginWorkspace function. This route was added in https://github.com/ues-io/uesio/pull/3892/files#diff-32534e43cb95bca7a16bd38e55836771f681dc0c5a86be6672db6bcbd7745788)
	// but takes the same form/purpose as the LoginWorkspace route with the same shortcomings/challenges.
	session := middleware.GetSession(r)
	handleSAMLLoginRequest(w, r, session)
}

func handleSAMLLoginRequest(w http.ResponseWriter, r *http.Request, session *sess.Session) {
	conn, err := auth.GetAuthConnection(getAuthSourceID(mux.Vars(r)), nil, datasource.GetSiteAdminSession(session))
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	sp, err := conn.GetServiceProvider(r)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("failed to get service provider: %w", err))
		return
	}

	sp.HandleStartAuthFlow(w, r)
}

func SAMLLoginResponse(w http.ResponseWriter, r *http.Request) {
	// See comments in ensurePublicSession for why we do this.
	session, err := ensurePublicSession(r.Context())
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	handleSAMLLoginResponse(w, r, session)
}

func SAMLLoginResponsetWorkspace(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	handleSAMLLoginResponse(w, r, session)
}

func handleSAMLLoginResponse(w http.ResponseWriter, r *http.Request, session *sess.Session) {
	conn, err := auth.GetAuthConnection(getAuthSourceID(mux.Vars(r)), nil, datasource.GetSiteAdminSession(session))
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	sp, err := conn.GetServiceProvider(r)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("failed to get service provider: %w", err))
		return
	}

	err = r.ParseForm()
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	assertion, err := sp.ServiceProvider.ParseResponse(r, []string{})
	if err != nil {
		target := &saml.InvalidResponseError{}
		if errors.As(err, &target) {
			fmt.Println(target.PrivateErr)
		}

		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	result, err := conn.LoginServiceProvider(assertion)
	if err != nil {
		ctlutil.HandleError(session.Context(), w, err)
		return
	}

	response, err := GetLoginRedirectResponse(r, result.User, session)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	// NOTE - The previous version of this code would always ignore any `redirectPath` from GetLoginRedirectResponse
	// and always use RedirectRouteNamespace & RedirectRouteName.  Additionally, it would check if the c.session.GetContextAppName()
	// was different from the response.RedirectRouteNamespace and if so, build a redirectPath (see the git history for exact code
	// that was used). The approach taken was specifically for a prototype of samlauth and was never intended to be production ready.
	// UPDATED: The implementation of GetLoginRedirectResponse has been updated to included the equivalent logic for
	// prefixing the path similar to the way this code was written originally. Specifically, it handles both workspace context
	// and site namespace differences where the previous code here only handled site namespace difference. In short, the redirectPath
	// generation portion is consistent (and improved) from the code that was here previously including handling a "redirectPath" value
	// if there is an explicit redirect path query string parameter. All that said, if/when this code is used in future, this all should
	// be evaluated and updated to meet actual use case requirements since it was created with a focus on a POC and not production use.
	// TODO: If/When samlauth requires full production support, the entire flow needs to be reviweed, validated, adjusted and proper
	// tests written or all the samlauth related code should be removed until there is a business need for it.
	http.Redirect(w, r, response.RedirectPath, http.StatusSeeOther)
}

func CLIAuthorize(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	// IsPublicUser is the most reliable way we have currently for the equivalent of IsAuthenticated check. See comments there for more details
	if session.IsPublicUser() {
		if middleware.RedirectToLoginRoute(w, r, session, middleware.NotFound) {
			return
		}
	}
	// We only support CLI for studio currently
	if session.GetSite().GetAppFullName() != "uesio/studio" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewForbiddenException("CLI login is only supported for the uesio/studio app"))
		return
	}

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

	authCode, err := auth.GenerateAuthorizationCode()
	if err != nil {
		redirectWithError(w, r, redirectToURL, fmt.Errorf("code_generation_failed: %w", err).Error())
		return
	}

	request := &auth.AuthCodeRequest{
		CodeChallenge:   codeChallenge,
		ChallengeMethod: challengeMethod,
		UserID:          session.GetSiteUser().ID,
		ExpiresAt:       time.Now().Add(auth.AuthCodeLifetime),
		RedirectURI:     redirectToURL.String(),
	}

	err = auth.AddAuthorizationCode(authCode, request)
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

func CLIToken(w http.ResponseWriter, r *http.Request) {
	requestingSession := middleware.GetSession(r)
	// We only support CLI for studio currently
	if requestingSession.GetSite().GetAppFullName() != "uesio/studio" {
		ctlutil.HandleError(r.Context(), w, exceptions.NewForbiddenException("CLI login is only supported for the uesio/studio app"))
		return
	}

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
	authRequest, err := auth.GetAuthorizationCode(authCode)
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
		_ = auth.DelAuthorizationCode(authCode)
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

	if !auth.VerifyPKCEChallenge(authRequest.CodeChallenge, authRequest.ChallengeMethod, codeVerifier) {
		ctlutil.HandleError(r.Context(), w, exceptions.NewBadRequestException("invalid_request: invalid_code_verifier", nil))
		return
	}

	site := requestingSession.GetSite()
	user, err := auth.GetCachedUserByID(authRequest.UserID, site)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	cliSession, err := auth.ProcessLogin(r.Context(), user, site)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	auth.DelAuthorizationCode(authCode)

	response := auth.NewTokenResponse(preload.GetUserMergeData(cliSession), cliSession.GetAuthToken())
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("failed to encode response: %w", err))
		return
	}
}

func GetResetPasswordRedirectResponse(w http.ResponseWriter, r *http.Request, user *meta.User, loginMethod *meta.LoginMethod, session *sess.Session) (*auth.LoginResponse, error) {

	// TODO: This will not work in all cases and some sites do not even have appkit. The changepassword page likely needs
	// to be a defined route in site config similar to login, home, etc. However, each auth provider may have a different
	// way to achieve a "reset" and some might not even support it (e.g., google). This needs to be re-worked and a reliable
	// approach implemented that is site & auth provider agnostic.
	redirect := "/site/app/uesio/appkit/changepassword"
	username := user.Username

	code := loginMethod.VerificationCode

	redirectPath := redirect + "?code=" + code + "&username=" + username

	return auth.NewLoginResponse(preload.GetUserMergeData(session), session.GetAuthToken(), redirectPath), nil
}

func GetLoginRedirectResponse(r *http.Request, user *meta.User, session *sess.Session) (*auth.LoginResponse, error) {

	site := session.GetSite()

	session, err := auth.ProcessLogin(session.Context(), user, site)
	if err != nil {
		return nil, err
	}

	// Check for redirect parameter on the referrer
	referer, err := url.Parse(r.Referer())
	if err != nil {
		return nil, err
	}

	redirectPath := referer.Query().Get("r")
	if redirectPath != "" {
		return auth.NewLoginResponse(preload.GetUserMergeData(session), session.GetAuthToken(), redirectPath), nil
	}

	route, err := routing.GetUserHomeRoute(user, session)
	if err != nil {
		return nil, err
	}
	return auth.NewLoginResponseFromRoute(preload.GetUserMergeData(session), session, route)
}

func LoginRedirectResponse(w http.ResponseWriter, r *http.Request, user *meta.User, session *sess.Session) {

	response, err := GetLoginRedirectResponse(r, user, session)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	filejson.RespondJSON(w, r, response)
}

func ResetPasswordRedirectResponse(w http.ResponseWriter, r *http.Request, user *meta.User, loginMethod *meta.LoginMethod, session *sess.Session) {

	response, err := GetResetPasswordRedirectResponse(w, r, user, loginMethod, session)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	filejson.RespondJSON(w, r, response)
}

func getAuthRequest(r *http.Request) (auth.AuthRequest, error) {
	var loginRequest auth.AuthRequest
	err := json.NewDecoder(r.Body).Decode(&loginRequest)
	if err != nil {
		return nil, err
	}

	return loginRequest, nil
}
