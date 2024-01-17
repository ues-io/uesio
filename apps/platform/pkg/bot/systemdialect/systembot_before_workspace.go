package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runWorkspaceBeforeSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	return request.LoopChanges(func(change *wire.ChangeItem) error {
		bundleObj, err := change.GetField("uesio/studio.sourcebundle")
		if err != nil || bundleObj == nil {
			return err
		}
		// If the source bundle for  the workspace has a unique key
		// that does not have the "repository" at the end of it,
		// we need to fix that to ensure that it is correct
		bundleItem, ok := bundleObj.(meta.Item)
		if !ok {
			return nil
		}
		return meta.EnsureBundleHasRepository(bundleItem)
	})
}
