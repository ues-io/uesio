package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runBundleBeforeSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	primaryDomain := env.GetPrimaryDomain()
	return request.LoopChanges(func(change *wire.ChangeItem) error {
		repo, err := change.GetField("uesio/studio.repository")
		if err != nil {
			return err
		}
		if repo == nil || repo == "" {
			// Ensure that repository is populated
			if err = change.SetField("uesio/studio.repository", primaryDomain); err != nil {
				return err
			}
		}
		return nil
	})
}
