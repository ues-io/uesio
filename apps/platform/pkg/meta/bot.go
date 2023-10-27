package meta

import (
	"errors"
	"fmt"
	"path"
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
	if IsBotTypeWithCollection(botType) {
		if (keyArraySize) != 3 {
			return nil, errors.New("Invalid Bot Key")
		}
		collectionKey = keyArray[1]
		botKey = keyArray[2]
	} else {
		collectionKey = ""
		botKey = keyArray[1]
		if (keyArraySize) > 3 {
			return nil, errors.New("Invalid Bot Key")
		}
		if (keyArraySize) == 3 {
			collectionKey = keyArray[1]
			botKey = keyArray[2]
		}
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

func NewRunActionBot(namespace, name string) *Bot {
	return NewBaseBot("RUNACTION", "", namespace, name)
}

func NewBaseBot(botType, collectionKey, namespace, name string) *Bot {
	return &Bot{
		CollectionRef:  collectionKey,
		Type:           botType,
		BundleableBase: NewBase(namespace, name),
	}
}

type IBotParamCondition interface {
	GetParam() string
	GetValue() interface{}
	GetType() string
}

type IBotParam interface {
	GetName() string
	GetConditions() []IBotParamCondition
}

type BotParamCondition struct {
	Param string      `yaml:"param" json:"param"`
	Value interface{} `yaml:"value" json:"value"`
	Type  string      `yaml:"type,omitempty" json:"type"`
}

func (b BotParamCondition) GetParam() string {
	return b.Param
}

func (b BotParamCondition) GetValue() interface{} {
	return b.Value
}

func (b BotParamCondition) GetType() string {
	return b.Type
}

type BotParamConditionResponse struct {
	Param string      `json:"param"`
	Value interface{} `json:"value"`
	Type  string      `json:"type"`
}

func (b BotParamConditionResponse) GetParam() string {
	return b.Param
}

func (b BotParamConditionResponse) GetValue() interface{} {
	return b.Value
}

func (b BotParamConditionResponse) GetType() string {
	return b.Type
}

type BotParam struct {
	Name         string              `yaml:"name" json:"name"`
	Prompt       string              `yaml:"prompt,omitempty" json:"prompt"`
	Type         string              `yaml:"type" json:"type"`
	MetadataType string              `yaml:"metadataType,omitempty" json:"metadatatype"`
	Grouping     string              `yaml:"grouping,omitempty" json:"grouping"`
	Required     bool                `yaml:"required" json:"required"`
	Default      string              `yaml:"default,omitempty" json:"default"`
	SelectList   string              `yaml:"selectList,omitempty" json:"selectList"`
	Choices      []string            `yaml:"choices,omitempty" json:"choices"`
	Conditions   []BotParamCondition `yaml:"conditions,omitempty" json:"conditions"`
}

func (b BotParam) GetName() string {
	return b.Name
}

func (b BotParam) GetConditions() []IBotParamCondition {
	conditions := make([]IBotParamCondition, len(b.Conditions))
	if len(b.Conditions) > 0 {
		for i, c := range b.Conditions {
			conditions[i] = c
		}
	}
	return conditions
}

type BotParamResponse struct {
	Name         string                      `json:"name"`
	Prompt       string                      `json:"prompt"`
	Type         string                      `json:"type"`
	MetadataType string                      `json:"metadataType,omitempty"`
	Grouping     string                      `json:"grouping"`
	Default      string                      `json:"default"`
	Required     bool                        `json:"required"`
	SelectList   string                      `json:"selectList"`
	Choices      []string                    `json:"choices"`
	Conditions   []BotParamConditionResponse `json:"conditions"`
	Collection   string                      `json:"collection"`
}

func (b BotParamResponse) GetName() string {
	return b.Name
}

func (b BotParamResponse) GetConditions() []IBotParamCondition {
	conditions := make([]IBotParamCondition, len(b.Conditions))
	if len(b.Conditions) > 0 {
		for i, c := range b.Conditions {
			conditions[i] = c
		}
	}
	return conditions
}

type BotParams []BotParam

type BotParamsResponse []BotParamResponse

type Bot struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	CollectionRef  string    `yaml:"collection,omitempty" json:"uesio/studio.collection"`
	Type           string    `yaml:"type" json:"uesio/studio.type"`
	Dialect        string    `yaml:"dialect" json:"uesio/studio.dialect"`
	Timeout        int       `yaml:"timeout" json:"uesio/studio.timeout"`
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
		"SAVE":       "save",
		"RUNACTION":  "runaction",
	}
}

