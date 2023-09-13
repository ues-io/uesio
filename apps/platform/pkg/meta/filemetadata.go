package meta

import (
	"gopkg.in/yaml.v3"
)

type FileMetadataWrapper FileMetadata

type FileMetadata struct {
	Accept     string `yaml:"accept,omitempty" json:"uesio/studio.accept"`
	FileSource string `yaml:"filesource,omitempty" json:"uesio/studio.filesource"`
	Namespace  string `yaml:"-" json:"-"`
}

func (f *FileMetadata) UnmarshalYAML(node *yaml.Node) error {
	f.FileSource = pickMetadataItem(node, "filesource", f.Namespace, "uesio/core.platform")
	return node.Decode((*FileMetadataWrapper)(f))
}

func (f *FileMetadata) MarshalYAML() (interface{}, error) {
	f.FileSource = removeDefault(GetLocalizedKey(f.FileSource, f.Namespace), "uesio/core.platform")
	return (*FileMetadataWrapper)(f), nil
}

func (f *FileMetadata) IsZero() bool {
	return f.Accept == "" && (f.FileSource == "" || f.FileSource == "uesio/core.platform")
}
