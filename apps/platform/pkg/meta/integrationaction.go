package meta

import (
	"fmt"
	"path"

	"gopkg.in/yaml.v3"
)

func NewIntegrationAction(integrationTypeName, actionName string) (*IntegrationAction, error) {
	namespace, name, err := ParseKey(actionName)
	if err != nil {
		// Action Name probably is local, so use the integration type's namespace
		integrationTypeName, _, err := ParseKey(integrationTypeName)
		if err != nil {
			return nil, fmt.Errorf("bad key for integration action: %s", actionName)
		}
		namespace = integrationTypeName
		name = actionName
	}
	return NewBaseIntegrationAction(integrationTypeName, namespace, name), nil
}

func NewBaseIntegrationAction(integrationTypeName, namespace, name string) *IntegrationAction {
	return &IntegrationAction{
		BundleableBase:     NewBase(namespace, name),
		IntegrationTypeRef: integrationTypeName,
	}
}

type IntegrationAction struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	// IntegrationType will be extracted from the filesystem path
	IntegrationTypeRef string    `yaml:"-" json:"uesio/studio.integrationtype"`
	BotRef             string    `yaml:"bot,omitempty" json:"uesio/studio.bot"`
	Params             BotParams `yaml:"params,omitempty" json:"uesio/studio.params"`
}

type IntegrationActionWrapper IntegrationAction

func (ia *IntegrationAction) GetCollection() CollectionableGroup {
	return &IntegrationActionCollection{}
}

func (ia *IntegrationAction) GetCollectionName() string {
	return INTEGRATION_ACTION_COLLECTION_NAME
}

func (ia *IntegrationAction) GetBundleFolderName() string {
	return INTEGRATION_ACTION_FOLDER_NAME
}

func (ia *IntegrationAction) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s:%s", workspace, ia.IntegrationTypeRef, ia.Name)
}

func (ia *IntegrationAction) GetKey() string {
	return fmt.Sprintf("%s:%s.%s", ia.IntegrationTypeRef, ia.Namespace, ia.Name)
}

func (ia *IntegrationAction) GetPath() string {
	integrationTypeName, integrationTypeNamespace, _ := ParseKey(ia.IntegrationTypeRef)
	nsUser, appName, _ := ParseNamespace(integrationTypeName)
	return path.Join(nsUser, appName, integrationTypeNamespace, ia.Name) + ".yaml"
}

func (ia *IntegrationAction) SetField(fieldName string, value any) error {
	return StandardFieldSet(ia, fieldName, value)
}

func (ia *IntegrationAction) GetField(fieldName string) (any, error) {
	return StandardFieldGet(ia, fieldName)
}

func (ia *IntegrationAction) Loop(iter func(string, any) error) error {
	return StandardItemLoop(ia, iter)
}

func (ia *IntegrationAction) Len() int {
	return StandardItemLen(ia)
}

func (ia *IntegrationAction) UnmarshalYAML(node *yaml.Node) error {
	if err := validateNodeName(node, ia.Name); err != nil {
		return err
	}
	ia.BotRef = pickMetadataItem(node, "bot", ia.Namespace, "")
	return node.Decode((*IntegrationActionWrapper)(ia))
}

func (ia *IntegrationAction) MarshalYAML() (any, error) {
	ia.BotRef = removeDefault(GetLocalizedKey(ia.BotRef, ia.Namespace), "")
	return (*IntegrationActionWrapper)(ia), nil
}

func (c *IntegrationAction) IsPublic() bool {
	return true
}
