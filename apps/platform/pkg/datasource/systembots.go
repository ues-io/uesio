package datasource

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type MetadataDependencyMap map[string]map[string]bool

func (m *MetadataDependencyMap) AddMap(keys map[string]bool, metadataType string) error {
	for key := range keys {
		err := m.AddItem(metadataType, key)
		if err != nil {
			return err
		}
	}
	return nil
}

func (m *MetadataDependencyMap) AddRequired(change *adapt.ChangeItem, metadataType, fieldName string) error {
	metadataName, err := change.GetFieldAsString(fieldName)
	if err != nil || metadataName == "" {
		return errors.New("Missing metadata item in field: " + fieldName)
	}
	return m.AddItem(metadataType, metadataName)
}

func (m *MetadataDependencyMap) AddOptional(change *adapt.ChangeItem, metadataType, fieldName string) error {
	metadataName, err := change.GetFieldAsString(fieldName)
	if err != nil || metadataName == "" {
		return nil
	}
	return m.AddItem(metadataType, metadataName)
}

func (m *MetadataDependencyMap) AddItem(metadataType, metadataName string) error {
	_, ok := (*m)[metadataType]
	if !ok {
		(*m)[metadataType] = map[string]bool{}
	}
	(*m)[metadataType][metadataName] = true
	return nil
}

func (m *MetadataDependencyMap) GetItems() ([]meta.BundleableItem, error) {
	var items []meta.BundleableItem

	collections, ok := (*m)["collection"]
	if ok {
		collectionItems, err := meta.NewCollections(collections)
		if err != nil {
			return nil, err
		}
		items = append(items, collectionItems...)
	}

	views, ok := (*m)["view"]
	if ok {
		viewItems, err := meta.NewViews(views)
		if err != nil {
			return nil, err
		}
		items = append(items, viewItems...)
	}

	themes, ok := (*m)["theme"]
	if ok {
		themeItems, err := meta.NewThemes(themes)
		if err != nil {
			return nil, err
		}
		items = append(items, themeItems...)
	}

	labels, ok := (*m)["label"]
	if ok {
		labelItems, err := meta.NewLabels(labels)
		if err != nil {
			return nil, err
		}
		items = append(items, labelItems...)
	}

	selectlists, ok := (*m)["selectlist"]
	if ok {
		selectlistItems, err := meta.NewSelectLists(selectlists)
		if err != nil {
			return nil, err
		}
		items = append(items, selectlistItems...)
	}

	return items, nil
}

func getIDsFromUpdatesAndDeletes(request *adapt.SaveOp) []string {
	keys := []string{}
	for i := range request.Updates {
		keys = append(keys, request.Updates[i].IDValue)
	}
	for i := range request.Deletes {
		keys = append(keys, request.Deletes[i].IDValue)
	}
	return keys
}

func getUniqueKeysFromUpdatesAndDeletes(request *adapt.SaveOp) []string {
	keys := []string{}
	for i := range request.Updates {
		keys = append(keys, request.Updates[i].UniqueKey)
	}
	for i := range request.Deletes {
		keys = append(keys, request.Deletes[i].UniqueKey)
	}
	return keys
}

func clearHostForDomains(ids []string) error {
	keys := []string{}
	for _, id := range ids {
		key, err := getHostKeyFromDomainId(id)
		if err != nil {
			return err
		}
		keys = append(keys, key)
	}

	return cache.DeleteKeys(keys)
}

func getHostKeyFromDomainId(id string) (string, error) {
	idParts := strings.Split(id, ":")
	if len(idParts) != 2 {
		return "", errors.New("Bad Domain ID: " + id)
	}
	return cache.GetHostKey(idParts[1], idParts[0]), nil
}

func checkValidItems(workspaceID string, items []meta.BundleableItem, session *sess.Session, connection adapt.Connection) error {
	if len(items) == 0 {
		return nil
	}

	//This creates a copy of the session
	wsSession := session.RemoveWorkspaceContext()

	err := AddWorkspaceContextByID(workspaceID, wsSession, connection)
	if err != nil {
		return err
	}
	return bundle.IsValid(items, wsSession, connection)

}

func checkWorkspaceID(currentWorkspace *string, change *adapt.ChangeItem) error {

	workspaceID, err := change.GetFieldAsString("uesio/studio.workspace->uesio/core.id")
	if err != nil {
		return err
	}

	if *currentWorkspace == "" {
		*currentWorkspace = workspaceID
	}

	if *currentWorkspace != workspaceID {
		return errors.New("Can't change different WS or APPS")
	}

	return nil
}

func requireValue(change *adapt.ChangeItem, fieldName string) (string, error) {

	value, err := change.GetFieldAsString(fieldName)
	if err != nil || value == "" {
		return "", errors.New(fieldName + " is required")
	}

	return value, nil

}
