package oauth2

import (
	"errors"
	"time"

	"golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const (
	IntegrationCredentialCollection = "uesio/core.integrationcredential"
	AccessTokenField                = "uesio/core.accesstoken"
	RefreshTokenField               = "uesio/core.refreshtoken"
	IntegrationField                = "uesio/core.integration"
	UserField                       = "uesio/core.user"
	AccessTokenExpirationField      = "uesio/core.accesstokenexpiration"
)

func BuildIntegrationCredential(integrationName string, userId string, tok *oauth2.Token) *adapt.Item {
	integrationCredential := &adapt.Item{}
	userReference := &adapt.Item{}
	userReference.SetField(adapt.ID_FIELD, userId)
	integrationCredential.SetField(IntegrationField, integrationName)
	integrationCredential.SetField(UserField, userReference)
	integrationCredential.SetField(AccessTokenField, tok.AccessToken)
	integrationCredential.SetField(RefreshTokenField, tok.RefreshToken)
	expiry := tok.Expiry
	if expiry.IsZero() {
		// Use default expiry of 1 hour
		expiry = time.Now().Add(time.Hour)
	}
	integrationCredential.SetField(AccessTokenExpirationField, expiry.Unix())
	return integrationCredential
}

// UpsertIntegrationCredential performs an upsert on the provided integration credential item
func UpsertIntegrationCredential(integrationCredential *adapt.Item, coreSession *sess.Session, platformConn adapt.Connection) error {
	requests := []datasource.SaveRequest{
		{
			Collection: IntegrationCredentialCollection,
			Wire:       "integrationcreds",
			Options:    &adapt.SaveOptions{Upsert: true},
			Changes: &adapt.Collection{
				integrationCredential,
			},
			Params: datasource.GetParamsFromSession(coreSession),
		},
	}
	if err := datasource.SaveWithOptions(requests, coreSession, datasource.GetConnectionSaveOptions(platformConn)); err != nil {
		return err
	}
	return nil
}

// DeleteIntegrationCredential deletes a provided integration credential
func DeleteIntegrationCredential(integrationCredential *adapt.Item, coreSession *sess.Session, platformConn adapt.Connection) error {
	requests := []datasource.SaveRequest{
		{
			Collection: IntegrationCredentialCollection,
			Wire:       "integrationcreds",
			Options:    &adapt.SaveOptions{},
			Deletes: &adapt.Collection{
				integrationCredential,
			},
			Params: datasource.GetParamsFromSession(coreSession),
		},
	}
	if err := datasource.SaveWithOptions(requests, coreSession, datasource.GetConnectionSaveOptions(platformConn)); err != nil {
		return err
	}
	return nil
}

// GetIntegrationCredential retrieves any existing integration credential record for the provided user / integration
func GetIntegrationCredential(
	userId, integrationName string, coreSession *sess.Session, connection adapt.Connection,
) (*adapt.Item, error) {
	integrationCredentials := &adapt.Collection{}
	fetchIntegrationCredentialOp := &adapt.LoadOp{
		Params:         datasource.GetParamsFromSession(coreSession),
		CollectionName: IntegrationCredentialCollection,
		Collection:     integrationCredentials,
		BatchSize:      1,
		Query:          true,
		Fields: []adapt.LoadRequestField{
			{
				ID: adapt.ID_FIELD,
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
		},
		Conditions: []adapt.LoadRequestCondition{
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
		[]*adapt.LoadOp{fetchIntegrationCredentialOp},
		coreSession,
		&datasource.LoadOptions{
			Connection: connection,
			Metadata:   connection.GetMetadata(),
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
