package systemdialect

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/featureflagstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func getKeyInfo(change *wire.ChangeItem, session *sess.Session) (string, string, error) {

	fullKey, err := change.GetFieldAsString("uesio/core.id")
	if err != nil {
		return "", "", err
	}

	keyParts := strings.Split(fullKey, ":")
	if len(keyParts) != 2 {
		return "", "", errors.New("invalid key")
	}

	key := keyParts[0]

	var userID string

	// Currently, this doesn't work for regular contexts
	if session.GetWorkspace() != nil {
		userID = session.GetContextUser().ID
	}
	if session.GetSiteAdmin() != nil {
		userID = keyParts[1]
	}
	if userID == "" {
		return "", "", errors.New("No User Id provided to feature flag save.")
	}
	return key, userID, nil
}

func runFeatureFlagSaveBot(op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	err := op.LoopUpdates(func(change *wire.ChangeItem) error {

		key, userID, err := getKeyInfo(change, session)
		if err != nil {
			return err
		}

		value, err := change.GetField("uesio/core.value")
		if err != nil {
			return err
		}

		return featureflagstore.SetValue(key, value, userID, session)
	})
	if err != nil {
		return err
	}
	return op.LoopDeletes(func(change *wire.ChangeItem) error {
		key, userID, err := getKeyInfo(change, session)
		if err != nil {
			return err
		}
		return featureflagstore.Remove(key, userID, session)
	})
}
