package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runFeatureFlagLoadBot(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {
	featureFlags, err := featureflagstore.GetFeatureFlags(session, session.GetContextUser().ID)
	if err != nil {
		return errors.New("Failed to get feature flags: " + err.Error())
	}

	for _, flag := range *featureFlags {
		opItem := op.Collection.NewItem()
		err := opItem.SetField("uesio/core.name", flag.Name)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.namespace", flag.Namespace)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.type", flag.Type)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.value", flag.Value)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.label", flag.Label)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.has_value", flag.HasValue)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.id", flag.Namespace+"."+flag.Name)
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
