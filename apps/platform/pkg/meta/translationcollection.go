package meta

import (
	"errors"
	"os"
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

	_, err := language.ParseBase(key)
	if err != nil {
		return nil, errors.New("Invalid ISO 639 Key: " + key)
	}
	*tc = append(*tc, Translation{
		Language: key,
	})
	return &(*tc)[len(*tc)-1], nil
}

// GetKeyFromPath function
func (tc *TranslationCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {

	if conditions == nil {
		return StandardKeyFromPath(path, conditions)
	}

	if len(conditions) != 1 {
		return "", errors.New("Must specify language")
	}

	parts := strings.Split(path, string(os.PathSeparator))
	if len(parts) != 1 || !strings.HasSuffix(parts[0], ".yaml") {
		// Ignore this file
		return "", nil
	}

	requestedLanguage := conditions["studio.language"]
	language := strings.TrimSuffix(path, ".yaml")

	if requestedLanguage != language {
		// Ignore this file
		return "", nil
	}

	return language, nil

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
