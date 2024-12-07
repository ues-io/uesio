package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/secretstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runSecretLoadBot(op *wire.LoadOp, connection wire.Connection, session *sess.Session) error {

	// Currently, this doesn't work for regular contexts
	if session.GetWorkspace() == nil && session.GetSiteAdmin() == nil {
		return errors.New("Must be in workspace or site admin context")
	}

	secrets, err := secretstore.GetSecrets(session)
	if err != nil {
		return errors.New("Failed to get secrets: " + err.Error())
	}

	for _, secret := range *secrets {

		opItem := op.Collection.NewItem()
		err := opItem.SetField("uesio/core.name", secret.Name)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.namespace", secret.Namespace)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.label", secret.Label)
		if err != nil {
			return err
		}
		err = opItem.SetField("uesio/core.id", secret.Namespace+"."+secret.Name)
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
