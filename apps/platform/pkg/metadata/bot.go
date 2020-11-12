package metadata

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// NewBot function
func NewBot(key string) (*Bot, error) {
	keyArray := strings.Split(key, ".")
	keySize := len(keyArray)
	if keySize != 5 && keySize != 3 {
		return nil, errors.New("Invalid Bot Key: " + key)
	}
	if keySize == 5 {
		return newTriggerBot(keyArray)
	}

	return newListenerBot(keyArray)
}

func newListenerBot(keyArray []string) (*Bot, error) {
	botType, err := getBotTypeTypeKeyPart(keyArray[0])
	if err != nil {
		return nil, err
	}
	return &Bot{
		Type:      botType,
		Namespace: keyArray[1],
		Name:      keyArray[2],
	}, nil
}

func newTriggerBot(keyArray []string) (*Bot, error) {
	botType, err := getBotTypeTypeKeyPart(keyArray[2])
	if err != nil {
		return nil, err
	}
	return &Bot{
		CollectionRef: keyArray[0] + "." + keyArray[1],
		Type:          botType,
		Namespace:     keyArray[3],
		Name:          keyArray[4],
	}, nil
}

// Bot struct
type Bot struct {
	Name          string `yaml:"name" uesio:"uesio.name"`
	CollectionRef string `yaml:"collection" uesio:"uesio.collection"`
	Namespace     string `yaml:"namespace" uesio:"-"`
	Type          string `yaml:"type" uesio:"uesio.type"`
	Dialect       string `yaml:"dialect" uesio:"uesio.dialect"`
	FileName      string `yaml:"fileName" uesio:"-"`
	FileContents  string `yaml:"-" uesio:"uesio.filecontents"`
	Workspace     string `yaml:"-" uesio:"uesio.workspaceid"`
}

// GetBotTypes function
func GetBotTypes() map[string]string {
	return map[string]string{
		"BEFORESAVE": "beforesave",
		"AFTERSAVE":  "aftersave",
		"LISTENER":   "listener",
	}
}

// GetBotDialects function
func GetBotDialects() map[string]string {
	return map[string]string{
		"JAVASCRIPT": "javascript",
	}
}

func getBotTypeTypeKeyPart(typeKey string) (string, error) {
	for botType, key := range GetBotTypes() {
		if key == typeKey {
			return botType, nil
		}
	}
	return "", errors.New("Bad Type Key for Bot: " + typeKey)
}

// GetCollectionName function
func (b *Bot) GetCollectionName() string {
	return b.GetBundleGroup().GetName()
}

// GetCollection function
func (b *Bot) GetCollection() CollectionableGroup {
	var bc BotCollection
	return &bc
}

// GetConditions function
func (b *Bot) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: b.Name,
		},
		{
			Field: "uesio.collection",
			Value: b.CollectionRef,
		},
		{
			Field: "uesio.type",
			Value: b.Type,
		},
	}, nil
}

// GetBundleGroup function
func (b *Bot) GetBundleGroup() BundleableGroup {
	var bc BotCollection
	return &bc
}

// GetKey function
func (b *Bot) GetKey() string {
	botType := GetBotTypes()[b.Type]
	if b.Type == "LISTENER" {
		return botType + "." + b.Namespace + "." + b.Name
	}
	return b.CollectionRef + "." + botType + "." + b.Namespace + "." + b.Name
}

// GetPermChecker function
func (b *Bot) GetPermChecker() *PermissionSet {
	return nil
}

// GetNamespace function
func (b *Bot) GetNamespace() string {
	return b.Namespace
}

// SetNamespace function
func (b *Bot) SetNamespace(namespace string) {
	b.Namespace = namespace
}

// SetWorkspace function
func (b *Bot) SetWorkspace(workspace string) {
	b.Workspace = workspace
}
