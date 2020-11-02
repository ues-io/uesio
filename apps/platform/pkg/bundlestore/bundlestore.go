package bundlestore

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/bundlestore/localbundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/platformbundlestore"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/workspacebundlestore"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"gopkg.in/yaml.v3"
)

// BundleStore interface
type BundleStore interface {
	GetItem(namespace string, version string, objectname string, name string) (io.ReadCloser, error)
	ListItems(namespace string, version string, objectname string) ([]string, error)
	StoreItems(namespace string, version string, itemStreams []reqs.ItemStream) error
}

// StoreWorkspaceAsBundle function
func StoreWorkspaceAsBundle(appName string, version string, itemStreams []reqs.ItemStream, session *sess.Session) error {
	bundleStoreInstance, err := GetBundleStore(appName, session)
	if err != nil {
		return err
	}
	return bundleStoreInstance.StoreItems(appName, version, itemStreams)
}

// GetBundleStore function
func GetBundleStore(namespace string, session *sess.Session) (BundleStore, error) {
	// If we're in a workspace context and the namespace we're looking for is that workspace,
	// use the workspace bundlestore
	if namespace == "" {
		return nil, errors.New("Could not get bundlestore: No namespace provided")
	}
	if session.GetWorkspaceApp() == namespace {
		return &workspacebundlestore.WorkspaceBundleStore{}, nil
	}
	if namespace == "material" || namespace == "sample" || namespace == "crm" || namespace == "uesio" {
		return &localbundlestore.LocalBundleStore{}, nil
	}
	return &platformbundlestore.PlatformBundleStore{}, nil
}

// DecodeYAML function
func DecodeYAML(v interface{}, reader io.Reader) error {
	decoder := yaml.NewDecoder(reader)
	err := decoder.Decode(v)
	if err != nil {
		return err
	}

	return nil
}
