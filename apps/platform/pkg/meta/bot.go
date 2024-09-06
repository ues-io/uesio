package meta

import (
	"errors"
	"fmt"
	"path"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func NewBot(key string) (*Bot, error) {
	keyArray := strings.Split(key, ":")
	keyArraySize := len(keyArray)
	if (keyArraySize) < 2 {
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
	return NewBaseBot(strings.ToUpper(botType), collectionKey, namespace, name), nil
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
	GetValues() []interface{}
	GetOperator() string
	GetType() string
}

type IBotParam interface {
	GetName() string
	GetConditions() []IBotParamCondition
}

type BotParamCondition struct {
	Param    string        `yaml:"param" json:"param"`
	Value    interface{}   `yaml:"value,omitempty" json:"value"`
	Values   []interface{} `yaml:"values,omitempty" json:"values"`
	Type     string        `yaml:"type,omitempty" json:"type"`
	Operator string        `yaml:"operator,omitempty" json:"operator"`
}

func (b BotParamCondition) GetParam() string {
	return b.Param
}

func (b BotParamCondition) GetValue() interface{} {
	return b.Value
}

func (b BotParamCondition) GetValues() []interface{} {
	return b.Values
}

func (b BotParamCondition) GetType() string {
	return b.Type
}

func (b BotParamCondition) GetOperator() string {
	return b.Operator
}

type BotParamConditionResponse struct {
	Param    string        `json:"param"`
	Value    interface{}   `json:"value"`
	Values   []interface{} `json:"values"`
	Type     string        `json:"type"`
	Operator string        `json:"operator"`
}

func (b BotParamConditionResponse) GetParam() string {
	return b.Param
}

func (b BotParamConditionResponse) GetValue() interface{} {
	return b.Value
}

func (b BotParamConditionResponse) GetValues() []interface{} {
	return b.Values
}

func (b BotParamConditionResponse) GetOperator() string {
	return b.Operator
}

func (b BotParamConditionResponse) GetType() string {
	return b.Type
}

type BotParam struct {
	Name         string              `yaml:"name" json:"name"`
	Label        string              `yaml:"label,omitempty" json:"label"`
	Prompt       string              `yaml:"prompt,omitempty" json:"prompt"`
	Type         string              `yaml:"type" json:"type"`
	MetadataType string              `yaml:"metadataType,omitempty" json:"metadatatype"`
	Grouping     string              `yaml:"grouping,omitempty" json:"grouping"`
	Required     bool                `yaml:"required" json:"required"`
	Default      string              `yaml:"default,omitempty" json:"default"`
	SelectList   string              `yaml:"selectList,omitempty" json:"selectList"`
	DisplayAs    string              `yaml:"displayAs,omitempty" json:"displayAs"`
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
	Label        string                      `json:"label,omitempty"`
	Prompt       string                      `json:"prompt,omitempty"`
	Type         string                      `json:"type"`
	MetadataType string                      `json:"metadataType,omitempty"`
	Grouping     string                      `json:"grouping,omitempty"`
	Default      string                      `json:"default,omitempty"`
	Required     bool                        `json:"required"`
	DisplayAs    string                      `json:"displayAs"`
	SelectList   string                      `json:"selectList,omitempty"`
	Choices      []string                    `json:"choices,omitempty"`
	Conditions   []BotParamConditionResponse `json:"conditions,omitempty"`
	Collection   string                      `json:"collection,omitempty"`
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
	Definition     *YAMLDef  `yaml:"definition,omitempty" json:"uesio/studio.definition"`
	Timeout        int       `yaml:"timeout,omitempty" json:"uesio/studio.timeout"`
	Params         BotParams `yaml:"params,omitempty" json:"uesio/studio.params"`
	Tags           []string  `yaml:"tags,omitempty" json:"uesio/studio.tags"`
	Description    string    `yaml:"description,omitempty" json:"uesio/studio.description"`
	FileContents   string    `yaml:"-" json:"-"`
}

type BotWrapper Bot

var botTypes = map[string]string{
	"BEFORESAVE": "beforesave",
	"AFTERSAVE":  "aftersave",
	"LISTENER":   "listener",
	"GENERATOR":  "generator",
	"LOAD":       "load",
	"ROUTE":      "route",
	"SAVE":       "save",
	"RUNACTION":  "runaction",
}

func GetBotTypes() map[string]string {
	return botTypes
}

func GetBotDialects() map[string]string {
	return map[string]string{
		"JAVASCRIPT":  "javascript",
		"SYSTEM":      "system",
		"TYPESCRIPT":  "typescript",
		"DECLARATIVE": "declarative",
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

func (b *Bot) GetCollection() CollectionableGroup {
	return &BotCollection{}
}

func (b *Bot) GetBundleFolderName() string {
	return BOT_FOLDER_NAME
}

func (b *Bot) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s:%s:%s", workspace, GetFullyQualifiedKey(b.CollectionRef, b.Namespace), b.Type, b.Name)
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
	if err := validateNodeName(node, b.Name); err != nil {
		return err
	}
	if err := node.Decode((*BotWrapper)(b)); err != nil {
		return err
	}
	b.CollectionRef = GetFullyQualifiedKey(b.CollectionRef, b.Namespace)
	if b.Params != nil {
		for i := range b.Params {
			param := b.Params[i]
			if param.SelectList != "" {
				b.Params[i].SelectList = GetFullyQualifiedKey(b.Params[i].SelectList, b.Namespace)
			}
		}
	}
	return nil
}

func (b *Bot) MarshalYAML() (interface{}, error) {
	b.CollectionRef = GetLocalizedKey(b.CollectionRef, b.Namespace)
	if b.Params != nil {
		for i := range b.Params {
			param := b.Params[i]
			if param.SelectList != "" {
				b.Params[i].SelectList = GetLocalizedKey(b.Params[i].SelectList, b.Namespace)
			}
		}
	}
	return (*BotWrapper)(b), nil
}

func isMultiValueOperator(operator string) bool {
	return operator == "IN" || operator == "NOT_IN"
}

func IsParamRelevant(param IBotParam, paramValues map[string]interface{}) bool {
	conditions := param.GetConditions()
	if len(conditions) < 1 {
		return true
	}
	for _, condition := range conditions {
		value := paramValues[condition.GetParam()]
		conditionType := condition.GetType()
		operator := condition.GetOperator()
		if conditionType == "hasValue" || conditionType == "hasNoValue" {
			hasValue := value != nil && value != ""
			if conditionType == "hasValue" && !hasValue {
				return false
			} else if conditionType == "hasNoValue" && hasValue {
				return false
			}
		} else {
			if isMultiValueOperator(operator) && len(condition.GetValues()) > 0 {
				valueIsOneOfValues := false
				for _, v := range condition.GetValues() {
					if v == value {
						valueIsOneOfValues = true
						break
					}
				}
				if operator == "NOT_IN" {
					return !valueIsOneOfValues
				} else {
					return valueIsOneOfValues
				}
			} else {
				valueMatches := value == condition.GetValue()
				if operator == "NOT_EQUALS" {
					return !valueMatches
				} else {
					return valueMatches
				}
			}
		}
	}
	return true
}

func ValidateParams(params BotParams, paramValues map[string]interface{}, bundleLoader BundleLoader) error {
	for _, param := range params {

		// Ignore validations on Params which are not relevant due to conditions
		if !IsParamRelevant(param, paramValues) {
			continue
		}
		paramValue := paramValues[param.Name]
		// First check for requiredness
		if paramValue == nil || paramValue == "" {
			if param.Required {
				return exceptions.NewInvalidParamException("missing required param", param.Name)
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
			isNumeric := isNumericType(paramValue)
			if !isNumeric {
				// try to convert if to a Number if it is a string
				if strVal, isString := paramValue.(string); isString {
					if float64Val, err := strconv.ParseFloat(strVal, 64); err == nil {
						isNumeric = true
						paramValues[param.Name] = float64Val
					}
				}
			}
			if !isNumeric {
				return exceptions.NewInvalidParamException("could not convert param to number", param.Name)
			}
		case "CHECKBOX":
			// Cast to the corresponding type
			_, ok := paramValue.(bool)
			if ok {
				return nil
			}
			if _, err := strconv.ParseBool(paramValue.(string)); err != nil {
				return exceptions.NewInvalidParamException("param value must either be 'true' or 'false'", param.Name)
			}
		case "SELECT":
			// If there is no Select List defined, then the parameter cannot be validated
			selectList, err := NewSelectList(param.SelectList)
			if err != nil {
				return exceptions.NewInvalidParamException("no Select List provided for SELECT parameter", param.Name)
			}
			// Ensure that the value provided is one of the valid options
			stringValue, isString := paramValue.(string)
			if !isString {
				return exceptions.NewInvalidParamException("param value must be a string", param.Name)
			}
			// Now load in the select list values
			if err = bundleLoader(selectList); err != nil {
				return err
			}
			// Verify that the provided value is in the select list's options
			foundValue := false
			validValues := make([]string, len(selectList.Options))
			for i, option := range selectList.Options {
				if stringValue == option.Value {
					foundValue = true
				}
				validValues[i] = option.Value
			}
			if !foundValue {
				return exceptions.NewInvalidParamExceptionWithDetails(
					"invalid value for param",
					param.Name,
					"allowed values: ["+strings.Join(validValues, ", ")+"]",
				)
			}
		case "METADATANAME":
			ok := IsValidMetadataName(fmt.Sprintf("%v", paramValue))
			if !ok {
				return exceptions.NewInvalidParamException("param failed metadata validation, no capital letters or special characters allowed", param.Name)
			}
		}
	}
	return nil
}

// ValidateParams checks validates received a map of provided bot params
// against any bot parameter metadata defined for the Bot
func (b *Bot) ValidateParams(params map[string]interface{}, bundleLoader BundleLoader) error {
	return ValidateParams(b.Params, params, bundleLoader)
}

func isNumericType(val interface{}) bool {
	switch val.(type) {
	case int64, float64, int, float32, int32, int8, int16:
		return true
	}
	return false
}

func getTSTypeNameForParam(param *BotParam) (typeName, importDirective string, err error) {
	switch param.Type {
	case "TEXT":
		return "string", "", nil
	case "NUMBER":
		return "number", "", nil
	case "CHECKBOX":
		return "boolean", "", nil
	case "SELECT":
		return getTypeNameAndImportForSelectList(param.SelectList)
	case "LIST":
		return "string[]", "", nil
	default:
		return "unknown", "", nil
	}
}

func getSelectListImport(namespace, typeName string) string {
	return fmt.Sprintf("	declare type %[2]s = import(\"@uesio/app/selectlists/%[1]s\").%[2]s", namespace, typeName)
}

func getTypeNameAndImportForSelectList(selectListKey string) (typeName, importDirective string, err error) {
	ns, name, err := ParseKey(selectListKey)
	if err != nil {
		return "", "", err
	}
	typeName = GetTypeNameFromMetaName(name)
	return typeName, getSelectListImport(ns, typeName), nil
}

func getParamDef(p *BotParam) (typeOutput, importOutput string, err error) {
	joiner := ": "
	if !p.Required {
		joiner = "?" + joiner
	}
	typeOutput, importOutput, err = getTSTypeNameForParam(p)
	if err != nil {
		return "", "", exceptions.NewBadRequestException("Could not generate type for parameter: " + p.Name + ": " + err.Error())
	}
	// example: "foo: string", "bar?: number", "baz: CustomType"
	typeOutput = p.Name + joiner + typeOutput
	return typeOutput, importOutput, nil
}

const NEWLINE = `
`

func (b *Bot) GenerateTypeDefinitions() (string, error) {
	if b.Type != "ROUTE" && b.Type != "LISTENER" && b.Type != "RUNACTION" {
		return "", nil
	}
	if b.Name == "" || b.Namespace == "" {
		return "", exceptions.NewBadRequestException("Bot name and namespace must be provided to generate types")
	}
	if b.Params == nil {
		return "", nil
	}
	var imports []string
	var params []string

	// Add an entry to the Params type for each Param
	for _, paramDef := range b.Params {
		paramType, importTypes, err := getParamDef(&paramDef)
		if err != nil {
			return "", err
		}
		if importTypes != "" {
			imports = append(imports, importTypes)
		}
		if paramType != "" {
			params = append(params, paramType)
		}
	}

	// Generate types from the Bots parameters
	typesFile := `
declare module "@uesio/app/bots/` + botTypes[b.Type] + "/" + b.GetNamespace() + "/" + b.Name + `" {` + NEWLINE
	if len(imports) > 0 {
		typesFile += strings.Join(imports, NEWLINE)
	}
	typesFile = typesFile + `
	type Params = {
		` + strings.Join(params, NEWLINE+`		`) + `
	}

	export type {
		Params
	}
}`
	return typesFile, nil
}
