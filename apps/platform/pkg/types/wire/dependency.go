package wire

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/meta"
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

func (m *MetadataDependencyMap) AddRequired(change *ChangeItem, metadataType, fieldName string) error {
	metadataName, err := change.GetFieldAsString(fieldName)
	if err != nil || metadataName == "" {
		return fmt.Errorf("missing metadata item in field: %s", fieldName)
	}
	return m.AddItem(metadataType, metadataName)
}

func (m *MetadataDependencyMap) AddOptional(change *ChangeItem, metadataType, fieldName string) error {
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
