package meta

import (
	"errors"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	language "golang.org/x/text/language"
)

// FieldCollection slice
type TranslationCollection []Translation

// GetName function
func (tc *TranslationCollection) GetName() string {
	return "studio.translations"
}

// GetFields function
func (tc *TranslationCollection) GetFields() []string {
	return StandardGetFields(&Translation{})
}

// NewItem function
func (tc *TranslationCollection) NewItem() loadable.Item {
	*tc = append(*tc, Translation{})
	return &((*tc)[len(*tc)-1])
}

// NewBundleableItemWithKey function
func (tc *TranslationCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {

	keyArray := strings.Split(key, string(os.PathSeparator))
	keySize := len(keyArray)
	if keySize != 2 {
		return nil, errors.New("Invalid Translation Key: " + key)
	}

	namespace, name, err := ParseKey(keyArray[0])
	if err != nil {
		return nil, err
	}

	_, err = language.ParseBase(name)
	if err != nil {
		return nil, errors.New("Invalid ISO 639 Key: " + name)
	}
	*tc = append(*tc, Translation{
		Namespace: namespace,
		Language:  name,
	})
	return &(*tc)[len(*tc)-1], nil
}

// GetKeyFromPath function
func (tc *TranslationCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {

	languageKey, hasCondition := conditions["studio.language"]
	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 2 || parts[1] != "translation.yaml" {
		// Ignore this file
		return "", nil
	}

	_, name, err := ParseKey(parts[0])
	if err != nil {
		return "", err
	}

	if hasCondition {
		if name != languageKey {
			return "", nil
		}
	}

	return filepath.Join(parts[0], parts[1]), nil
}

// GetItem function
func (tc *TranslationCollection) GetItem(index int) loadable.Item {
	return &(*tc)[index]
}

// Loop function
func (tc *TranslationCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *tc {
		err := iter(tc.GetItem(index), index)
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (tc *TranslationCollection) Len() int {
	return len(*tc)
}

// GetItems function
func (tc *TranslationCollection) GetItems() interface{} {
	return *tc
}

// Slice function
func (tc *TranslationCollection) Slice(start int, end int) {

}
func (tc *TranslationCollection) Filter(iter func(item loadable.Item) (bool, error)) error {
	return nil
}