func GetBotDialects() map[string]string {
	return map[string]string{
		"JAVASCRIPT": "javascript",
		"SYSTEM":     "system",
		"TYPESCRIPT": "typescript",
	}
}

func (b *Bot) GetBotFilePath() string {
	botFile := "bot.js"
	if b.Dialect == "TYPESCRIPT" {
		botFile = "bot.ts"
	}
	return path.Join(b.GetBasePath(), botFile)
}

func (b *Bot) GetGenerateBotTemplateFilePath(template string) string {
	return path.Join(b.GetBasePath(), "templates", template)
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
	if IsBotTypeWithCollection(botType) {
		return fmt.Sprintf("%s:%s:%s.%s", botType, b.CollectionRef, b.Namespace, b.Name)
	} else {
		return fmt.Sprintf("%s:%s.%s", botType, b.Namespace, b.Name)
	}
}

func (b *Bot) GetBasePath() string {
	botType := GetBotTypes()[b.Type]
	if !IsBotTypeWithCollection(botType) {
		return path.Join(botType, b.Name)
	}
	collectionNamespace, collectionName, _ := ParseKey(b.CollectionRef)
	nsUser, appName, _ := ParseNamespace(collectionNamespace)
	return path.Join(botType, nsUser, appName, collectionName, b.Name)
}

func (b *Bot) GetPath() string {
	return path.Join(b.GetBasePath(), "bot.yaml")
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

type BotExecutionError struct {
	Message string
}

func (e *BotExecutionError) Error() string {
	return e.Message
}

func NewBotExecutionError(message string) error {
	return &BotExecutionError{Message: message}
}

type BotAccessError struct {
	message string
}

func (e *BotAccessError) Error() string {
	return e.message
}

func NewBotAccessError(message string) error {
	return &BotAccessError{message}
}

type BotNotFoundError struct {
	message string
}

func (e *BotNotFoundError) Error() string {
	return e.message
}

func NewBotNotFoundError(message string) error {
	return &BotNotFoundError{message}
}

func IsParamRelevant(param IBotParam, paramValues map[string]interface{}) bool {
	conditions := param.GetConditions()
	if len(conditions) < 1 {
		return true
	}
	for _, condition := range conditions {
		value := paramValues[condition.GetParam()]
		conditionType := condition.GetType()
		if conditionType == "hasValue" || conditionType == "hasNoValue" {
			hasValue := value != nil && value != ""
			if conditionType == "hasValue" && !hasValue {
				return false
			} else if conditionType == "hasNoValue" && hasValue {
				return false
			}
		} else if value != condition.GetValue() {
			return false
		}
	}
	return true
}

// ValidateParams checks validates received a map of provided bot params
// against any bot parameter metadata defined for the Bot
func (b *Bot) ValidateParams(params map[string]interface{}) error {

	for _, param := range b.Params {
		// Ignore validations on Params which are not relevant due to conditions
		if !IsParamRelevant(param, params) {
			continue
		}
		paramValue := params[param.Name]
		// First check for requiredness
		if paramValue == nil || paramValue == "" {
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
		case "METADATANAME":
			ok := IsValidMetadataName(fmt.Sprintf("%v", paramValue))
			if !ok {
				return NewParamError("param failed metadata validation, no capital letters or special characters allowed", param.Name)
			}
		}
	}
	return nil
}
