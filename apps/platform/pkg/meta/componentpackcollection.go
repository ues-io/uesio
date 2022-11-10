package meta

import (
	"errors"
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

func (cpc *ComponentPackCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Invalid ComponentPack Key: " + key)
	}
	return &ComponentPack{
		Namespace: namespace,
		Name:      name,
	}, nil
}

func (cpc *ComponentPackCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	if len(conditions) > 0 {
		return "", errors.New("Conditions not allowed for component packs")
	}
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 2 || parts[1] != "pack.yaml" {
		// Ignore this file
		return "", nil
	}
	return namespace + "." + parts[0], nil
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
