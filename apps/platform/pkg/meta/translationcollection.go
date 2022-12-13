package meta

import (
	"strconv"
)

type TranslationCollection []*Translation

func (tc *TranslationCollection) GetName() string {
	return "uesio/studio.translation"
}

func (tc *TranslationCollection) GetBundleFolderName() string {
	return "translations"
}

func (tc *TranslationCollection) GetFields() []string {
	return StandardGetFields(&Translation{})
}

func (tc *TranslationCollection) NewItem() Item {
	return &Translation{}
}

func (tc *TranslationCollection) AddItem(item Item) {
	*tc = append(*tc, item.(*Translation))
}

func (tc *TranslationCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewTranslation(key)
}

func (tc *TranslationCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	return StandardKeyFromPath(path, namespace, conditions)
}

func (tc *TranslationCollection) GetItem(index int) Item {
	return (*tc)[index]
}

func (tc *TranslationCollection) Loop(iter GroupIterator) error {
	for index := range *tc {
		err := iter(tc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (tc *TranslationCollection) Len() int {
	return len(*tc)
}

func (tc *TranslationCollection) GetItems() interface{} {
	return *tc
}
