package meta

import (
	"fmt"
	"path"

	"gopkg.in/yaml.v3"
)

func NewAgent(key string) (*Agent, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, fmt.Errorf("bad key for agent: %s", key)
	}
	return NewBaseAgent(namespace, name), nil
}

func NewBaseAgent(namespace, name string) *Agent {
	return &Agent{BundleableBase: NewBase(namespace, name)}
}

type AgentTool struct {
	Name string
	Type string
}

type Agent struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Description    string      `yaml:"description" json:"uesio/studio.description"`
	ProfileRef     string      `yaml:"profile" json:"uesio/studio.profile"`
	Tools          []AgentTool `yaml:"tools" json:"uesio/studio.tools"`
}

type AgentWrapper Agent

func (a *Agent) GetCollectionName() string {
	return AGENT_COLLECTION_NAME
}

func (a *Agent) GetCollection() CollectionableGroup {
	return &AgentCollection{}
}

func (a *Agent) GetBundleFolderName() string {
	return AGENT_FOLDER_NAME
}

func (a *Agent) GetBasePath() string {
	return a.Name
}

func (a *Agent) GetPath() string {
	return path.Join(a.Name, "agent.yaml")
}

func (a *Agent) SetField(fieldName string, value any) error {
	return StandardFieldSet(a, fieldName, value)
}

func (a *Agent) GetField(fieldName string) (any, error) {
	return StandardFieldGet(a, fieldName)
}

func (a *Agent) Loop(iter func(string, any) error) error {
	return StandardItemLoop(a, iter)
}

func (a *Agent) Len() int {
	return StandardItemLen(a)
}

func (a *Agent) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, a.Name)
	if err != nil {
		return err
	}
	return node.Decode((*AgentWrapper)(a))
}
