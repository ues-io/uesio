package meta

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

// BotCollection slice
type BotCollection []Bot

// GetName function
func (bc *BotCollection) GetName() string {
	return "uesio/studio.bot"
}

// GetBundleFolderName function
func (bc *BotCollection) GetBundleFolderName() string {
	return "bots"
}

// GetFields function
func (bc *BotCollection) GetFields() []string {
	return StandardGetFields(&Bot{})
}

// NewItem function
func (bc *BotCollection) NewItem() loadable.Item {
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
func (bc *BotCollection) GetKeyFromPath(path string, namespace string, conditions BundleConditions) (string, error) {
	collectionKey, hasCollection := conditions["uesio/studio.collection"]
	botTypeKey, hasType := GetBotTypes()[conditions["uesio/studio.type"]]
	parts := strings.Split(path, string(os.PathSeparator))
	partLength := len(parts)
	if partLength < 1 {
		return "", nil
	}
	botType := parts[0]
	if botType == "" {
		return "", nil
	}

	if botType == "listener" || botType == "generator" {
		if partLength != 3 || parts[2] != "bot.yaml" {
			return "", nil
		}
		if hasType && botType != botTypeKey {
			return "", nil
		}
		bot := Bot{
			Type:      strings.ToUpper(botType),
			Namespace: namespace,
			Name:      parts[1],
		}
		return bot.GetKey(), nil
	}
	if botType == "beforesave" || botType == "aftersave" {
		if partLength != 6 || parts[5] != "bot.yaml" {
			return "", nil
		}
		if hasType && botType != botTypeKey {
			return "", nil
		}
		if hasCollection {
			collectionNS, collectionName, err := ParseKey(collectionKey)
			if err != nil {
				return "", err
			}
			nsUser, nsApp, err := ParseNamespace(collectionNS)
			if err != nil {
				return "", err
			}
			if parts[1] != nsUser || parts[2] != nsApp || parts[3] != collectionName {
				return "", nil
			}
		}
		bot := Bot{
			Type:          strings.ToUpper(botType),
			Namespace:     namespace,
			Name:          parts[4],
			CollectionRef: fmt.Sprintf("%s/%s.%s", parts[1], parts[2], parts[3]),
		}
		return bot.GetKey(), nil
	}
	return "", errors.New("Bad bundle conditions for bot: " + path)
}

// GetItem function
func (bc *BotCollection) GetItem(index int) loadable.Item {
	return &(*bc)[index]
}

// Loop function
func (bc *BotCollection) Loop(iter loadable.GroupIterator) error {
	for index := range *bc {
		err := iter(bc.GetItem(index), strconv.Itoa(index))
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
	return *bc
}
