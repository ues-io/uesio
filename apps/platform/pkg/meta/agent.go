package meta

import (
	"errors"
	"path"

	"gopkg.in/yaml.v3"
)

func NewAgent(key string) (*Agent, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for Agent: " + key)
	}
	return NewBaseAgent(namespace, name), nil
}

func NewBaseAgent(namespace, name string) *Agent {
	return &Agent{BundleableBase: NewBase(namespace, name)}
}

type Agent struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Description    string `yaml:"description" json:"uesio/studio.description"`
	ProfileRef     string `yaml:"profile" json:"uesio/studio.profile"`
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

func (a *Agent) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(a, fieldName, value)
}

func (a *Agent) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(a, fieldName)
}

func (a *Agent) Loop(iter func(string, interface{}) error) error {
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
