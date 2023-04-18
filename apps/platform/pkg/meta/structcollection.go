package meta

import (
	"os"
	"strconv"
	"strings"
)

type StructCollection []*Struct

var STRUCT_COLLECTION_NAME = "uesio/studio.struct"
var STRUCT_FOLDER_NAME = "structs"
var STRUCT_FIELDS = StandardGetFields(&Struct{})

func (sc *StructCollection) GetName() string {
	return STRUCT_COLLECTION_NAME
}

func (sc *StructCollection) GetBundleFolderName() string {
	return STRUCT_FOLDER_NAME
}

func (sc *StructCollection) GetFields() []string {
	return STRUCT_FIELDS
}

func (sc *StructCollection) NewItem() Item {
	return &Struct{}
}

func (sc *StructCollection) AddItem(item Item) error {
	*sc = append(*sc, item.(*Struct))
	return nil
}

func (sc *StructCollection) GetItemFromPath(path, namespace string) BundleableItem {
	parts := strings.Split(path, string(os.PathSeparator))
	return NewBaseStruct(namespace, parts[0])
}

func (sc *StructCollection) IsDefinitionPath(path string) bool {
	parts := strings.Split(path, string(os.PathSeparator))
	return len(parts) == 2 && parts[1] == "struct.yaml"
}

func (sc *StructCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	if definitionOnly {
		return sc.IsDefinitionPath(path)
	}
	return true
}

func (sc *StructCollection) Loop(iter GroupIterator) error {
	for index, f := range *sc {
		err := iter(f, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (sc *StructCollection) Len() int {
	return len(*sc)
}
