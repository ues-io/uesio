package meta

import (
	"os"
	"strconv"
	"strings"
)

type ComponentPackCollection []*ComponentPack

func (cpc *ComponentPackCollection) GetName() string {
	return "uesio/studio.componentpack"
}

func (cpc *ComponentPackCollection) GetBundleFolderName() string {
	return "componentpacks"
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

func (cpc *ComponentPackCollection) GetItemFromPath(path string) (BundleableItem, bool) {
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 2 || parts[1] != "pack.yaml" {
		// Ignore this file
		return nil, false
	}
	return &ComponentPack{Name: parts[0]}, true
}

func (cpc *ComponentPackCollection) FilterPath(path string, conditions BundleConditions) bool {
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
