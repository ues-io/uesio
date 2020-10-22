package metadata

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// NewBot function
func NewBot(collectionKey, botKey string) (*Bot, error) {
	namespace, name, err := ParseKey(botKey)
	if err != nil {
		return nil, errors.New("Bad Key for Bot: " + collectionKey + " : " + botKey)
	}
	return &Bot{
		Name:          name,
		Namespace:     namespace,
		CollectionRef: collectionKey,
	}, nil
}

// Bot struct
type Bot struct {
	Name          string `yaml:"name" uesio:"uesio.name"`
	CollectionRef string `yaml:"collection" uesio:"uesio.collection"`
	Namespace     string `yaml:"namespace" uesio:"-"`
	Type          string `yaml:"type" uesio:"uesio.type"`
	FileName      string `yaml:"fileName" uesio:"-"`
	FileContents  string `yaml:"-" uesio:"uesio.filecontents"`
	Workspace     string `yaml:"-" uesio:"uesio.workspaceid"`
}

// GetBotTypes function
func GetBotTypes() map[string]bool {
	return map[string]bool{
		"JAVASCRIPT": true,
	}
}

// GetCollectionName function
func (b *Bot) GetCollectionName() string {
	return b.GetBundleGroup().GetName()
}

// GetCollection function
func (b *Bot) GetCollection() CollectionableGroup {
	var bc BotCollection
	return &bc
}

// GetConditions function
func (b *Bot) GetConditions() ([]reqs.LoadRequestCondition, error) {
	return []reqs.LoadRequestCondition{
		{
			Field: "uesio.name",
			Value: b.Name,
		},
		{
			Field: "uesio.collection",
			Value: b.CollectionRef,
		},
	}, nil
}

// GetBundleGroup function
func (b *Bot) GetBundleGroup() BundleableGroup {
	var bc BotCollection
	return &bc
}

// GetKey function
func (b *Bot) GetKey() string {
	return b.CollectionRef + "." + b.Namespace + "." + b.Name
}

// GetPermChecker function
func (b *Bot) GetPermChecker() *PermissionSet {
	return nil
}

// GetNamespace function
func (b *Bot) GetNamespace() string {
	return b.Namespace
}

// SetNamespace function
func (b *Bot) SetNamespace(namespace string) {
	b.Namespace = namespace
}

// SetWorkspace function
func (b *Bot) SetWorkspace(workspace string) {
	b.Workspace = workspace
}
