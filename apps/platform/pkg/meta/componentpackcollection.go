package meta

import (
	"os"
	"strconv"
	"strings"
)

type ComponentPackCollection []*ComponentPack

var COMPONENTPACK_COLLECTION_NAME = "uesio/studio.componentpack"
var COMPONENTPACK_FOLDER_NAME = "componentpacks"

func (cpc *ComponentPackCollection) GetName() string {
	return COMPONENTPACK_COLLECTION_NAME
}

func (cpc *ComponentPackCollection) GetBundleFolderName() string {
	return COMPONENTPACK_FOLDER_NAME
}

func (cpc *ComponentPackCollection) GetFields() []string {
	return StandardGetFields(&ComponentPack{})
}

func (cpc *ComponentPackCollection) NewItem() Item {
	return &ComponentPack{}
}

func (cpc *ComponentPackCollection) AddItem(item Item) {
	*cpc = append(*cpc, item.(*ComponentPack))
}

func (cpc *ComponentPackCollection) GetItemFromPath(path string) BundleableItem {
	name, _, _ := strings.Cut(path, string(os.PathSeparator))
	return &ComponentPack{Name: name}
}

func (cpc *ComponentPackCollection) IsDefinitionPath(path string) bool {
	parts := strings.Split(path, string(os.PathSeparator))
	return len(parts) == 2 && parts[1] == "pack.yaml"
}

func (cpc *ComponentPackCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	if definitionOnly {
		return cpc.IsDefinitionPath(path)
	}
	return true
}

func (cpc *ComponentPackCollection) GetItem(index int) Item {
	return (*cpc)[index]
}

func (cpc *ComponentPackCollection) Loop(iter GroupIterator) error {
	for index := range *cpc {
		err := iter(cpc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (cpc *ComponentPackCollection) Len() int {
	return len(*cpc)
}

func (cpc *ComponentPackCollection) GetItems() interface{} {
	return *cpc
}
