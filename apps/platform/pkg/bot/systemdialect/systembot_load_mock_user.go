package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runMockUserBot(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	adminSession := sess.GetAnonSessionFrom(session)
	mockAuthEnabled, err := configstore.GetValue("uesio/core.mock_auth", adminSession)
	if err != nil {
		return err
	}

	if mockAuthEnabled != "true" {
		return nil
	}

	loginMethods := meta.LoginMethodCollection{}
	if err := datasource.PlatformLoad(&loginMethods, &datasource.PlatformLoadOptions{
		Fields: []wire.LoadRequestField{
			{
				ID: "uesio/core.federation_id",
			},
		},
		Conditions: []wire.LoadRequestCondition{
			{
				Field: "uesio/core.auth_source",
				Value: "uesio/core.mock",
			},
		},
		Connection: connection,
	}, adminSession); err != nil {
		return err
	}

	for _, loginMethod := range loginMethods {

		opItem := op.Collection.NewItem()
		err := opItem.SetField("uesio/appkit.name", loginMethod.FederationID)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/appkit.username", loginMethod.FederationID)
		if err != nil {
			return err
		}

		err = op.Collection.AddItem(opItem)
		if err != nil {
			return err
		}
	}

	return nil
}
