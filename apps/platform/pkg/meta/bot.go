package meta

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
)

// NewBot function
func NewBot(key string) (*Bot, error) {
	keyArray := strings.Split(key, string(os.PathSeparator))
	keySize := len(keyArray)
	if keySize != 3 && keySize != 2 {
		return nil, errors.New("Invalid Bot Key: " + key)
	}
	botType, err := getBotTypeTypeKeyPart(keyArray[0])
	if err != nil {
		return nil, err
	}
	if keySize == 3 && botType == "AFTERSAVE" || botType == "BEFORESAVE" {
		namespace, name, err := ParseKey(keyArray[2])
		if err != nil {
			return nil, err
		}
		return NewTriggerBot(botType, keyArray[1], namespace, name), nil
	}

	if keySize == 2 && botType == "LISTENER" {
		namespace, name, err := ParseKey(keyArray[1])
		if err != nil {
			return nil, err
		}
		return NewListenerBot(namespace, name), nil
	}

	return nil, errors.New("Invalid Bot Key: " + key)
}

func NewListenerBot(namespace, name string) *Bot {
	return &Bot{
		Type:      "LISTENER",
		Namespace: namespace,
		Name:      name,
	}
}

func NewTriggerBot(botType, collectionKey, namespace, name string) *Bot {
	return &Bot{
		CollectionRef: collectionKey,
		Type:          botType,
		Namespace:     namespace,
		Name:          name,
	}
}

// Bot struct
type Bot struct {
	ID            string `yaml:"-" uesio:"uesio.id"`
	Name          string `yaml:"name" uesio:"uesio.name"`
	CollectionRef string `yaml:"collection,omitempty" uesio:"uesio.collection"`
	Namespace     string `yaml:"-" uesio:"-"`
	Type          string `yaml:"type" uesio:"uesio.type"`
	Dialect       string `yaml:"dialect" uesio:"uesio.dialect"`
	Content       string `yaml:"-" uesio:"uesio.content"`
	FileContents  string `yaml:"-" uesio:"-"`
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

func (b *Bot) GetBotFilePath() string {
	return filepath.Join(b.GetKey(), "bot.js")
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
func (b *Bot) GetConditions() map[string]string {
	return map[string]string{
		"uesio.name":       b.Name,
		"uesio.collection": b.CollectionRef,
		"uesio.type":       b.Type,
	}
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
		return filepath.Join(botType, b.Namespace+"."+b.Name)
	}
	return filepath.Join(botType, b.CollectionRef, b.Namespace+"."+b.Name)
}

func (b *Bot) GetPath() string {
	return filepath.Join(b.GetKey(), "bot.yaml")
}

// GetPermChecker function
func (b *Bot) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (b *Bot) SetField(fieldName string, value interface{}) error {
	if fieldName == "uesio.content__FILEDATA" {
		return nil
	}
	return StandardFieldSet(b, fieldName, value)
}

// GetField function
func (b *Bot) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(b, fieldName)
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
