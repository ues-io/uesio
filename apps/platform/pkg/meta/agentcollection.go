package meta

import (
	"strconv"
	"strings"
)

type AgentCollection []*Agent

var AGENT_COLLECTION_NAME = "uesio/studio.agent"
var AGENT_FOLDER_NAME = "agents"
var AGENT_FIELDS = StandardGetFields(&Agent{})

func (ac *AgentCollection) GetName() string {
	return AGENT_COLLECTION_NAME
}

func (ac *AgentCollection) GetBundleFolderName() string {
	return AGENT_FOLDER_NAME
}

func (ac *AgentCollection) GetFields() []string {
	return AGENT_FIELDS
}

func (ac *AgentCollection) NewItem() Item {
	return &Agent{}
}

func (ac *AgentCollection) AddItem(item Item) error {
	*ac = append(*ac, item.(*Agent))
	return nil
}

func (ac *AgentCollection) GetItemFromPath(path, namespace string) BundleableItem {
	parts := strings.Split(path, "/")
	return NewBaseAgent(namespace, parts[0])
}

func (ac *AgentCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewAgent(key)
}

func (ac *AgentCollection) IsDefinitionPath(path string) bool {
	parts := strings.Split(path, "/")
	return len(parts) == 2 && parts[1] == "agent.yaml"
}

func (ac *AgentCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	if definitionOnly {
		return ac.IsDefinitionPath(path)
	}
	return true
}

func (ac *AgentCollection) Loop(iter GroupIterator) error {
	for index, c := range *ac {
		err := iter(c, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (ac *AgentCollection) Len() int {
	return len(*ac)
}
