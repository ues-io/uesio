package oauth2

import (
	"errors"
	"strings"
	"time"

	"golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

const (
	IntegrationCredentialCollection = "uesio/core.integrationcredential"
	AccessTokenField                = "uesio/core.accesstoken"
	TokenTypeField                  = "uesio/core.tokentype"
	RefreshTokenField               = "uesio/core.refreshtoken"
	IntegrationField                = "uesio/core.integration"
	UserField                       = "uesio/core.user"
	AccessTokenExpirationField      = "uesio/core.accesstokenexpiration"
)

func GetTokenFromCredential(credential *wire.Item) *oauth2.Token {
	accessToken, _ := credential.GetFieldAsString(AccessTokenField)
	refreshToken, _ := credential.GetFieldAsString(RefreshTokenField)
	tokenType, _ := credential.GetFieldAsString(TokenTypeField)
	accessTokenExpiry, _ := credential.GetField(AccessTokenExpirationField)
	// Default expiry to the "nil" time, which is treated as non-expiring
	expiry := time.Time{}
	if accessTokenExpiry != nil {
		if typedVal, isValid := accessTokenExpiry.(float64); isValid && typedVal > 0 {
			expiry = time.Unix(int64(typedVal), 0)
		}
	}
	return &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		Expiry:       expiry,
		TokenType:    tokenType,
	}
}

// PopulateCredentialFieldsFromToken populates access token, refresh token, and access token expiration fields
// on an integration_credential record using the corresponding fields from the token
func PopulateCredentialFieldsFromToken(credential *wire.Item, token *oauth2.Token) {
	credential.SetField(AccessTokenField, token.AccessToken)
	if token.RefreshToken != "" {
		credential.SetField(RefreshTokenField, token.RefreshToken)
	}
	credential.SetField(TokenTypeField, ResolveTokenType(token))
	expiry := token.Expiry
	if !expiry.IsZero() {
		credential.SetField(AccessTokenExpirationField, expiry.Unix())
	} else {
		credential.SetField(AccessTokenExpirationField, nil)
	}

}

func ResolveTokenType(token *oauth2.Token) string {
	// Exception case --- "none" is not supported by the Go oauth2 library,
	// so we have to manually handle this
	if token.TokenType == "none" {
		return token.TokenType
	}
	tokenType := strings.ToLower(token.Type())
	if tokenType == "" {
		return "bearer"
	}
	return tokenType
}

func BuildIntegrationCredential(integrationName string, userId string, token *oauth2.Token) *wire.Item {
	integrationCredential := &wire.Item{}
	userReference := &wire.Item{}
	userReference.SetField(commonfields.Id, userId)
	integrationCredential.SetField(IntegrationField, integrationName)
	integrationCredential.SetField(UserField, userReference)
	if token != nil {
		PopulateCredentialFieldsFromToken(integrationCredential, token)
	}
	return integrationCredential
}

// UpsertIntegrationCredential performs an upsert on the provided integration credential item
func UpsertIntegrationCredential(integrationCredential *wire.Item, coreSession *sess.Session, platformConn wire.Connection) error {
	integrationCredential.SetField(commonfields.UpdatedAt, time.Now().Unix())
	requests := []datasource.SaveRequest{
		{
			Collection: IntegrationCredentialCollection,
			Wire:       "upsertIntegrationCredential",
			Options:    &wire.SaveOptions{Upsert: true},
			Changes: &wire.Collection{
				integrationCredential,
			},
			Params: datasource.GetParamsFromSession(coreSession),
		},
	}
	return datasource.SaveWithOptions(requests, coreSession, datasource.NewSaveOptions(platformConn, nil))

}

// DeleteIntegrationCredential deletes a provided integration credential
func DeleteIntegrationCredential(integrationCredential *wire.Item, coreSession *sess.Session, platformConn wire.Connection) error {
	requests := []datasource.SaveRequest{
		{
			Collection: IntegrationCredentialCollection,
			Wire:       "deleteIntegrationCredential",
			Options:    &wire.SaveOptions{},
			Deletes: &wire.Collection{
				integrationCredential,
			},
			Params: datasource.GetParamsFromSession(coreSession),
		},
	}
	return datasource.SaveWithOptions(requests, coreSession, datasource.NewSaveOptions(platformConn, nil))

}

// GetIntegrationCredential retrieves any existing integration credential record for the provided user / integration
func GetIntegrationCredential(
	userId, integrationName string, coreSession *sess.Session, connection wire.Connection,
) (*wire.Item, error) {
	integrationCredentials := &wire.Collection{}
	fetchIntegrationCredentialOp := &wire.LoadOp{
		Params:         datasource.GetParamsFromSession(coreSession),
		CollectionName: IntegrationCredentialCollection,
		Collection:     integrationCredentials,
		BatchSize:      1,
		Query:          true,
		Fields: []wire.LoadRequestField{
			{
				ID: commonfields.Id,
			},
			{
				ID: AccessTokenField,
			},
			{
				ID: AccessTokenExpirationField,
			},
			{
				ID: RefreshTokenField,
			},
			{
				ID: TokenTypeField,
			},
		},
		Conditions: []wire.LoadRequestCondition{
			{
				Field: IntegrationField,
				Value: integrationName,
			},
			{
				Field: UserField,
				Value: userId,
			},
		},
	}
	if _, err := datasource.Load(
		[]*wire.LoadOp{fetchIntegrationCredentialOp},
		coreSession,
		&datasource.LoadOptions{
			Connection: connection,
		},
	); err != nil {
		return nil, errors.New("unable to load existing integration credentials: " + err.Error())
	}
	// Return the record we found, if any
	if integrationCredentials.Len() == 0 {
		return nil, nil
	}
	return integrationCredentials.First(), nil
}
