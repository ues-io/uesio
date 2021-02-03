package meta

import (
	"errors"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// BotCollection slice
type BotCollection []Bot

// GetName function
func (bc *BotCollection) GetName() string {
	return "bots"
}

// GetFields function
func (bc *BotCollection) GetFields() []string {
	return StandardGetFields(&Bot{})
}

// NewItem function
func (bc *BotCollection) NewItem() loadable.Item {
	// These are different from most of the New Item Funcions
	// Because I'm testing an approach that does less memory allocations
	*bc = append(*bc, Bot{})
	return &(*bc)[len(*bc)-1]
}

// NewBundleableItem function
func (bc *BotCollection) NewBundleableItem() BundleableItem {
	// These are different from most of the New Item Funcions
	// Because I'm testing an approach that does less memory allocations
	*bc = append(*bc, Bot{})
	return &(*bc)[len(*bc)-1]
}

// NewBundleableItemWithKey function
func (bc *BotCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	bot, err := NewBot(key)
	if err != nil {
		return nil, err
	}
	*bc = append(*bc, *bot)
	return &(*bc)[len(*bc)-1], nil
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
func (bc *BotCollection) AddItem(item loadable.Item) {
	// These are different from most of the New Item Funcions
	// Because I'm testing an approach that does less memory allocations
	//*bc = append(*bc, *item.(*Bot))
}

// GetItem function
func (bc *BotCollection) GetItem(index int) loadable.Item {
	return &(*bc)[index]
}

// Loop function
func (bc *BotCollection) Loop(iter func(item loadable.Item) error) error {
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

// Slice function
func (bc *BotCollection) Slice(start int, end int) {

}
