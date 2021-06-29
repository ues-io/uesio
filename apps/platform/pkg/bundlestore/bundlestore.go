package bundlestore

import (
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/meta"
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
	GetItem(item meta.BundleableItem, version string, session *sess.Session) error
	GetItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) error
	GetFileStream(version string, file *meta.File, session *sess.Session) (io.ReadCloser, error)
	GetBotStream(version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error)
	GetComponentPackStream(version string, buildMode bool, componentPack *meta.ComponentPack, session *sess.Session) (io.ReadCloser, error)
	StoreItems(namespace, version string, itemStreams []ItemStream) error
	GetBundleDef(namespace, version string, session *sess.Session) (*meta.BundleDef, error)
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
	if namespace == "uesio" || namespace == "studio" || namespace == "io" || namespace == "docs" || namespace == "web" {
		return getBundleStoreByType("system")
	}

	return getBundleStoreByType("local")
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
