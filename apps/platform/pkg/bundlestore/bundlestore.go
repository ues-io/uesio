package bundlestore

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"gopkg.in/yaml.v3"
)

var bundleStoreMap = map[string]BundleStore{}

// RegisterBundleStore function
func RegisterBundleStore(name string, store BundleStore) {
	bundleStoreMap[name] = store
}

func getBundleStoreByType(bundleStoreType string) (BundleStore, error) {
	adapter, ok := bundleStoreMap[bundleStoreType]
	if !ok {
		return nil, errors.New("No bundle store found of this type: " + bundleStoreType)
	}
	return adapter, nil
}

// PermissionError struct
type PermissionError struct {
	message string
}

func (e *PermissionError) Error() string { return e.message }

// NewPermissionError creates a new permission error
func NewPermissionError(message string) *PermissionError {
	return &PermissionError{
		message: message,
	}
}

// BundleStore interface
type BundleStore interface {
	GetItem(item metadata.BundleableItem, version string, session *sess.Session) error
	GetItems(group metadata.BundleableGroup, namespace, version string, conditions []reqs.LoadRequestCondition, session *sess.Session) error
	GetFileStream(namespace, version string, file *metadata.File, session *sess.Session) (io.ReadCloser, string, error)
	GetComponentPackStream(namespace, version string, buildMode bool, componentPack *metadata.ComponentPack, session *sess.Session) (io.ReadCloser, error)
	StoreItems(namespace, version string, itemStreams []reqs.ItemStream) error
	GetBundleDef(namespace, version string, session *sess.Session) (*metadata.BundleDef, error)
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
		return getBundleStoreByType("workspace")
	}
	if namespace == "material" || namespace == "sample" || namespace == "crm" || namespace == "uesio" {
		return getBundleStoreByType("local")
	}
	return getBundleStoreByType("platform")
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
