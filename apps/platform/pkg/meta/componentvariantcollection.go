package meta

import (
	"errors"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// FieldCollection slice
type ComponentVariantCollection []ComponentVariant

// GetName function
func (cvc *ComponentVariantCollection) GetName() string {
	return "studio.componentvariants"
}

// GetFields function
func (cvc *ComponentVariantCollection) GetFields() []string {
	return StandardGetFields(&ComponentVariant{})
}

// NewItem function
func (cvc *ComponentVariantCollection) NewItem() loadable.Item {
	*cvc = append(*cvc, ComponentVariant{})
	return &((*cvc)[len(*cvc)-1])
}

// NewBundleableItemWithKey function
func (cvc *ComponentVariantCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	keyArray := strings.Split(key, string(os.PathSeparator))
	if len(keyArray) != 2 {
		return nil, errors.New("Invalid Variant Key: " + key)
	}
	namespace, name, err := ParseKey(keyArray[1])
	if err != nil {
		return nil, errors.New("Invalid Variant Key: " + key)
	}
	*cvc = append(*cvc, ComponentVariant{
		Component: keyArray[0],
		Namespace: namespace,
		Name:      name,
	})
	return &(*cvc)[len(*cvc)-1], nil
}

// GetKeyFromPath function
func (cvc *ComponentVariantCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	componentKey, hasComponent := conditions["studio.component"]
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 2 || !strings.HasSuffix(parts[1], ".yaml") {
		// Ignore this file
		return "", nil
	}
	if hasComponent {
		if parts[0] != componentKey {
			return "", nil
		}
	}
	return filepath.Join(parts[0], strings.TrimSuffix(parts[1], ".yaml")), nil
}

// GetItem function
func (cvc *ComponentVariantCollection) GetItem(index int) loadable.Item {
	return &(*cvc)[index]
}

// Loop function
func (cvc *ComponentVariantCollection) Loop(iter func(item loadable.Item) error) error {
	for index := range *cvc {
		err := iter(cvc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (cvc *ComponentVariantCollection) Len() int {
	return len(*cvc)
}

// GetItems function
func (cvc *ComponentVariantCollection) GetItems() interface{} {
	return cvc
}

// Slice function
func (cvc *ComponentVariantCollection) Slice(start int, end int) {

}
