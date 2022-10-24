package meta

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type ComponentVariantCollection []*ComponentVariant

func (cvc *ComponentVariantCollection) GetName() string {
	return "uesio/studio.componentvariant"
}

func (cvc *ComponentVariantCollection) GetBundleFolderName() string {
	return "componentvariants"
}

func (cvc *ComponentVariantCollection) GetFields() []string {
	return StandardGetFields(&ComponentVariant{})
}

func (cvc *ComponentVariantCollection) NewItem() Item {
	cv := &ComponentVariant{}
	*cvc = append(*cvc, cv)
	return cv
}

func (cvc *ComponentVariantCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	cv, err := NewComponentVariant(key)
	if err != nil {
		return nil, err
	}
	*cvc = append(*cvc, cv)
	return cv, nil
}

func (cvc *ComponentVariantCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	componentKey, hasComponent := conditions["uesio/studio.component"]
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
		Component: fmt.Sprintf("%s/%s.%s", parts[0], parts[1], parts[2]),
		Namespace: namespace,
		Name:      strings.TrimSuffix(parts[3], ".yaml"),
	}
	return cv.GetKey(), nil
}

func (cvc *ComponentVariantCollection) GetItem(index int) Item {
	return (*cvc)[index]
}

func (cvc *ComponentVariantCollection) Loop(iter GroupIterator) error {
	for index := range *cvc {
		err := iter(cvc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (cvc *ComponentVariantCollection) Len() int {
	return len(*cvc)
}

func (cvc *ComponentVariantCollection) GetItems() interface{} {
	return *cvc
}
