package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runUserTokenValueLoadBot(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	tokenMap := sess.TokenMap{}

	var uatc meta.UserAccessTokenCollection
	err := bundle.LoadAllFromAny(&uatc, nil, session, nil)
	if err != nil {
		return err
	}

	err = datasource.HydrateTokenMap(tokenMap, uatc, connection, session, true)
	if err != nil {
		return err
	}

	op.Fields = []adapt.LoadRequestField{
		{ID: "uesio/studio.token"},
	}

	for tokenName, tokenValues := range tokenMap {
		for _, value := range tokenValues {
			item := op.Collection.NewItem()
			item.SetField("uesio/studio.name", tokenName)
			item.SetField("uesio/studio.token", value.Value)
			item.SetField("uesio/studio.reason", value.Reason)
			op.Collection.AddItem(item)
		}
	}

	return nil

}
