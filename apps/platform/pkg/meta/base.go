package meta

import (
	"encoding/json"
	"fmt"
)

func NewBase(namespace, name string) BundleableBase {
	return BundleableBase{
		Namespace: namespace,
		Name:      name,
	}
}

type BundleableBase struct {
	Name      string     `yaml:"name" json:"uesio/studio.name"`
	Namespace string     `yaml:"-" json:"-"`
	Workspace *Workspace `yaml:"-" json:"uesio/studio.workspace"`
	Public    bool       `yaml:"public,omitempty" json:"uesio/studio.public"`
}

func (bb *BundleableBase) GetNamespace() string {
	return bb.Namespace
}

func (bb *BundleableBase) SetNamespace(namespace string) {
	bb.Namespace = namespace
}

func (bb *BundleableBase) IsPublic() bool {
	return bb.Public
}

func (bb *BundleableBase) GetPermChecker() *PermissionSet {
	return nil
}

func (bb *BundleableBase) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s", workspace, bb.Name)
}

func (bb *BundleableBase) GetKey() string {
	return fmt.Sprintf("%s.%s", bb.Namespace, bb.Name)
}

func (bb *BundleableBase) GetPath() string {
	return bb.Name + ".yaml"
}

func refScanner(obj interface{}, data []byte) error {
	if data[0] == '"' {
		return json.Unmarshal(append([]byte("{\"uesio/core.id\":"), append(data, []byte("}")...)...), obj)
	}
	return json.Unmarshal(data, obj)
}
