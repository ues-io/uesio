package meta

import (
	"strconv"
	"strings"

	"golang.org/x/text/language"
)

type TranslationCollection []*Translation

var TRANSLATION_COLLECTION_NAME = "uesio/studio.translation"
var TRANSLATION_FOLDER_NAME = "translations"

// We have to hardcode these fields because translations don't have a uesio/studio.name
// field that we want to query. If we used the StandardGetFields (like the other metadata items)
// it would try to query for a name field that does not exist.
var TRANSLATION_FIELDS = []string{"uesio/studio.labels", "uesio/studio.language"}

func (tc *TranslationCollection) GetName() string {
	return TRANSLATION_COLLECTION_NAME
}

func (tc *TranslationCollection) GetBundleFolderName() string {
	return TRANSLATION_FOLDER_NAME
}

func (tc *TranslationCollection) GetFields() []string {
	return TRANSLATION_FIELDS
}

func (tc *TranslationCollection) NewItem() Item {
	return &Translation{}
}

func (tc *TranslationCollection) AddItem(item Item) {
	*tc = append(*tc, item.(*Translation))
}

func (tc *TranslationCollection) GetItemFromPath(path, namespace string) BundleableItem {

	lang := strings.TrimSuffix(path, ".yaml")

	_, err := language.ParseBase(lang)
	if err != nil {
		return nil
	}

	return NewBaseTranslation(namespace, lang)

}

func (tc *TranslationCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	if conditions == nil {
		return StandardPathFilter(path)
	}
	if len(conditions) != 1 {
		return false
	}

	requestedLanguage := conditions["uesio/studio.language"]
	language := strings.TrimSuffix(path, ".yaml")

	if requestedLanguage != language {
		// Ignore this file
		return false
	}
	return true
}

func (tc *TranslationCollection) Loop(iter GroupIterator) error {
	for index, t := range *tc {
		err := iter(t, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (tc *TranslationCollection) Len() int {
	return len(*tc)
}
