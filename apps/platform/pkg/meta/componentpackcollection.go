package meta

import (
	"strconv"
	"strings"
)

type ComponentPackCollection []*ComponentPack

var COMPONENTPACK_COLLECTION_NAME = "uesio/studio.componentpack"
var COMPONENTPACK_FOLDER_NAME = "componentpacks"
var COMPONENTPACK_FIELDS = StandardGetFields(&ComponentPack{})

func (cpc *ComponentPackCollection) GetName() string {
	return COMPONENTPACK_COLLECTION_NAME
}

func (cpc *ComponentPackCollection) GetBundleFolderName() string {
	return COMPONENTPACK_FOLDER_NAME
}

func (cpc *ComponentPackCollection) GetFields() []string {
	return COMPONENTPACK_FIELDS
}

func (cpc *ComponentPackCollection) NewItem() Item {
	return &ComponentPack{}
}

func (cpc *ComponentPackCollection) AddItem(item Item) error {
	*cpc = append(*cpc, item.(*ComponentPack))
	return nil
}

func (cpc *ComponentPackCollection) GetItemFromPath(path, namespace string) BundleableItem {
	name, _, _ := strings.Cut(path, "/")
	return NewBaseComponentPack(namespace, name)
}

func (cpc *ComponentPackCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewComponentPack(key)
}

func (cpc *ComponentPackCollection) IsDefinitionPath(path string) bool {
	parts := strings.Split(path, "/")
	return len(parts) == 2 && parts[1] == "pack.yaml"
}

func (cpc *ComponentPackCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	if definitionOnly {
		return cpc.IsDefinitionPath(path)
	}
	return true
}

func (cpc *ComponentPackCollection) Loop(iter GroupIterator) error {
	for index, cp := range *cpc {
		err := iter(cp, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (cpc *ComponentPackCollection) Len() int {
	return len(*cpc)
}
