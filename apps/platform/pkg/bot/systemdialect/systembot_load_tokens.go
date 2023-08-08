package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

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
		item.SetField("uesio/studio.token", ut)
		op.Collection.AddItem(item)
	}

	return nil

}
