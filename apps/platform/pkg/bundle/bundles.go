package bundle

import (
	"context"
	"fmt"
	"io"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/file"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func GetSiteBundleDef(ctx context.Context, site *meta.Site, connection wire.Connection) (*meta.BundleDef, error) {
	return GetVersionBundleDef(ctx, site.GetAppFullName(), site.Bundle.GetVersionString(), connection)
}

func GetVersionBundleDef(ctx context.Context, namespace, version string, connection wire.Connection) (*meta.BundleDef, error) {
	bs, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace:  namespace,
		Version:    version,
		Connection: connection,
	})
	if err != nil {
		return nil, err
	}
	return bs.GetBundleDef(ctx)
}

func GetWorkspaceBundleDef(ctx context.Context, workspace *meta.Workspace, connection wire.Connection) (*meta.BundleDef, error) {

	bs, err := bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace:  workspace.GetAppFullName(),
		Version:    workspace.Name,
		Connection: connection,
		Workspace:  workspace,
	})
	if err != nil {
		return nil, err
	}
	return bs.GetBundleDef(ctx)
}

func GetVersion(namespace string, session *sess.Session) (string, error) {

	appName := session.GetContextAppName()
	appVersion := session.GetContextVersionName()

	_, _, err := meta.ParseNamespace(namespace)
	if err != nil {
		return "", fmt.Errorf("bad namespace: %s", namespace)
	}

	if appName == namespace {
		// We always have a license to our own app.
		return appVersion, nil
	}

	bundle := session.GetContextAppBundle()

	if bundle == nil {
		return "", fmt.Errorf("no bundle info provided for: %s", appName)
	}

	depBundle, hasDep := bundle.Dependencies[namespace]
	if !hasDep {
		return "", fmt.Errorf("%s doesn't have %s installed", appName, namespace)
	}

	if bundle.Licenses == nil {
		return "", fmt.Errorf("no license info provided for: %s", appName)
	}

	license, hasLicense := bundle.Licenses[namespace]
	if !hasLicense {
		return "", fmt.Errorf("%s doesn't have a license to use %s", appName, namespace)
	}

	if !license.Active {
		return "", fmt.Errorf("%s has a inactive license to use %s ", appName, namespace)
	}

	return depBundle.Version, nil
}

func GetBundleStoreConnection(namespace string, session *sess.Session, connection wire.Connection) (bundlestore.BundleStoreConnection, error) {
	version, err := GetVersion(namespace, session)
	if err != nil {
		return nil, err
	}

	return bundlestore.GetConnection(bundlestore.ConnectionOptions{
		Namespace:    namespace,
		Version:      version,
		Connection:   connection,
		Workspace:    session.GetWorkspace(),
		Permissions:  session.GetContextPermissions(),
		AllowPrivate: session.GetContextAppName() == namespace,
	})
}

func LoadAllFromAny(ctx context.Context, group meta.BundleableGroup, options *bundlestore.GetAllItemsOptions, session *sess.Session, connection wire.Connection) error {
	return LoadAllFromNamespaces(ctx, session.GetContextNamespaces(), group, options, session, connection)
}

func LoadAllFromNamespaces(ctx context.Context, namespaces []string, group meta.BundleableGroup, options *bundlestore.GetAllItemsOptions, session *sess.Session, connection wire.Connection) error {
	for _, namespace := range namespaces {
		err := LoadAll(ctx, group, namespace, options, session, connection)
		if err != nil {
			return err
		}
	}
	return nil
}

func HasAny(ctx context.Context, group meta.BundleableGroup, namespace string, options *bundlestore.HasAnyOptions, session *sess.Session, connection wire.Connection) (bool, error) {
	bs, err := GetBundleStoreConnection(namespace, session, connection)
	if err != nil {
		return false, err
	}
	return bs.HasAny(ctx, group, options)
}

func LoadAll(ctx context.Context, group meta.BundleableGroup, namespace string, options *bundlestore.GetAllItemsOptions, session *sess.Session, connection wire.Connection) error {
	bs, err := GetBundleStoreConnection(namespace, session, connection)
	if err != nil {
		fmt.Println("failed load all: " + group.GetName())
		return err
	}
	return bs.GetAllItems(ctx, group, options)
}

func LoadMany(ctx context.Context, items []meta.BundleableItem, options *bundlestore.GetManyItemsOptions, session *sess.Session, connection wire.Connection) error {
	for namespace, nsItems := range groupItemsByNamespace(items) {
		bs, err := GetBundleStoreConnection(namespace, session, connection)
		if err != nil {
			if options.IgnoreUnlicensedItems {
				continue
			}
			fmt.Println("failed load many")
			for _, item := range nsItems {
				fmt.Println(item.GetKey())
			}
			return err
		}
		if err = bs.GetManyItems(ctx, nsItems, options); err != nil {
			return err
		}
	}
	return nil
}

func Load(ctx context.Context, item meta.BundleableItem, options *bundlestore.GetItemOptions, session *sess.Session, connection wire.Connection) error {
	bs, err := GetBundleStoreConnection(item.GetNamespace(), session, connection)
	if err != nil {
		return fmt.Errorf("failed to load item: %s of type: %s with error: %w", item.GetKey(), item.GetBundleFolderName(), err)
	}
	return bs.GetItem(ctx, item, options)
}

func GetItemAttachment(ctx context.Context, item meta.AttachableItem, path string, session *sess.Session, connection wire.Connection) (io.ReadSeekCloser, file.Metadata, error) {
	bs, err := GetBundleStoreConnection(item.GetNamespace(), session, connection)
	if err != nil {
		return nil, nil, err
	}
	return bs.GetItemAttachment(ctx, item, path)
}

func GetAttachmentPaths(ctx context.Context, item meta.AttachableItem, session *sess.Session, connection wire.Connection) ([]file.Metadata, error) {
	bs, err := GetBundleStoreConnection(item.GetNamespace(), session, connection)
	if err != nil {
		return nil, err
	}
	return bs.GetAttachmentPaths(ctx, item)
}

func IsValid(ctx context.Context, items []meta.BundleableItem, session *sess.Session, connection wire.Connection) error {
	for namespace, nsItems := range groupItemsByNamespace(items) {
		bs, err := GetBundleStoreConnection(namespace, session, connection)
		if err != nil {
			return err
		}
		if err = bs.HasAllItems(ctx, nsItems); err != nil {
			return err
		}
	}
	return nil
}

// groups a slice of BundleableItem by namespace
func groupItemsByNamespace(items []meta.BundleableItem) map[string][]meta.BundleableItem {
	collated := map[string][]meta.BundleableItem{}
	for _, item := range items {
		namespace := item.GetNamespace()
		_, ok := collated[namespace]
		if !ok {
			collated[namespace] = []meta.BundleableItem{}
		}
		collated[namespace] = append(collated[namespace], item)
	}
	return collated
}
