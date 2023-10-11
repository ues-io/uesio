package meta

type NumberMetadata struct {
	Decimals int `yaml:"decimals,omitempty" json:"uesio/studio.decimals"`
}

func (n *NumberMetadata) IsZero() bool {
	return n.Decimals == 0
}
