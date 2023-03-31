package meta

import (
	"errors"
	"fmt"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

func NewBeforeSaveBot(namespace, name, collection string) *Bot {
	return NewBaseBot("BEFORESAVE", collection, namespace, name)
}

func NewAfterSaveBot(namespace, name, collection string) *Bot {
	return NewBaseBot("AFTERSAVE", collection, namespace, name)
}

func NewListenerBot(namespace, name string) *Bot {
	return NewBaseBot("LISTENER", "", namespace, name)
}

func NewGeneratorBot(namespace, name string) *Bot {
	return NewBaseBot("GENERATOR", "", namespace, name)
}

func NewRouteBot(namespace, name string) *Bot {
	return NewBaseBot("ROUTE", "", namespace, name)
}

func NewLoadBot(namespace, name string) *Bot {
	return NewBaseBot("LOAD", "", namespace, name)
}

func NewBaseBot(botType, collectionKey, namespace, name string) *Bot {
	return &Bot{
		CollectionRef:  collectionKey,
		Type:           botType,
		BundleableBase: NewBase(namespace, name),
	}
}

type BotParamCondition struct {
	Param string      `yaml:"param" json:"uesio/studio.param"`
	Value interface{} `yaml:"value" json:"uesio/studio.value"`
}

type BotParamConditionResponse struct {
	Param string      `json:"param"`
	Value interface{} `json:"value"`
}

type BotParam struct {
	Name         string              `yaml:"name" json:"uesio/studio.name"`
	Prompt       string              `yaml:"prompt" json:"uesio/studio.prompt"`
	Type         string              `yaml:"type" json:"uesio/studio.type"`
	MetadataType string              `yaml:"metadataType" json:"uesio/studio.metadatatype"`
	Grouping     string              `yaml:"grouping" json:"uesio/studio.grouping"`
	Default      string              `yaml:"default" json:"uesio/studio.default"`
	Choices      []string            `yaml:"choices" json:"uesio/studio.choices"`
	Conditions   []BotParamCondition `yaml:"conditions,omitempty" json:"uesio/studio.conditions"`
}

type BotParamResponse struct {
	Name         string                      `json:"name"`
	Prompt       string                      `json:"prompt"`
	Type         string                      `json:"type"`
	MetadataType string                      `json:"metadataType,omitempty"`
	Grouping     string                      `json:"grouping"`
	Default      string                      `json:"default"`
	Choices      []string                    `json:"choices"`
	Conditions   []BotParamConditionResponse `json:"conditions"`
	Collection   string                      `json:"collection"`
}

type BotParams []BotParam

type BotParamsResponse []BotParamResponse

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
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	CollectionRef  string    `yaml:"collection,omitempty" json:"uesio/studio.collection"`
	Type           string    `yaml:"type" json:"uesio/studio.type"`
	Dialect        string    `yaml:"dialect" json:"uesio/studio.dialect"`
	Params         BotParams `yaml:"params,omitempty" json:"uesio/studio.params"`
	FileContents   string    `yaml:"-" json:"-"`
}

type BotWrapper Bot

func GetBotTypes() map[string]string {
	return map[string]string{
		"BEFORESAVE": "beforesave",
		"AFTERSAVE":  "aftersave",
		"LISTENER":   "listener",
		"GENERATOR":  "generator",
		"LOAD":       "load",
		"ROUTE":      "route",
	}
}

func GetBotDialects() map[string]string {
	return map[string]string{
		"JAVASCRIPT": "javascript",
		"SYSTEM":     "system",
		"TYPESCRIPT": "typescript",
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
	botFile := "bot.js"
	if b.Dialect == "TYPESCRIPT" {
		botFile = "bot.ts"
	}
	return filepath.Join(b.GetBasePath(), botFile)
}

func (b *Bot) GetGenerateBotTemplateFilePath(template string) string {
	return filepath.Join(b.GetBasePath(), "templates", template)
}

func (b *Bot) GetCollectionName() string {
	return BOT_COLLECTION_NAME
}

func (b *Bot) GetBundleFolderName() string {
	return BOT_FOLDER_NAME
}

func (b *Bot) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s:%s:%s", workspace, b.CollectionRef, b.Type, b.Name)
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

func (b *Bot) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(b, fieldName, value)
}

func (b *Bot) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(b, fieldName)
}

func (b *Bot) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(b, iter)
}

func (b *Bot) Len() int {
	return StandardItemLen(b)
}

func (b *Bot) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, b.Name)
	if err != nil {
		return err
	}
	return node.Decode((*BotWrapper)(b))
}
