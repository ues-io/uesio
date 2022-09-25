package meta

import (
	"errors"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

func NewBot(key string) (*Bot, error) {
	keyArray := strings.Split(key, ":")
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
		CollectionRef: "_",
		Type:          "LISTENER",
		Namespace:     namespace,
		Name:          name,
	}
}

func NewGeneratorBot(namespace, name string) *Bot {
	return &Bot{
		CollectionRef: "_",
		Type:          "GENERATOR",
		Namespace:     namespace,
		Name:          name,
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

type BotParamCondition struct {
	Param string `yaml:"param" uesio:"uesio/studio.param" json:"param"`
	Value string `yaml:"value" uesio:"uesio/studio.value" json:"value"`
}

type BotParam struct {
	Name         string              `yaml:"name" uesio:"uesio/studio.name" json:"name"`
	Prompt       string              `yaml:"prompt" uesio:"uesio/studio.prompt" json:"prompt"`
	Type         string              `yaml:"type" uesio:"uesio/studio.type" json:"type"`
	MetadataType string              `yaml:"metadataType" uesio:"uesio/studio.metadatatype" json:"metadataType,omitempty"`
	Grouping     string              `yaml:"grouping" uesio:"uesio/studio.grouping" json:"grouping"`
	Default      string              `yaml:"default" uesio:"uesio/studio.default" json:"default"`
	Choices      []string            `yaml:"choices" uesio:"uesio/studio.choices" json:"choices"`
	Conditions   []BotParamCondition `yaml:"conditions,omitempty" uesio:"uesio/studio.conditions" json:"conditions"`
}

type BotParams []BotParam

func (bp *BotParams) UnmarshalYAML(node *yaml.Node) error {
	if *bp == nil {
		*bp = *(&[]BotParam{})
	}
	for i := range node.Content {
		if i%2 == 0 {

			var key string
			var value BotParam
			err := node.Content[i].Decode(&key)
			if err != nil {
				return err
			}
			err = node.Content[i+1].Decode(&value)
			if err != nil {
				return err
			}

			value.Name = key
			*bp = append(*bp, value)
		}
	}

	return nil
}

type Bot struct {
	ID            string            `yaml:"-" uesio:"uesio/core.id"`
	UniqueKey     string            `yaml:"-" uesio:"uesio/core.uniquekey"`
	Name          string            `yaml:"name" uesio:"uesio/studio.name"`
	CollectionRef string            `yaml:"collection,omitempty" uesio:"uesio/studio.collection"`
	Namespace     string            `yaml:"-" uesio:"-"`
	Type          string            `yaml:"type" uesio:"uesio/studio.type"`
	Dialect       string            `yaml:"dialect" uesio:"uesio/studio.dialect"`
	Params        BotParams         `yaml:"params,omitempty" uesio:"uesio/studio.params"`
	Content       *UserFileMetadata `yaml:"-" uesio:"uesio/studio.content"`
	FileContents  string            `yaml:"-" uesio:"-"`
	Workspace     *Workspace        `yaml:"-" uesio:"uesio/studio.workspace"`
	CreatedBy     *User             `yaml:"-" uesio:"uesio/core.createdby"`
	Owner         *User             `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy     *User             `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt     int64             `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt     int64             `yaml:"-" uesio:"uesio/core.createdat"`
	itemMeta      *ItemMeta         `yaml:"-" uesio:"-"`
	Public        bool              `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

type BotWrapper Bot

func GetBotTypes() map[string]string {
	return map[string]string{
		"BEFORESAVE": "beforesave",
		"AFTERSAVE":  "aftersave",
		"LISTENER":   "listener",
		"GENERATOR":  "generator",
	}
}

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
	return filepath.Join(b.GetBasePath(), "bot.js")
}

func (b *Bot) GetGenerateBotTemplateFilePath(template string) string {
	return filepath.Join(b.GetBasePath(), "templates", template)
}

func (b *Bot) GetCollectionName() string {
	return b.GetBundleGroup().GetName()
}

func (b *Bot) GetCollection() CollectionableGroup {
	var bc BotCollection
	return &bc
}

func (b *Bot) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s:%s:%s", workspace, b.CollectionRef, b.Type, b.Name)
}

func (b *Bot) GetBundleGroup() BundleableGroup {
	var bc BotCollection
	return &bc
}

func (b *Bot) GetKey() string {
	botType := GetBotTypes()[b.Type]
	if b.Type == "LISTENER" || b.Type == "GENERATOR" {
		return fmt.Sprintf("%s:%s.%s", botType, b.Namespace, b.Name)
	}
	return fmt.Sprintf("%s:%s:%s.%s", botType, b.CollectionRef, b.Namespace, b.Name)
}

func (b *Bot) GetBasePath() string {
	botType := GetBotTypes()[b.Type]
	if b.Type == "LISTENER" || b.Type == "GENERATOR" {
		return filepath.Join(botType, b.Name)
	}
	collectionNamespace, collectionName, _ := ParseKey(b.CollectionRef)
	nsUser, appName, _ := ParseNamespace(collectionNamespace)
	return filepath.Join(botType, nsUser, appName, collectionName, b.Name)
}

func (b *Bot) GetPath() string {
	return filepath.Join(b.GetBasePath(), "bot.yaml")
}

func (b *Bot) GetPermChecker() *PermissionSet {
	return nil
}

func (b *Bot) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(b, fieldName, value)
}

func (b *Bot) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(b, fieldName)
}

func (b *Bot) GetNamespace() string {
	return b.Namespace
}

func (b *Bot) SetNamespace(namespace string) {
	b.Namespace = namespace
}

func (b *Bot) SetModified(mod time.Time) {
	b.UpdatedAt = mod.UnixMilli()
}

func (b *Bot) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(b, iter)
}

func (b *Bot) Len() int {
	return StandardItemLen(b)
}

func (b *Bot) GetItemMeta() *ItemMeta {
	return b.itemMeta
}

func (b *Bot) SetItemMeta(itemMeta *ItemMeta) {
	b.itemMeta = itemMeta
}

func (b *Bot) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, b.Name)
	if err != nil {
		return err
	}
	return node.Decode((*BotWrapper)(b))
}

func (b *Bot) IsPublic() bool {
	return b.Public
}
