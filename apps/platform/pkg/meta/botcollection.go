package meta

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
)

type BotCollection []*Bot

func (bc *BotCollection) GetName() string {
	return "uesio/studio.bot"
}

func (bc *BotCollection) GetBundleFolderName() string {
	return "bots"
}

func (bc *BotCollection) GetFields() []string {
	return StandardGetFields(&Bot{})
}

func (bc *BotCollection) NewItem() Item {
	return &Bot{}
}

func (bc *BotCollection) AddItem(item Item) {
	*bc = append(*bc, item.(*Bot))
}

func (bc *BotCollection) NewBundleableItemWithKey(key string) (BundleableItem, error) {
	return NewBot(key)
}

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

func (bc *BotCollection) GetItem(index int) Item {
	return (*bc)[index]
}

func (bc *BotCollection) Loop(iter GroupIterator) error {
	for index := range *bc {
		err := iter(bc.GetItem(index), strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (bc *BotCollection) Len() int {
	return len(*bc)
}

func (bc *BotCollection) GetItems() interface{} {
	return *bc
}
