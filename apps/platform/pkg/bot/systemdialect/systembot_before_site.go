package systemdialect

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runSiteBeforeSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	return request.LoopChanges(func(change *wire.ChangeItem) error {
		bundleObj, err := change.GetField("uesio/studio.bundle")
		if err != nil || bundleObj == nil {
			return err
		}
		// If the site's associated bundle's unique key does not have the "repository" at the end of it,
		// we need to fix that to ensure that it is correct
		bundleItem, ok := bundleObj.(meta.Item)
		if !ok {
			return nil
		}
		return meta.RebuildBundleUniqueKey(bundleItem)
	})
}
