package systemdialect

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runConfigValueLoadBot(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	// Currently, this doesn't work for regular contexts
	if session.GetWorkspace() == nil && session.GetSiteAdmin() == nil {
		return errors.New("must be in workspace or site admin context")
	}

	configValues, err := configstore.GetConfigValues(session, &configstore.ConfigLoadOptions{
		OnlyWriteable: true,
	})
	if err != nil {
		return fmt.Errorf("failed to get config values: %w", err)
	}

	for _, configValue := range *configValues {

		opItem := op.Collection.NewItem()
		err := opItem.SetField("uesio/core.name", configValue.Name)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.namespace", configValue.Namespace)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.value", configValue.Value)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.label", configValue.Label)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.has_value", configValue.HasValue)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.id", configValue.Namespace+"."+configValue.Name)
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
