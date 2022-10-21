package meta

import (
	"errors"
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
)

func NewSignupMethod(key string) (*SignupMethod, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for SignupMethod: " + key)
	}
	return &SignupMethod{
		Name:      name,
		Namespace: namespace,
	}, nil
}

type SignupMethod struct {
	ID               string     `yaml:"-" uesio:"uesio/core.id"`
	UniqueKey        string     `yaml:"-" uesio:"uesio/core.uniquekey"`
	Name             string     `yaml:"name" uesio:"uesio/studio.name"`
	Namespace        string     `yaml:"-" uesio:"-"`
	AuthSource       string     `yaml:"authsource" uesio:"uesio/studio.authsource"`
	Profile          string     `yaml:"profile" uesio:"uesio/studio.profile"`
	UsernameTemplate string     `yaml:"usernameTemplate" uesio:"uesio/studio.usernametemplate"`
	LandingRoute     string     `yaml:"landingRoute" uesio:"uesio/studio.landingroute"`
	UsernameRegex    string     `yaml:"usernameRegex" uesio:"uesio/studio.usernameregex"`
	Workspace        *Workspace `yaml:"-" uesio:"uesio/studio.workspace"`
	itemMeta         *ItemMeta  `yaml:"-" uesio:"-"`
	CreatedBy        *User      `yaml:"-" uesio:"uesio/core.createdby"`
	Owner            *User      `yaml:"-" uesio:"uesio/core.owner"`
	UpdatedBy        *User      `yaml:"-" uesio:"uesio/core.updatedby"`
	UpdatedAt        int64      `yaml:"-" uesio:"uesio/core.updatedat"`
	CreatedAt        int64      `yaml:"-" uesio:"uesio/core.createdat"`
	Public           bool       `yaml:"public,omitempty" uesio:"uesio/studio.public"`
}

type SignupMethodWrapper SignupMethod

func (sm *SignupMethod) GetCollectionName() string {
	return sm.GetBundleGroup().GetName()
}

func (sm *SignupMethod) GetCollection() CollectionableGroup {
	var smc SignupMethodCollection
	return &smc
}

func (sm *SignupMethod) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, sm.Name)
}

func (sm *SignupMethod) GetBundleGroup() BundleableGroup {
	var smc SignupMethodCollection
	return &smc
}

func (sm *SignupMethod) GetKey() string {
	return fmt.Sprintf("%s.%s", sm.Namespace, sm.Name)
}

func (sm *SignupMethod) GetPath() string {
	return sm.Name + ".yaml"
}

func (sm *SignupMethod) GetPermChecker() *PermissionSet {
	return nil
}

func (sm *SignupMethod) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(sm, fieldName, value)
}

func (sm *SignupMethod) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(sm, fieldName)
}

func (sm *SignupMethod) GetNamespace() string {
	return sm.Namespace
}

func (sm *SignupMethod) SetNamespace(namespace string) {
	sm.Namespace = namespace
}

func (sm *SignupMethod) SetModified(mod time.Time) {
	sm.UpdatedAt = mod.UnixMilli()
}

func (sm *SignupMethod) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(sm, iter)
}

func (sm *SignupMethod) Len() int {
	return StandardItemLen(sm)
}

func (sm *SignupMethod) GetItemMeta() *ItemMeta {
	return sm.itemMeta
}

func (sm *SignupMethod) SetItemMeta(itemMeta *ItemMeta) {
	sm.itemMeta = itemMeta
}

func (sm *SignupMethod) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, sm.Name)
	if err != nil {
		return err
	}
	return node.Decode((*SignupMethodWrapper)(sm))
}

func (sm *SignupMethod) IsPublic() bool {
	return sm.Public
}
