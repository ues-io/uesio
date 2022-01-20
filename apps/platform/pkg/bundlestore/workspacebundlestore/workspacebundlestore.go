package workspacebundlestore

import (
	"errors"
	"io"

	"github.com/jinzhu/copier"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// WorkspaceBundleStore struct
type WorkspaceBundleStore struct {
}

// GetItem function
func (b *WorkspaceBundleStore) GetItem(item meta.BundleableItem, version string, session *sess.Session) error {

	item.SetNamespace(session.GetWorkspaceApp())

	return datasource.PlatformLoadOne(item, []adapt.LoadRequestCondition{
		{
			Field: "uesio.id",
			Value: item.GetDBID(session.GetWorkspaceID()),
		},
	}, session.RemoveWorkspaceContext())
}

func (b *WorkspaceBundleStore) HasAny(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) (bool, error) {
	err := b.GetAllItems(group, namespace, version, conditions, session)
	if err != nil {
		return false, err
	}
	return group.Len() > 0, nil
}

func (b *WorkspaceBundleStore) GetManyItems(items []meta.BundleableItem, version string, session *sess.Session) error {
	collectionIDs := map[string][]string{}
	itemMap := map[string]meta.BundleableItem{}
	workspace := session.GetWorkspaceID()
	namespace := session.GetWorkspaceApp()
	for _, item := range items {
		collectionName := meta.GetNameKeyPart(item.GetCollectionName())
		dbID := item.GetDBID(workspace)
		item.SetNamespace(namespace)
		_, ok := collectionIDs[collectionName]
		if !ok {
			collectionIDs[collectionName] = []string{}
		}

		collectionIDs[collectionName] = append(collectionIDs[collectionName], dbID)
		itemMap[collectionName+":"+dbID] = item
	}
	for collectionName, ids := range collectionIDs {
		group, err := meta.GetBundleableGroupFromType(collectionName)
		if err != nil {
			return err
		}

		err = datasource.PlatformLoad(&WorkspaceLoadCollection{
			Collection: group,
			Namespace:  namespace,
		}, []adapt.LoadRequestCondition{
			{
				Field:    "uesio.id",
				Value:    ids,
				Operator: "IN",
			},
		}, session.RemoveWorkspaceContext())
		if err != nil {
			return err
		}

		return group.Loop(func(item loadable.Item, index interface{}) error {
			bundleable := item.(meta.BundleableItem)
			match := itemMap[collectionName+":"+bundleable.GetDBID(workspace)]
			return copier.Copy(match, item)
		})

	}
	return nil
}

func (b *WorkspaceBundleStore) GetAllItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) error {
	// Add the workspace id as a condition
	loadConditions := []adapt.LoadRequestCondition{
		{
			Field: "studio.workspace",
			Value: session.GetWorkspaceID(),
		},
	}

	for field, value := range conditions {
		loadConditions = append(loadConditions, adapt.LoadRequestCondition{
			Field: field,
			Value: value,
		})
	}

	ops := datasource.GetPlatformLoadOps(&WorkspaceLoadCollection{
		Collection: group,
		Namespace:  namespace,
	}, datasource.GetLoadRequestFields(group.GetFields()), loadConditions)

	return loadData(ops, loadConditions, session)

}

func loadData(ops []adapt.LoadOp, loadConditions []adapt.LoadRequestCondition, session *sess.Session) error {

	err := datasource.PlatformLoads(ops, session.RemoveWorkspaceContext())
	if err != nil {
		return err
	}

	if ops[0].HasMoreBatches {
		return loadData(ops, loadConditions, session)
	}

	return nil
}

// GetFileStream function
func (b *WorkspaceBundleStore) GetFileStream(version string, file *meta.File, session *sess.Session) (io.ReadCloser, error) {
	if file.Content == nil {
		return nil, nil
	}
	stream, userFile, err := filesource.Download(file.Content.ID, session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}
	file.FileName = userFile.FileName
	return stream, nil
}

// GetComponentPackStream function
func (b *WorkspaceBundleStore) GetComponentPackStream(version string, buildMode bool, componentPack *meta.ComponentPack, session *sess.Session) (io.ReadCloser, error) {
	fileID := componentPack.RuntimeBundle.ID
	if buildMode {
		fileID = componentPack.BuildTimeBundle.ID
	}
	stream, _, err := filesource.Download(fileID, session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}
	return stream, nil
}

// GetBotStream function
func (b *WorkspaceBundleStore) GetBotStream(version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	stream, _, err := filesource.Download(bot.Content.ID, session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}
	return stream, nil
}

// StoreItems function
func (b *WorkspaceBundleStore) StoreItems(namespace string, version string, itemStreams []bundlestore.ItemStream, session *sess.Session) error {
	return errors.New("Tried to store items in the workspace bundle store")
}

// GetBundleDef function
func (b *WorkspaceBundleStore) GetBundleDef(namespace, version string, session *sess.Session) (*meta.BundleDef, error) {
	var by meta.BundleDef
	by.Name = namespace
	bdc := meta.BundleDependencyCollection{}
	err := datasource.PlatformLoadWithFields(
		&bdc,
		[]adapt.LoadRequestField{
			{
				ID: "uesio.id",
			},
			{
				ID: "studio.workspace",
			},
			{
				ID: "studio.bundle",
				Fields: []adapt.LoadRequestField{
					{
						ID: "studio.app",
					},
					{
						ID: "studio.major",
					},
					{
						ID: "studio.minor",
					},
					{
						ID: "studio.patch",
					},
				},
			},
		},
		[]adapt.LoadRequestCondition{
			{
				Field:    "studio.workspace",
				Value:    namespace + "_" + version,
				Operator: "=",
			},
		},

		session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}
	if len(bdc) != 0 {
		by.Dependencies = map[string]meta.BundleDefDep{}
	}
	for i := range bdc {
		// TODO: Possibly recurse here to get sub dependencies
		by.Dependencies[bdc[i].GetBundleName()] = meta.BundleDefDep{
			Version: bdc[i].GetVersionString(),
		}
	}

	workspace := session.GetWorkspace()
	if workspace == nil {
		return nil, errors.New("No workspace found")
	}
	by.DefaultProfile = workspace.DefaultProfile
	by.PublicProfile = workspace.PublicProfile
	by.HomeRoute = workspace.HomeRoute
	by.LoginRoute = workspace.LoginRoute
	by.DefaultTheme = workspace.DefaultTheme

	return &by, nil
}
