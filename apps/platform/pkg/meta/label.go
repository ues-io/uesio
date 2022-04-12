package meta

import (
	"errors"
	"fmt"

	"github.com/humandad/yaml"
)

// Label struct
type Label struct {
	ID        string     `yaml:"-" uesio:"uesio/core.id"`
	Name      string     `yaml:"name" uesio:"uesio/studio.name"`
	Value     string     `yaml:"value" uesio:"uesio/studio.value"`
	Namespace string     `yaml:"-" uesio:"-"`
	Workspace *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	itemMeta  *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner     *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt int64      `yaml:"-" uesio:"uesio/core.createdat"`
	Public    bool       `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

func NewLabel(key string) (*Label, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Label: " + key)
	}
	return &Label{
		Name:      name,
		Namespace: namespace,
	}, nil
}

func NewLabels(keys map[string]bool) ([]BundleableItem, error) {
	items := []BundleableItem{}

	for key := range keys {
		newLabel, err := NewLabel(key)
		if err != nil {
			return nil, err
		}
		items = append(items, newLabel)
	}

	return items, nil
}

// GetCollectionName function
func (l *Label) GetCollectionName() string {
	return l.GetBundleGroup().GetName()
}

// GetCollection function
func (l *Label) GetCollection() CollectionableGroup {
	var lc LabelCollection
	return &lc
}

func (l *Label) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s", workspace, l.Name)
}

// GetBundleGroup function
func (l *Label) GetBundleGroup() BundleableGroup {
	var lc LabelCollection
	return &lc
}

// GetKey function
func (l *Label) GetKey() string {
	return fmt.Sprintf("%s.%s", l.Namespace, l.Name)
}

// GetPath function
func (l *Label) GetPath() string {
	return l.Name + ".yaml"
}

// GetPermChecker function
func (l *Label) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (l *Label) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(l, fieldName, value)
}

// GetField function
func (l *Label) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(l, fieldName)
}

// GetNamespace function
func (l *Label) GetNamespace() string {
	return l.Namespace
}

// SetNamespace function
func (l *Label) SetNamespace(namespace string) {
	l.Namespace = namespace
}

// SetWorkspace function
func (l *Label) SetWorkspace(workspace string) {
	l.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (l *Label) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(l, iter)
}

// Len function
func (l *Label) Len() int {
	return StandardItemLen(l)
}

// GetItemMeta function
func (l *Label) GetItemMeta() *ItemMeta {
	return l.itemMeta
}

// SetItemMeta function
func (l *Label) SetItemMeta(itemMeta *ItemMeta) {
	l.itemMeta = itemMeta
}

func (l *Label) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, l.Name)
	if err != nil {
		return err
	}
	return node.Decode(l)
}

func (l *Label) IsPublic() bool {
	return l.Public
}
