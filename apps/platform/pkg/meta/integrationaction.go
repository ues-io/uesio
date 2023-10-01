package meta

import (
	"errors"
	"fmt"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

func NewIntegrationAction(integrationName, actionName string) (*IntegrationAction, error) {
	namespace, name, err := ParseKey(actionName)
	if err != nil {
		return nil, errors.New("bad key for Integration Action: " + actionName)
	}
	return NewBaseIntegrationAction(integrationName, namespace, name), nil
}

func NewBaseIntegrationAction(integrationName, namespace, name string) *IntegrationAction {
	return &IntegrationAction{
		BundleableBase: NewBase(namespace, name),
		IntegrationRef: integrationName,
	}
}

type IntegrationAction struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	IntegrationRef string `yaml:"integration" json:"uesio/studio.integration"`
	BotRef         string `yaml:"bot" json:"uesio/studio.bot"`
}

type IntegrationActionWrapper IntegrationAction

func (ia *IntegrationAction) GetCollectionName() string {
	return INTEGRATION_ACTION_COLLECTION_NAME
}

func (ia *IntegrationAction) GetBundleFolderName() string {
	return INTEGRATION_ACTION_FOLDER_NAME
}

func (ia *IntegrationAction) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s:%s", workspace, ia.IntegrationRef, ia.Name)
}

func (ia *IntegrationAction) GetKey() string {
	return fmt.Sprintf("%s:%s.%s", ia.IntegrationRef, ia.Namespace, ia.Name)
}

func (ia *IntegrationAction) GetPath() string {
	integrationNamespace, integrationName, _ := ParseKey(ia.IntegrationRef)
	nsUser, appName, _ := ParseNamespace(integrationNamespace)
	return filepath.Join(nsUser, appName, integrationName, ia.Name) + ".yaml"
}

func (ia *IntegrationAction) SetField(actionName string, value interface{}) error {
	return StandardFieldSet(ia, actionName, value)
}

func (ia *IntegrationAction) GetField(actionName string) (interface{}, error) {
	return StandardFieldGet(ia, actionName)
}

func (ia *IntegrationAction) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ia, iter)
}

func (ia *IntegrationAction) Len() int {
	return StandardItemLen(ia)
}

func (ia *IntegrationAction) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, ia.Name)
	if err != nil {
		return err
	}
	return node.Decode((*IntegrationActionWrapper)(ia))
}

func (ia *IntegrationAction) MarshalYAML() (interface{}, error) {
	return (*IntegrationActionWrapper)(ia), nil
}

func (c *IntegrationAction) IsPublic() bool {
	return true
}
