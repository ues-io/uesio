package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getAccessMessage(ut datasource.UserAccessTokenValue) string {

	switch ut.UserAccessToken.Name {
	case "uesio.owner":
		return "Owner: " + ut.Value
	case "uesio.installed":
		return "Installed app: " + ut.Value
	case "uesio.namedpermission":
		return "Named permission: " + ut.Value
	case "teammember":
		return "App Team Member: " + ut.Value
	}

	return ut.UserAccessToken.Name + ":" + ut.Value
}

func runTokensLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	userTokens, err := datasource.GetAllUserAccessTokens(connection, session)
	if err != nil {
		return err
	}

	op.Fields = []adapt.LoadRequestField{
		{ID: "uesio/studio.token"},
	}

	metadata := connection.GetMetadata()

	tokensCollectionMetadata, err := metadata.GetCollection("uesio/studio.tokens")
	if err != nil {
		return err
	}

	tokensCollectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "token",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Token",
	})

	for _, ut := range userTokens {
		item := op.Collection.NewItem()
		item.SetField("uesio/studio.token", getAccessMessage(ut))
		op.Collection.AddItem(item)
	}

	return nil

}
