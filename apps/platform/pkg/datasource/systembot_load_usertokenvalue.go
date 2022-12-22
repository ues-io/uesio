package datasource

import (
	"github.com/teris-io/shortid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runUserTokenValueLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	userTokens := session.GetTokens()

	metadata := connection.GetMetadata()

	collectionMetadata, err := metadata.GetCollection("uesio/studio.usertokenvalue")
	if err != nil {
		return err
	}

	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "name",
		Namespace:  "uesio/studio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Name",
	})

	for _, token := range userTokens {

		opItem := op.Collection.NewItem()
		op.Collection.AddItem(opItem)
		fakeID, _ := shortid.Generate()

		opItem.SetField("uesio/core.id", fakeID)
		opItem.SetField("uesio/studio.name", token)

	}

	return nil

}
