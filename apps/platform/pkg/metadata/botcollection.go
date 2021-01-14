package metadata

import (
	"errors"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapters"
)

// BotCollection slice
type BotCollection []Bot

// GetName function
func (bc *BotCollection) GetName() string {
	return "bots"
}

// GetFields function
func (bc *BotCollection) GetFields() []adapters.LoadRequestField {
	return StandardGetFields(bc)
}

// NewItem function
func (bc *BotCollection) NewItem() adapters.LoadableItem {
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

// GetKeyFromPath function
func (bc *BotCollection) GetKeyFromPath(path string, conditions BundleConditions) (string, error) {
	collectionKey, hasCollection := conditions["uesio.collection"]
	botTypeKey, hasType := GetBotTypes()[conditions["uesio.type"]]
	parts := strings.Split(path, string(os.PathSeparator))
	partLength := len(parts)
	if partLength < 1 {
		return "", nil
	}
	botType := parts[0]
	if botType == "" {
		return "", nil
	}

	if botType == "listener" {
		if partLength != 3 || parts[2] != "bot.yaml" {
			return "", nil
		}
		if hasType && botType != botTypeKey {
			return "", nil
		}
		return filepath.Join(botType, parts[1]), nil
	}
	if botType == "beforesave" || botType == "aftersave" {
		if partLength != 4 || parts[3] != "bot.yaml" {
			return "", nil
		}
		if hasType && botType != botTypeKey {
			return "", nil
		}
		if hasCollection && parts[1] != collectionKey {
			return "", nil
		}
		return filepath.Join(botType, parts[1], parts[2]), nil
	}
	return "", errors.New("Bad bundle conditions for bot: " + path)
}

// AddItem function
func (bc *BotCollection) AddItem(item adapters.LoadableItem) {
	*bc = append(*bc, *item.(*Bot))
}

// GetItem function
func (bc *BotCollection) GetItem(index int) adapters.LoadableItem {
	actual := *bc
	return &actual[index]
}

// Loop function
func (bc *BotCollection) Loop(iter func(item adapters.LoadableItem) error) error {
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

// GetItems function
func (bc *BotCollection) GetItems() interface{} {
	return bc
}
