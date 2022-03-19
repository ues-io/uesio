package meta

import (
	"os"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// FieldCollection slice
type ComponentVariantCollection []ComponentVariant

// GetName function
func (cvc *ComponentVariantCollection) GetName() string {
	return "uesio/studio.componentvariants"
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
	cv, err := NewComponentVariant(key)
	if err != nil {
		return nil, err
	}
	*cvc = append(*cvc, *cv)
	return &(*cvc)[len(*cvc)-1], nil
}

// GetKeyFromPath function
func (cvc *ComponentVariantCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	componentKey, hasComponent := conditions["studio.component"]
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 4 || !strings.HasSuffix(parts[3], ".yaml") {
		// Ignore this file
		return "", nil
	}
	if hasComponent {
		componentNS, componentName, err := ParseKey(componentKey)
		if err != nil {
			return "", err
		}
		nsUser, nsApp, err := ParseNamespace(componentNS)
		if err != nil {
			return "", err
		}
		if parts[0] != nsUser || parts[1] != nsApp || parts[2] != componentName {
			return "", nil
		}
	}
	cv := ComponentVariant{
		Component: componentKey,
		Namespace: namespace,
		Name:      strings.TrimSuffix(parts[3], ".yaml"),
	}
	return cv.GetKey(), nil
}

// GetItem function
func (cvc *ComponentVariantCollection) GetItem(index int) loadable.Item {
	return &(*cvc)[index]
}

// Loop function
func (cvc *ComponentVariantCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *cvc {
		err := iter(cvc.GetItem(index), strconv.Itoa(index))
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
	return *cvc
}
