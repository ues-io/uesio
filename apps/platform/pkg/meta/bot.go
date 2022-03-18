package meta

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/humandad/yaml"
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

	if keySize == 2 && botType == "GENERATOR" {
		namespace, name, err := ParseKey(keyArray[1])
		if err != nil {
			return nil, err
		}
		return NewGeneratorBot(namespace, name), nil
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

func NewGeneratorBot(namespace, name string) *Bot {
	return &Bot{
		Type:      "GENERATOR",
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

type BotParam struct {
	Name         string `yaml:"name" uesio:"uesio/studio.name" json:"name"`
	Prompt       string `yaml:"prompt" uesio:"uesio/studio.prompt" json:"prompt"`
	Type         string `yaml:"type" uesio:"uesio/studio.type" json:"type"`
	MetadataType string `yaml:"metadataType" uesio:"uesio/studio.metadatatype" json:"metadataType"`
	Grouping     string `yaml:"grouping" uesio:"uesio/studio.grouping" json:"grouping"`
	Default      string `yaml:"default" uesio:"uesio/studio.default" json:"default"`
}

// Bot struct
type Bot struct {
	ID            string            `yaml:"-" uesio:"uesio/core.id"`
	Name          string            `yaml:"name" uesio:"uesio/studio.name"`
	CollectionRef string            `yaml:"collection,omitempty" uesio:"uesio/studio.collection"`
	Namespace     string            `yaml:"-" uesio:"-"`
	Type          string            `yaml:"type" uesio:"uesio/studio.type"`
	Dialect       string            `yaml:"dialect" uesio:"uesio/studio.dialect"`
	Params        []BotParam        `yaml:"params" uesio:"uesio/studio.params"`
	Content       *UserFileMetadata `yaml:"-" uesio:"uesio/studio.content"`
	FileContents  string            `yaml:"-" uesio:"-"`
	Workspace     *Workspace        `yaml:"-" uesio:"uesio/studio.workspace"`
	CreatedBy     *User             `yaml:"-" uesio:"uesio/core.createdby"`
	Owner         *User             `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy     *User             `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt     int64             `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt     int64             `yaml:"-" uesio:"uesio/core.createdat"`
	itemMeta      *ItemMeta         `yaml:"-" uesio:"-"`
}

// GetBotTypes function
func GetBotTypes() map[string]string {
	return map[string]string{
		"BEFORESAVE": "beforesave",
		"AFTERSAVE":  "aftersave",
		"LISTENER":   "listener",
		"GENERATOR":  "generator",
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

func (b *Bot) GetGenerateBotTemplateFilePath(template string) string {
	return filepath.Join(b.GetKey(), "templates", template)
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

func (b *Bot) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s_%s_%s", workspace, b.CollectionRef, b.Type, b.Name)
}

// GetBundleGroup function
func (b *Bot) GetBundleGroup() BundleableGroup {
	var bc BotCollection
	return &bc
}

// GetKey function
func (b *Bot) GetKey() string {
	botType := GetBotTypes()[b.Type]
	if b.Type == "LISTENER" || b.Type == "GENERATOR" {
		return filepath.Join(botType, b.Namespace+"."+b.Name)
	}
	return filepath.Join(botType, b.CollectionRef, b.Namespace+"."+b.Name)
}

func (b *Bot) GetPath() string {
	botType := GetBotTypes()[b.Type]
	if b.Type == "LISTENER" || b.Type == "GENERATOR" {
		return filepath.Join(botType, b.Name, "bot.yaml")
	}
	return filepath.Join(botType, b.CollectionRef, b.Name, "bot.yaml")
}

// GetPermChecker function
func (b *Bot) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (b *Bot) SetField(fieldName string, value interface{}) error {
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
	b.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (b *Bot) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(b, iter)
}

// Len function
func (b *Bot) Len() int {
	return StandardItemLen(b)
}

// GetItemMeta function
func (b *Bot) GetItemMeta() *ItemMeta {
	return b.itemMeta
}

// SetItemMeta function
func (b *Bot) SetItemMeta(itemMeta *ItemMeta) {
	b.itemMeta = itemMeta
}

func (b *Bot) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, b.Name)
	if err != nil {
		return err
	}
	return node.Decode(b)
}
