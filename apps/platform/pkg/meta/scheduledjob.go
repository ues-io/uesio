package meta

import (
	"errors"

	"github.com/francoispqt/gojay"
	"gopkg.in/yaml.v3"
)

type ScheduledJob struct {
	BuiltIn        `yaml:",inline"`
	BundleableBase `yaml:",inline"`
	Schedule       string `yaml:"schedule" json:"uesio/studio.schedule"`
	BotRef         string `yaml:"bot" json:"uesio/studio.bot"`
}

type ScheduledJobWrapper ScheduledJob

func (s *ScheduledJob) GetBytes() ([]byte, error) {
	return gojay.MarshalJSONObject(s)
}

func (s *ScheduledJob) MarshalJSONObject(enc *gojay.Encoder) {
	enc.AddStringKey("namespace", s.Namespace)
	enc.AddStringKey("name", s.Name)
}

func (s *ScheduledJob) IsNil() bool {
	return s == nil
}

func NewScheduledJob(key string) (*ScheduledJob, error) {
	namespace, name, err := ParseKey(key)
	if err != nil {
		return nil, errors.New("Bad Key for ScheduledJob: " + key)
	}
	return NewBaseScheduledJob(namespace, name), nil
}

func NewBaseScheduledJob(namespace, name string) *ScheduledJob {
	return &ScheduledJob{BundleableBase: NewBase(namespace, name)}
}

func NewScheduledJobs(keys map[string]bool) ([]BundleableItem, error) {
	items := []BundleableItem{}

	for key := range keys {
		newScheduledJob, err := NewScheduledJob(key)
		if err != nil {
			return nil, err
		}
		items = append(items, newScheduledJob)
	}

	return items, nil
}

func (s *ScheduledJob) GetCollectionName() string {
	return SCHEDULEDJOB_COLLECTION_NAME
}

func (s *ScheduledJob) GetBundleFolderName() string {
	return SCHEDULEDJOB_FOLDER_NAME
}

func (s *ScheduledJob) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(s, fieldName, value)
}

func (s *ScheduledJob) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(s, fieldName)
}

func (s *ScheduledJob) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(s, iter)
}

func (s *ScheduledJob) Len() int {
	return StandardItemLen(s)
}

func (s *ScheduledJob) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, s.Name)
	if err != nil {
		return err
	}
	return node.Decode((*ScheduledJobWrapper)(s))
}
