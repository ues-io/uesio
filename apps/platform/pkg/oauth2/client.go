package oauth2

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"net/url"

	"golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

type authHeaderEventListener func(token *oauth2.Token, authHeader string)

func MakeRequestWithStoredUserCredentials(req *http.Request, integrationName string, session *sess.Session, credentials *adapt.Credentials) (*http.Response, error) {

	config, err := GetConfig(credentials, session.GetContextSite().GetHost())
	if err != nil {
		return nil, exceptions.NewUnauthorizedException(err.Error())
	}

	// Fetch OAuth credentials from the DB Integration Collection record
	// TODO: use existing metadata cache... or connection...
	connection, err := datasource.GetPlatformConnection(nil, session, nil)
	if err != nil {
		return nil, errors.New("unable to obtain platform connection")
	}
	coreSession, err := datasource.EnterVersionContext("uesio/core", session, connection)
	if err != nil {
		return nil, errors.New("failed to enter uesio/core context: " + err.Error())
	}

	integrationCredential, err := GetIntegrationCredential(
		session.GetSiteUser().ID, integrationName, coreSession, connection)
	if err != nil {
		return nil, errors.New("unable to retrieve integration credential: " + err.Error())
	}
	// If we do NOT have an existing record, then we cannot authenticate
	if integrationCredential == nil {
		return nil, exceptions.NewUnauthorizedException("user has not yet authorized this integration")
	}
	tok := GetTokenFromCredential(integrationCredential)
	accessToken := tok.AccessToken

	var finalToken *oauth2.Token

	onAuthorizationHeaderSet := func(useToken *oauth2.Token, authHeader string) {
		finalToken = useToken
	}

	httpResp, err := NewClient(config, tok, onAuthorizationHeaderSet).Do(req)

	// If the status code is unauthorized, then we need to get a new access token.
	// Retry the request without the access token, just once.
	// This shouldn't happen if the access token expiration is reliable,
	// but that's not the case for many OAuth implementations
	if err == nil && httpResp != nil && httpResp.StatusCode == http.StatusUnauthorized {
		slog.Info("GOT unauthorized response, clearing access token to force reauth...")
		tok.AccessToken = ""
		httpResp, err = NewClient(config, tok, onAuthorizationHeaderSet).Do(req)
	}

	if err == nil {
		// See if a new authorization token was generated by the exchange. If so, save this so that subsequent requests use it
		if finalToken != nil && finalToken != tok {
			if finalToken.AccessToken != accessToken {
				slog.Info("GOT new AccessToken, SAVING to DB...")
				PopulateCredentialFieldsFromToken(integrationCredential, finalToken)
				if upsertErr := UpsertIntegrationCredential(integrationCredential, coreSession, connection); upsertErr != nil {
					slog.Error("error upserting integration credential: " + upsertErr.Error())
				}
			}
		}
		return httpResp, nil
	}

	// Otherwise, we may need to reauthenticate
	switch typedErr := err.(type) {
	case *url.Error:
		switch innerErr := typedErr.Err.(type) {
		case *oauth2.RetrieveError:
			// This usually means that the refresh token is invalid, expired, or can't be obtained.
			// Delete it, or at least attempt to
			slog.Debug("Refresh token must be invalid/expired, so we are purging it...")
			if deleteErr := DeleteIntegrationCredential(integrationCredential, coreSession, connection); deleteErr != nil {
				slog.Error("unable to delete integration credential record: " + deleteErr.Error())
			}
			return nil, exceptions.NewUnauthorizedException(innerErr.Error())
		}
	}
	return nil, exceptions.NewUnauthorizedException("Authentication failed: " + err.Error())
}

// NewClient creates a custom HTTP client which performs automatic token refreshing on expiration
// while allowing for us (Uesio) to modify how the authorization header is set,
// and notify other code when the header is set to know whether a new access token / refresh token was generated
func NewClient(config *oauth2.Config, t *oauth2.Token, onAuthHeaderSet authHeaderEventListener) *http.Client {
	return &http.Client{
		Transport: &Transport{
			Source:          config.TokenSource(context.Background(), t),
			Base:            httpClient.Get().Transport,
			OnAuthHeaderSet: onAuthHeaderSet,
		},
	}
}
