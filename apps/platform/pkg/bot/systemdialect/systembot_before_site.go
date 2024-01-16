package systemdialect

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/goutils"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runSiteBeforeSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	primaryDomain := env.GetPrimaryDomain()
	return request.LoopChanges(func(change *wire.ChangeItem) error {
		bundleObj, err := change.GetField("uesio/studio.bundle")
		if err != nil || bundleObj == nil {
			return err
		}
		// If the site's associated bundle's unique key does not have the "repository" at the end of it,
		// we need to fix that to ensure that it is correct
		bundleItem, ok := bundleObj.(*wire.Item)
		if !ok {
			return nil
		}
		bundleKey, err := bundleItem.GetField(commonfields.UniqueKey)
		if err != nil || bundleKey == "" {
			return nil
		}
		bundleKeyString := goutils.StringValue(bundleKey)
		// Make sure that the key has the repository in it
		keyParts := strings.Split(bundleKeyString, ":")
		if len(keyParts) == 4 {
			if err = bundleItem.SetField(commonfields.UniqueKey, bundleKeyString+":"+primaryDomain); err != nil {
				return err
			}
		}
		return nil
	})
}
