package meta

import (
	"fmt"

	"gopkg.in/yaml.v3"
)

func NewBaseTranslation(namespace, language string) *Translation {
	return &Translation{
		Language: language,
		BundleableBase: BundleableBase{
			Namespace: namespace,
		},
	}
}

type Translation struct {
	Labels   map[string]string `yaml:"labels" json:"uesio/studio.labels"`
	Language string            `yaml:"language" json:"uesio/studio.language"`
	BuiltIn
	BundleableBase `yaml:",inline"`
}

type TranslationWrapper Translation

func (t *Translation) GetKey() string {
	return t.Language
}

func (t *Translation) GetPath() string {
	return t.GetKey() + ".yaml"
}

func (t *Translation) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, t.Language)
}

func (t *Translation) GetCollectionName() string {
	return TRANSLATION_COLLECTION_NAME
}

func (t *Translation) GetBundleFolderName() string {
	return TRANSLATION_FOLDER_NAME
}

func (t *Translation) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(t, fieldName, value)
}

func (t *Translation) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(t, fieldName)
}

func (t *Translation) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(t, iter)
}

func (t *Translation) Len() int {
	return StandardItemLen(t)
}

func (t *Translation) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeLanguage(node, t.Language)
	if err != nil {
		return err
	}
	return node.Decode((*TranslationWrapper)(t))
}
