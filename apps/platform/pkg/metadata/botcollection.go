package metadata

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// BotCollection slice
type BotCollection []Bot

// GetName function
func (bc *BotCollection) GetName() string {
	return "bots"
}

// GetFields function
func (bc *BotCollection) GetFields() []string {
	return []string{"id", "name", "collection", "type", "dialect", "filecontents"}
}

// NewItem function
func (bc *BotCollection) NewItem(key string) (BundleableItem, error) {
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
func (bc *BotCollection) AddItem(item BundleableItem) {
	actual := *bc
	bot := item.(*Bot)
	actual = append(actual, *bot)
	*bc = actual
}

// UnMarshal function
func (bc *BotCollection) UnMarshal(data []map[string]interface{}) error {
	err := StandardDecoder(bc, data)
	if err != nil {
		return err
	}
	err = bc.Validate()
	if err != nil {
		return err
	}
	return nil
}

// Marshal function
func (bc *BotCollection) Marshal() ([]map[string]interface{}, error) {
	err := bc.Validate()
	if err != nil {
		return nil, err
	}
	return StandardEncoder(bc)
}

// Validate function
func (bc *BotCollection) Validate() error {
	// Validate required bots and types
	for _, bot := range *bc {
		// make sure bot type is valid
		_, ok := GetBotTypes()[bot.Type]
		if !ok {
			return errors.New("Invalid Bot Type: " + bot.Type)
		}
	}
	return nil
}

// GetItem function
func (bc *BotCollection) GetItem(index int) CollectionableItem {
	actual := *bc
	return &actual[index]
}
