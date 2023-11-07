package meta

import (
	"fmt"

	"gopkg.in/yaml.v3"
)

func NewTranslation(key string) (*Translation, error) {
	return &Translation{
		Language: key,
	}, nil
}

func NewBaseTranslation(namespace, language string) *Translation {
	return &Translation{
		Language: language,
		BundleableBase: BundleableBase{
			Namespace: namespace,
		},
	}
}

type Translation struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:"-"`
	Labels         map[string]string `yaml:"labels" json:"uesio/studio.labels"`
	Language       string            `yaml:"language" json:"uesio/studio.language"`
	Public         bool              `yaml:"public,omitempty" json:"uesio/studio.public"`
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

func (t *Translation) GetCollection() CollectionableGroup {
	return &TranslationCollection{}
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
	itemMeta := t.GetItemMeta()
	for _, fieldName := range TRANSLATION_FIELDS {
		if itemMeta != nil && !itemMeta.IsValidField(fieldName) {
			continue
		}
		val, err := t.GetField(fieldName)
		if err != nil {
			return err
		}
		err = iter(fieldName, val)
		if err != nil {
			return err
		}
	}
	return nil
}

func (t *Translation) IsPublic() bool {
	return t.Public
}

func (t *Translation) Len() int {
	return len(TRANSLATION_FIELDS)
}

func (t *Translation) UnmarshalYAML(node *yaml.Node) error {
	err := validateMetadataNameNode(node, t.Language, "language")
	if err != nil {
		return err
	}
	return node.Decode((*TranslationWrapper)(t))
}
