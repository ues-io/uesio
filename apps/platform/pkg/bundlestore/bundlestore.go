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

// NOTE - This should be kept in sync with the systemBundles list in platform.ts
// https://github.com/ues-io/uesio/blob/693e6914ca3e2c58f4f57bdf368e062a39360244/libs/ui/src/platform/platform.ts#L188
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
	GetItem(ctx context.Context, item meta.BundleableItem, options *GetItemOptions) error
	GetManyItems(ctx context.Context, items []meta.BundleableItem, options *GetManyItemsOptions) error
	GetAllItems(ctx context.Context, group meta.BundleableGroup, options *GetAllItemsOptions) error
	HasAny(ctx context.Context, group meta.BundleableGroup, options *HasAnyOptions) (bool, error)
	GetItemAttachment(ctx context.Context, item meta.AttachableItem, path string) (io.ReadSeekCloser, file.Metadata, error)
	GetItemAttachments(ctx context.Context, creator FileCreator, item meta.AttachableItem) error
	GetAttachmentPaths(ctx context.Context, item meta.AttachableItem) ([]file.Metadata, error)
	GetBundleDef(ctx context.Context) (*meta.BundleDef, error)
	HasAllItems(ctx context.Context, items []meta.BundleableItem) error
	DeleteBundle(ctx context.Context) error
	GetBundleZip(ctx context.Context, writer io.Writer, options *BundleZipOptions) error
	SetBundleZip(ctx context.Context, reader io.ReaderAt, size int64) error
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
