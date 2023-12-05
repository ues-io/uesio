package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type BotCollectionMetadata struct {
	// Private
	fields map[string]*wire.FieldMetadata
	// Public
	Name         string `bot:"name"`
	Namespace    string `bot:"namespace"`
	Type         string `bot:"type"`
	Createable   bool   `bot:"createable"`
	Accessible   bool   `bot:"accessible"`
	Updateable   bool   `bot:"updateable"`
	Deleteable   bool   `bot:"deleteable"`
	ExternalName string `bot:"externalName"`
	Label        string `bot:"label"`
	PluralLabel  string `bot:"pluralLabel"`
}

func NewBotCollectionMetadata(metadata *wire.CollectionMetadata) *BotCollectionMetadata {
	return &BotCollectionMetadata{
		fields:       metadata.Fields,
		Name:         metadata.Name,
		Namespace:    metadata.Namespace,
		Type:         metadata.Type,
		Createable:   metadata.Createable,
		Accessible:   metadata.Accessible,
		Updateable:   metadata.Updateable,
		Deleteable:   metadata.Deleteable,
		ExternalName: metadata.TableName,
		Label:        metadata.Label,
		PluralLabel:  metadata.PluralLabel,
	}
}

func (cm *BotCollectionMetadata) GetFieldMetadata(fieldName string) *wire.FieldMetadata {
	return cm.fields[fieldName]
}

func (cm *BotCollectionMetadata) GetAllFieldMetadata() map[string]*wire.FieldMetadata {
	// Clone the map to prevent it being messed with by bots
	cloned := map[string]*wire.FieldMetadata{}
	for k, v := range cm.fields {
		cloned[k] = v
	}
	return cloned
}
