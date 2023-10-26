package oauth2

import (
	"time"

	"golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func BuildIntegrationCredential(integrationName string, userId string, tok *oauth2.Token) *adapt.Item {
	integrationCredential := &adapt.Item{}
	userReference := &adapt.Item{}
	userReference.SetField(adapt.ID_FIELD, userId)
	integrationCredential.SetField("uesio/core.integration", integrationName)
	integrationCredential.SetField("uesio/core.user", userReference)
	integrationCredential.SetField("uesio/core.accesstoken", tok.AccessToken)
	integrationCredential.SetField("uesio/core.refreshtoken", tok.RefreshToken)
	expiry := tok.Expiry
	if expiry.IsZero() {
		// Use default expiry of 1 hour
		expiry = time.Now().Add(time.Hour)
	}
	integrationCredential.SetField("uesio/core.accesstokenexpiration", expiry.Unix())
	return integrationCredential
}
