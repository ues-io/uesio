package meta

import (
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

func (bc *BotCollection) GetItemFromPath(path string) BundleableItem {

	parts := strings.Split(path, string(os.PathSeparator))
	partLength := len(parts)
	botType := parts[0]

	if botType == "listener" || botType == "generator" {
		if partLength != 3 {
			return nil
		}
		return &Bot{
			Type:          strings.ToUpper(botType),
			Name:          parts[1],
			CollectionRef: "none",
		}
	}

	if botType == "beforesave" || botType == "aftersave" {
		if partLength != 6 {
			return nil
		}
		return &Bot{
			Type:          strings.ToUpper(botType),
			Name:          parts[4],
			CollectionRef: fmt.Sprintf("%s/%s.%s", parts[1], parts[2], parts[3]),
		}
	}
	return nil
}

func (bc *BotCollection) IsDefinitionPath(path string) bool {
	parts := strings.Split(path, string(os.PathSeparator))
	botType := parts[0]
	if botType == "listener" || botType == "generator" {
		return parts[2] == "bot.yaml"
	}
	if botType == "beforesave" || botType == "aftersave" {
		return parts[5] == "bot.yaml"
	}
	return false
}

func (bc *BotCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	collectionKey, hasCollection := conditions["uesio/studio.collection"]
	botTypeKey, hasType := GetBotTypes()[conditions["uesio/studio.type"]]
	parts := strings.Split(path, string(os.PathSeparator))
	partLength := len(parts)
	if partLength < 1 {
		return false
	}
	botType := parts[0]
	if botType == "" {
		return false
	}

	if hasType && botType != botTypeKey {
		return false
	}

	if botType == "listener" || botType == "generator" {
		isDefinition := parts[2] == "bot.yaml"
		return partLength == 3 && (isDefinition || !definitionOnly)
	}
	if botType == "beforesave" || botType == "aftersave" {
		if partLength != 6 {
			return false
		}
		isDefinition := parts[5] == "bot.yaml"
		if hasCollection {
			collectionNS, collectionName, err := ParseKey(collectionKey)
			if err != nil {
				return false
			}
			nsUser, nsApp, err := ParseNamespace(collectionNS)
			if err != nil {
				return false
			}
			if parts[1] != nsUser || parts[2] != nsApp || parts[3] != collectionName {
				return false
			}
		}
		return (isDefinition || !definitionOnly)
	}
	return false
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
