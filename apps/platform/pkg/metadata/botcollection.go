package metadata

import (
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// BotCollection slice
type BotCollection []Bot

// GetName function
func (bc *BotCollection) GetName() string {
	return "bots"
}

// GetFields function
func (bc *BotCollection) GetFields() []reqs.LoadRequestField {
	return StandardGetFields(bc)
}

// NewItem function
func (bc *BotCollection) NewItem() LoadableItem {
	return &Bot{}
}

// NewBundleableItem function
func (bc *BotCollection) NewBundleableItem() BundleableItem {
	return &Bot{}
}

// NewBundleableItemWithKey function
func (bc *BotCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewBot(key)
}

// GetKeyPrefix function
func (bc *BotCollection) GetKeyPrefix(conditions reqs.BundleConditions) string {
	collectionKey, hasCollection := conditions["uesio.collection"]
	botTypeKey, hasType := GetBotTypes()[conditions["uesio.type"]]
	if hasCollection && hasType {
		return collectionKey + "." + botTypeKey + "."
	}
	if hasType && botTypeKey == "listener" {
		return "listener."
	}
	return ""
}

// AddItem function
func (bc *BotCollection) AddItem(item LoadableItem) {
	*bc = append(*bc, *item.(*Bot))
}

// GetItem function
func (bc *BotCollection) GetItem(index int) LoadableItem {
	actual := *bc
	return &actual[index]
}

// Loop function
func (bc *BotCollection) Loop(iter func(item LoadableItem) error) error {
	for index := range *bc {
		err := iter(bc.GetItem(index))
		if err != nil {
			return err
		}
	}
	return nil
}

// Len function
func (bc *BotCollection) Len() int {
	return len(*bc)
}
