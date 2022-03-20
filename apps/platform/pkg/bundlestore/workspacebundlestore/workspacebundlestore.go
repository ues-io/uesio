package workspacebundlestore

import (
	"errors"
	"io"
	"strings"

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

	if session.GetWorkspace() == nil {
		return errors.New("Workspace bundle store, needs a workspace in context")
	}

	item.SetNamespace(session.GetWorkspaceApp())

	return datasource.PlatformLoadOne(item, &datasource.PlatformLoadOptions{
		Conditions: []adapt.LoadRequestCondition{
			{
				Field: adapt.ID_FIELD,
				Value: item.GetDBID(session.GetWorkspaceID()),
			},
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

	if session.GetWorkspace() == nil {
		return errors.New("Workspace bundle store, needs a workspace in context")
	}

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
		}, &datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    adapt.ID_FIELD,
					Value:    ids,
					Operator: "IN",
				},
			}}, session.RemoveWorkspaceContext())
		if err != nil {
			return err
		}

		if group.Len() != len(items) {
			badValues, err := loadable.FindMissing(group, func(item loadable.Item) string {
				value, err := item.GetField(adapt.ID_FIELD)
				if err != nil {
					return ""
				}
				return value.(string)
			}, ids)
			if err != nil {
				return err
			}
			if len(badValues) > 0 {
				return errors.New("Could not load workspace metadata item: " + collectionName + ":" + strings.Join(badValues, " : "))
			}
		}

		return group.Loop(func(item loadable.Item, _ string) error {
			bundleable := item.(meta.BundleableItem)
			match := itemMap[collectionName+":"+bundleable.GetDBID(workspace)]
			meta.Copy(match, item)
			return nil
		})

	}
	return nil
}

func (b *WorkspaceBundleStore) GetAllItems(group meta.BundleableGroup, namespace, version string, conditions meta.BundleConditions, session *sess.Session) error {

	if session.GetWorkspace() == nil {
		return errors.New("Workspace bundle store, needs a workspace in context")
	}

	// Add the workspace id as a condition
	loadConditions := []adapt.LoadRequestCondition{
		{
			Field: "uesio/studio.workspace",
			Value: session.GetWorkspaceID(),
		},
	}

	for field, value := range conditions {
		loadConditions = append(loadConditions, adapt.LoadRequestCondition{
			Field: field,
			Value: value,
		})
	}

	return datasource.PlatformLoad(&WorkspaceLoadCollection{
		Collection: group,
		Namespace:  namespace,
	}, &datasource.PlatformLoadOptions{
		Conditions: loadConditions,
	}, session.RemoveWorkspaceContext())

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

func (b *WorkspaceBundleStore) GetBotStream(version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	stream, _, err := filesource.Download(bot.Content.ID, session.RemoveWorkspaceContext())
	if err != nil {
		return nil, err
	}
	return stream, nil
}

func (b *WorkspaceBundleStore) GetGenerateBotTemplateStream(template, version string, bot *meta.Bot, session *sess.Session) (io.ReadCloser, error) {
	return nil, errors.New("Cant use generate bot templates here yet. :(")
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
	workspaceID := namespace + "_" + version
	err := datasource.PlatformLoad(
		&bdc,
		&datasource.PlatformLoadOptions{
			Fields: []adapt.LoadRequestField{
				{
					ID: adapt.ID_FIELD,
				},
				{
					ID: "uesio/studio.workspace",
				},
				{
					ID: "uesio/studio.bundle",
					Fields: []adapt.LoadRequestField{
						{
							ID: "uesio/studio.app",
						},
						{
							ID: "uesio/studio.major",
						},
						{
							ID: "uesio/studio.minor",
						},
						{
							ID: "uesio/studio.patch",
						},
					},
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field:    "uesio/studio.workspace",
					Value:    workspaceID,
					Operator: "=",
				},
			},
		},
		session.RemoveWorkspaceContext(),
	)
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

	var workspace meta.Workspace
	err = datasource.PlatformLoadOne(
		&workspace,
		&datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: adapt.ID_FIELD,
					Value: workspaceID,
				},
			},
		},
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return nil, err
	}

	by.DefaultProfile = workspace.DefaultProfile
	by.PublicProfile = workspace.PublicProfile
	by.HomeRoute = workspace.HomeRoute
	by.LoginRoute = workspace.LoginRoute
	by.DefaultTheme = workspace.DefaultTheme

	return &by, nil
}
