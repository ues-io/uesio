package bundlestore

import (
	"context"
	"errors"
	"fmt"
	"io"

	"gopkg.in/yaml.v3"

	"slices"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var bundleStoreMap = map[string]BundleStore{}

var systemBundles = map[string]bool{
	"uesio/core":    true,
	"uesio/studio":  true,
	"uesio/io":      true,
	"uesio/builder": true,
	"uesio/sitekit": true,
	"uesio/appkit":  true,
	"uesio/aikit":   true,
}

func IsSystemBundle(namespace string) bool {
	_, isSystemBundle := systemBundles[namespace]
	return isSystemBundle
}

func RegisterBundleStore(name string, store BundleStore) {
	bundleStoreMap[name] = store
}

func GetBundleStoreByType(bundleStoreType string) (BundleStore, error) {
	adapter, ok := bundleStoreMap[bundleStoreType]
	if !ok {
		return nil, fmt.Errorf("no bundle store found of this type: %s", bundleStoreType)
	}
	return adapter, nil
}

type ConnectionOptions struct {
	Context      context.Context
	Namespace    string
	Version      string
	Connection   wire.Connection
	Workspace    *meta.Workspace
	Permissions  *meta.PermissionSet
	AllowPrivate bool
}

type BundleStore interface {
	GetConnection(ConnectionOptions) (BundleStoreConnection, error)
}

type FileCreator func(string) (io.WriteCloser, error)

type BundleZipOptions struct {
	IncludeGeneratedTypes bool
}

type GetItemOptions struct {
	IncludeUserFields bool
}

type GetManyItemsOptions struct {
	AllowMissingItems     bool
	IgnoreUnlicensedItems bool
	IncludeUserFields     bool
}

type GetAllItemsOptions struct {
	Fields            []wire.LoadRequestField
	Conditions        meta.BundleConditions
	IncludeUserFields bool
}

type HasAnyOptions struct {
	Conditions meta.BundleConditions
}

type BundleStoreConnection interface {
	GetItem(item meta.BundleableItem, options *GetItemOptions) error
	GetManyItems(items []meta.BundleableItem, options *GetManyItemsOptions) error
	GetAllItems(group meta.BundleableGroup, options *GetAllItemsOptions) error
	HasAny(group meta.BundleableGroup, options *HasAnyOptions) (bool, error)
	GetItemAttachment(w io.Writer, item meta.AttachableItem, path string) (file.Metadata, error)
	GetItemAttachments(creator FileCreator, item meta.AttachableItem) error
	GetAttachmentPaths(item meta.AttachableItem) ([]file.Metadata, error)
	GetBundleDef() (*meta.BundleDef, error)
	HasAllItems(items []meta.BundleableItem) error
	DeleteBundle() error
	GetBundleZip(writer io.Writer, options *BundleZipOptions) error
	SetBundleZip(reader io.ReaderAt, size int64) error
}

func getBundleStore(namespace string, workspace *meta.Workspace) (BundleStore, error) {
	// If we're in a workspace context and the namespace we're looking for is that workspace,
	// use the workspace bundlestore
	if namespace == "" {
		return nil, errors.New("could not get bundlestore: no namespace provided")
	}

	_, _, err := meta.ParseNamespace(namespace)
	if err != nil {
		return nil, err
	}

	if workspace != nil && workspace.GetAppFullName() == namespace {
		return GetBundleStoreByType("workspace")
	}

	if IsSystemBundle(namespace) {
		return GetBundleStoreByType("system")
	}

	return GetBundleStoreByType("platform")
}

func GetConnection(options ConnectionOptions) (BundleStoreConnection, error) {
	bs, err := getBundleStore(options.Namespace, options.Workspace)
	if err != nil {
		return nil, err
	}
	return bs.GetConnection(options)
}

func DecodeYAML(v any, reader io.Reader) error {
	return yaml.NewDecoder(reader).Decode(v)
}

func DoesItemMeetBundleConditions(item meta.BundleableItem, conditions meta.BundleConditions) bool {
	if len(conditions) == 0 {
		return true
	}
	for field, conditionDef := range conditions {
		fieldValue, err := item.GetField(field)
		// If any condition fails, bail early
		if err != nil {
			return false
		}
		switch conditionVal := conditionDef.(type) {
		case []any:
			foundMatch := slices.Contains(conditionVal, fieldValue)
			if !foundMatch {
				return false
			}
		case []string:
			foundMatch := false
			for i := range conditionVal {
				if conditionVal[i] == fieldValue {
					foundMatch = true
					break
				}
			}
			if !foundMatch {
				return false
			}
		default:
			if fieldValue != conditionDef {
				return false
			}
		}
	}
	return true
}
