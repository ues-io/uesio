package meta

import (
	"encoding/json"

	"gopkg.in/yaml.v3"
)

var DefaultAutoNumberMetadata = AutoNumberMetadata{Format: ""}

type AutoNumberMetadata struct {
	Format string `yaml:"format,omitempty" json:"uesio/studio.format"`
}

// AutoNumberMetadata was migrated to use a base 58 encoded uuid for the "auto number" (now considered an "Auto Id") and from having props
// Prefix & LeadingZeros to having Format properly only. There is no backwards migration for LeadingZeros since the "Auto Id" is not numeric
// any longer, however we need to support backwards compat for Prefix. To do so, we use custom marshallers to handle the legacy Prefix prop
// if Format is not set. The type autoNumberMetadataLegacy_DONOTUSE is used to unmarshal the old format and should only be used for that purpose.
type autoNumberMetadataLegacy_DONOTUSE struct {
	Prefix string `yaml:"prefix,omitempty" json:"uesio/studio.prefix"`
	Format string `yaml:"format,omitempty" json:"uesio/studio.format"`
}

func (a *AutoNumberMetadata) UnmarshalJSON(data []byte) error {
	var l autoNumberMetadataLegacy_DONOTUSE
	err := json.Unmarshal(data, &l)
	if err != nil {
		return err
	}
	a.handleLegacyProps(&l)
	return nil
}

func (a *AutoNumberMetadata) UnmarshalYAML(node *yaml.Node) error {
	var l autoNumberMetadataLegacy_DONOTUSE
	err := node.Decode(&l)
	if err != nil {
		return err
	}
	a.handleLegacyProps(&l)
	return nil
}

func (a *AutoNumberMetadata) handleLegacyProps(l *autoNumberMetadataLegacy_DONOTUSE) {
	if l.Format == "" && l.Prefix != "" {
		a.Format = l.Prefix + "-{id}"
	} else {
		a.Format = l.Format
	}
}
