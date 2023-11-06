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

	type args struct {
		cv      *meta.ConfigValue
		session *sess.Session
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{
			"should return value from the store",
			args{
				cv: &meta.ConfigValue{
					BundleableBase: meta.BundleableBase{
						Name:      "has_value",
						Namespace: "uesio/core",
					},
					Store:        "test",
					DefaultValue: "foo",
				},
				session: nil,
			},
			"abcd",
			false,
		},
		{
			"should return default value if store has no value",
			args{
				cv: &meta.ConfigValue{
					BundleableBase: meta.BundleableBase{
						Name:      "has_no_value",
						Namespace: "uesio/core",
					},
					Store:        "test",
					DefaultValue: "foo",
				},
				session: nil,
			},
			"foo",
			false,
		},
		{
			"should return default value if store has empty value",
			args{
				cv: &meta.ConfigValue{
					BundleableBase: meta.BundleableBase{
						Name:      "throw_error",
						Namespace: "uesio/core",
					},
					Store:        "test",
					DefaultValue: "foo",
				},
				session: nil,
			},
			"",
			true,
		},
		{
			"should return error if store throws error",
			args{
				cv: &meta.ConfigValue{
					BundleableBase: meta.BundleableBase{
						Name:      "blah",
						Namespace: "uesio/core",
					},
					Store:        "test",
					DefaultValue: "foo",
				},
				session: nil,
			},
			"foo",
			false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := GetValue(tt.args.cv, tt.args.session)
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
