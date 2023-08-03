package meta

import (
	"errors"
	"fmt"
	"path/filepath"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

func NewBot(key string) (*Bot, error) {
	keyArray := strings.Split(key, ":")
	keyArraySize := len(keyArray)
	if (keyArraySize) < 1 {
		return nil, errors.New("Invalid Bot Key")
	}
	botType := keyArray[0]
	var collectionKey, botKey string
	switch botType {
	case "LISTENER", "GENERATOR":
		collectionKey = ""
		botKey = keyArray[1]
		if (keyArraySize) > 3 {
			return nil, errors.New("Invalid Bot Key")
		}
		if (keyArraySize) == 3 {
			collectionKey = keyArray[1]
			botKey = keyArray[2]
		}
	default:
		if (keyArraySize) != 3 {
			return nil, errors.New("Invalid Bot Key")
		}
		collectionKey = keyArray[1]
		botKey = keyArray[2]
	}
	namespace, name, err := ParseKey(botKey)
	if err != nil {
		return nil, err
	}
	return NewBaseBot(botType, collectionKey, namespace, name), nil
}

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

func NewSaveBot(namespace, name string) *Bot {
	return NewBaseBot("SAVE", "", namespace, name)
}

func NewBaseBot(botType, collectionKey, namespace, name string) *Bot {
	return &Bot{
		CollectionRef:  collectionKey,
		Type:           botType,
		BundleableBase: NewBase(namespace, name),
	}
}

type BotParamCondition struct {
	Param string      `yaml:"param" json:"param"`
	Value interface{} `yaml:"value" json:"value"`
	Type  string      `yaml:"type,omitempty" json:"type"`
}

type BotParamConditionResponse struct {
	Param string      `json:"param"`
	Value interface{} `json:"value"`
	Type  string      `json:"type"`
}

type BotParam struct {
	Name         string              `yaml:"name" json:"name"`
	Prompt       string              `yaml:"prompt,omitempty" json:"prompt"`
	Type         string              `yaml:"type" json:"type"`
	MetadataType string              `yaml:"metadataType,omitempty" json:"metadatatype"`
	Grouping     string              `yaml:"grouping,omitempty" json:"grouping"`
	Required     bool                `yaml:"required" json:"required"`
	Default      string              `yaml:"default,omitempty" json:"default"`
	Choices      []string            `yaml:"choices,omitempty" json:"choices"`
	Conditions   []BotParamCondition `yaml:"conditions,omitempty" json:"conditions"`
}

type BotParamResponse struct {
	Name         string                      `json:"name"`
	Prompt       string                      `json:"prompt"`
	Type         string                      `json:"type"`
	MetadataType string                      `json:"metadataType,omitempty"`
	Grouping     string                      `json:"grouping"`
	Default      string                      `json:"default"`
	Required     bool                        `json:"required"`
	Choices      []string                    `json:"choices"`
	Conditions   []BotParamConditionResponse `json:"conditions"`
	Collection   string                      `json:"collection"`
}

type BotParams []BotParam

type BotParamsResponse []BotParamResponse

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

type BotParamValidationError struct {
	Message string
	Param   string
}

func (e *BotParamValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Message, e.Param)
}

func NewParamError(message string, param string) error {
	return &BotParamValidationError{Param: param, Message: message}
}

// ValidateParams checks validates received a map of provided bot params
// agaisnt any bot parameter metadata defined for the Bot
func (b *Bot) ValidateParams(params map[string]interface{}) error {

	for _, param := range b.Params {
		paramValue := params[param.Name]
		// First check for requiredness
		if paramValue == nil {
			if param.Required {
				return NewParamError("missing required param", param.Name)
			} else {
				// Don't bother performing any further validation if the param is not provided
				// and is not required
				continue
			}
		}
		// Next do type-specific validation
		switch param.Type {
		case "NUMBER":
			// Cast to the corresponding type
			_, ok := paramValue.(float64)
			if !ok {
				return NewParamError("could not convert param to number", param.Name)
			}
		case "CHECKBOX":
			// Cast to the corresponding type
			if _, err := strconv.ParseBool(paramValue.(string)); err != nil {
				return NewParamError("param value must either be 'true' or 'false'", param.Name)
			}
		}
	}
	return nil
}
