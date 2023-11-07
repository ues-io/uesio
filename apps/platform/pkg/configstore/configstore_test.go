package configstore

import (
	"errors"
	"testing"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type TestConfigStore struct {
}

func (store *TestConfigStore) Get(key string, session *sess.Session) (string, error) {
	switch key {
	case "uesio/core.has_value":
		return "abcd", nil
	case "uesio/core.has_empty_value":
		return "", nil
	case "uesio/core.throw_error":
		return "", errors.New("some error")
	default:
		return "", nil
	}
}
func (store *TestConfigStore) Set(key, value string, session *sess.Session) error {
	return nil
}

func TestGetValue(t *testing.T) {

	RegisterConfigStore("test", &TestConfigStore{})

	tests := []struct {
		name    string
		cv      *meta.ConfigValue
		want    string
		wantErr bool
	}{
		{
			"should return value from the store",
			&meta.ConfigValue{
				BundleableBase: meta.BundleableBase{
					Name:      "has_value",
					Namespace: "uesio/core",
				},
				Store:        "test",
				DefaultValue: "foo",
			},
			"abcd",
			false,
		},
		{
			"should return default value if store has no value",
			&meta.ConfigValue{
				BundleableBase: meta.BundleableBase{
					Name:      "has_no_value",
					Namespace: "uesio/core",
				},
				Store:        "test",
				DefaultValue: "foo",
			},
			"foo",
			false,
		},
		{
			"should return error if store throws error",
			&meta.ConfigValue{
				BundleableBase: meta.BundleableBase{
					Name:      "throw_error",
					Namespace: "uesio/core",
				},
				Store:        "test",
				DefaultValue: "foo",
			},
			"",
			true,
		},
		{
			"should return default value if store has empty value",
			&meta.ConfigValue{
				BundleableBase: meta.BundleableBase{
					Name:      "blah",
					Namespace: "uesio/core",
				},
				Store:        "test",
				DefaultValue: "foo",
			},
			"foo",
			false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := GetValue(tt.cv, nil)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetValue() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("GetValue() got = %v, want %v", got, tt.want)
			}
		})
	}
}
