package jsdialect

import (
	"maps"

	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type BotCollectionMetadata struct {
	// Private
	fields                  map[string]*wire.FieldMetadata
	uesioFieldsToExternalId map[string]string
	externalFieldsToUesioId map[string]string
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

// ensures that both the external -> uesio field id and its inverse mapping have been populated
func (cm *BotCollectionMetadata) ensureFieldIdsMapsPopulated() {
	if cm.uesioFieldsToExternalId == nil || cm.externalFieldsToUesioId == nil {
		cm.externalFieldsToUesioId = map[string]string{}
		cm.uesioFieldsToExternalId = map[string]string{}
		for uesioId, v := range cm.fields {
			externalId := v.ColumnName
			if externalId != "" {
				cm.externalFieldsToUesioId[externalId] = uesioId
				cm.uesioFieldsToExternalId[uesioId] = externalId
			}
		}
	}
}

func (cm *BotCollectionMetadata) GetExternalFieldName(uesioFieldName string) string {
	cm.ensureFieldIdsMapsPopulated()
	return cm.uesioFieldsToExternalId[uesioFieldName]
}

func (cm *BotCollectionMetadata) GetFieldIdByExternalName(externalName string) string {
	cm.ensureFieldIdsMapsPopulated()
	return cm.externalFieldsToUesioId[externalName]
}

func (cm *BotCollectionMetadata) GetField(fieldName string) *wire.FieldMetadata {
	return cm.fields[fieldName]
}

func (cm *BotCollectionMetadata) GetFieldMetadataByExternalName(externalName string) *wire.FieldMetadata {
	cm.ensureFieldIdsMapsPopulated()
	if uesioFieldId, isPresent := cm.externalFieldsToUesioId[externalName]; isPresent {
		return cm.fields[uesioFieldId]
	}
	return nil
}

func (cm *BotCollectionMetadata) GetFieldMetadata(fieldName string) *wire.FieldMetadata {
	return cm.fields[fieldName]
}

func (cm *BotCollectionMetadata) GetAllFieldMetadata() map[string]*wire.FieldMetadata {
	// Clone the map to prevent it being messed with by bots
	cloned := map[string]*wire.FieldMetadata{}
	maps.Copy(cloned, cm.fields)
	return cloned
}
