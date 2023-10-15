package oauth2

import (
	"golang.org/x/oauth2"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

func BuildIntegrationCredential(integrationName string, userId string, tok *oauth2.Token) *adapt.Item {
	integrationCredential := &adapt.Item{}
	integrationCredential.SetField("uesio/core.integration", integrationName)
	integrationCredential.SetField("uesio/core.user", userId)
	integrationCredential.SetField("uesio/core.accesstoken", tok.AccessToken)
	integrationCredential.SetField("uesio/core.refreshtoken", tok.RefreshToken)
	integrationCredential.SetField("uesio/core.accesstokenexpiration", tok.Expiry.Unix())
	return integrationCredential
}
