package meta

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/goutils"
)

type BotCollection []*Bot

var BOT_COLLECTION_NAME = "uesio/studio.bot"
var BOT_FOLDER_NAME = "bots"
var BOT_FIELDS = StandardGetFields(&Bot{})

func (bc *BotCollection) GetName() string {
	return BOT_COLLECTION_NAME
}

func (bc *BotCollection) GetBundleFolderName() string {
	return BOT_FOLDER_NAME
}

func (bc *BotCollection) GetFields() []string {
	return BOT_FIELDS
}

func (bc *BotCollection) NewItem() Item {
	return &Bot{}
}

func (bc *BotCollection) AddItem(item Item) error {
	*bc = append(*bc, item.(*Bot))
	return nil
}

func (bc *BotCollection) NewItemFromUniqueKey(uniqueKey string) Item {
	if uniqueKey == "" {
		return nil
	}
	parts := strings.Split(uniqueKey, ":")
	// "%s:%s:%s:%s", workspace, GetFullyQualifiedKey(b.CollectionRef, b.Namespace), b.Type, b.Name
	// e.g. zach/foo:dev:collectionKey:LISTENER:dec28
	return &Bot{
		BundleableBase: BundleableBase{
			Name:      parts[4],
			Namespace: parts[0],
			Workspace: &Workspace{
				Name: parts[1],
			},
		},
		CollectionRef: parts[2],
		Type:          parts[3],
	}
}

func (bc *BotCollection) GetItemFromPath(path, namespace string) BundleableItem {

	parts := strings.Split(path, "/")
	partLength := len(parts)
	botType := parts[0]

	if IsBotTypeWithCollection(botType) {
		if partLength != 6 {
			return nil
		}
		collectionKey := fmt.Sprintf("%s/%s.%s", parts[1], parts[2], parts[3])
		return NewBaseBot(strings.ToUpper(botType), collectionKey, namespace, parts[4])
	} else {
		if partLength != 3 {
			return nil
		}
		return NewBaseBot(strings.ToUpper(botType), "", namespace, parts[1])
	}
}

func (bc *BotCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewBot(key)
}

func IsBotTypeWithCollection(botType string) bool {
	return botType == "beforesave" || botType == "aftersave"
}

func (bc *BotCollection) IsDefinitionPath(path string) bool {
	parts := strings.Split(path, "/")
	botType := parts[0]
	if IsBotTypeWithCollection(botType) {
		return parts[5] == "bot.yaml"
	} else {
		return parts[2] == "bot.yaml"
	}
}

func isBotTypeMatch(botTypeFromPath string, requestedTypes interface{}) bool {
	requestedTypesSlice, ok := goutils.StringSliceValue(requestedTypes)
	if !ok {
		return false
	}
	foundMatch := false
	botTypes := GetBotTypes()
	for i := range requestedTypesSlice {
		requestedType := requestedTypesSlice[i]
		botTypeFileFolder, isValidType := botTypes[requestedType]
		if !isValidType {
			continue
		}
		if requestedType != "" && botTypeFileFolder == botTypeFromPath {
			foundMatch = true
		}
	}
	return foundMatch
}

func (bc *BotCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	parts := strings.Split(path, "/")
	partLength := len(parts)
	botType := parts[0]
	if botType == "" {
		return false
	}
	collectionConditionValue, hasCollectionCondition := conditions["uesio/studio.collection"]
	requestedTypeVal, hasTypeCondition := conditions["uesio/studio.type"]
	// If a specific set of Bot Types was requested, check that the type matches
	if hasTypeCondition && !isBotTypeMatch(botType, requestedTypeVal) {
		return false
	}
	if IsBotTypeWithCollection(botType) {
		if partLength != 6 {
			return false
		}
		isDefinition := parts[5] == "bot.yaml"
		// Early return --- if we only care about definition files, and it's not one,
		// then we don't need anymore filters, we are for sure done.
		if definitionOnly && !isDefinition {
			return false
		}
		// Only filter to make sure that the collection matches if needed
		if !hasCollectionCondition {
			return true
		}
		foundMatch := false
		metadataGroupKeys, ok := goutils.StringSliceValue(collectionConditionValue)
		// If the filter was bad, don't return a value
		if !ok {
			return false
		}
		// Iterate over the metadata groupings requested and see if we find a match
		for i := range metadataGroupKeys {
			groupNS, groupName, err := ParseKey(metadataGroupKeys[i])
			if err != nil {
				return false
			}
			nsUser, nsApp, err := ParseNamespace(groupNS)
			if err != nil {
				return false
			}
			if parts[1] == nsUser && parts[2] == nsApp && parts[3] == groupName {
				// We only need to find one match for the item to be returned from the filter
				foundMatch = true
				break
			}
		}
		return foundMatch

	} else {
		if partLength != 3 {
			return false
		}
		isDefinition := parts[2] == "bot.yaml"
		return partLength == 3 && (isDefinition || !definitionOnly)
	}
}

// GetTypescriptableItemConditions returns BundleConditions to allow filtering a group
// to only return those items for which
func (bc *BotCollection) GetTypescriptableItemConditions() BundleConditions {
	return BundleConditions{
		"uesio/studio.type": []string{
			"LISTENER",
			"ROUTE",
			"RUNACTION",
		},
	}
}

func (bc *BotCollection) Loop(iter GroupIterator) error {
	for index, b := range *bc {
		err := iter(b, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (bc *BotCollection) Len() int {
	return len(*bc)
}
