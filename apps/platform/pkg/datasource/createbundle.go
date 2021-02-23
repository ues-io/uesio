package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func CreateBundle(namespace, sourceversion, destversion, description string, source bundlestore.BundleStore, session *sess.Session) error {
	streams, err := retrieve.RetrieveBundle(namespace, sourceversion, source, session)
	if err != nil {
		return err
	}

	bundle, err := meta.NewBundle(namespace, destversion, description)
	if err != nil {
		return err
	}

	err = PlatformSaveOne(bundle, nil, session.RemoveWorkspaceContext())
	if err != nil {
		return err
	}
	dest, err := bundlestore.GetBundleStore(namespace, session.RemoveWorkspaceContext())
	if err != nil {
		return err
	}
	return dest.StoreItems(namespace, destversion, streams)
}
