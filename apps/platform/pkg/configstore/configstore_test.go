package configstore

import (
	"context"
	"errors"
	"testing"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type TestConfigStore struct {
}

func (store *TestConfigStore) Get(ctx context.Context, key string, session *sess.Session) (*meta.ConfigStoreValue, error) {
	switch key {
	case "uesio/core.has_value":
		return &meta.ConfigStoreValue{
			Value: "abcd",
		}, nil
	case "uesio/core.has_empty_value":
		return &meta.ConfigStoreValue{
			Value: "",
		}, nil
	case "uesio/core.throw_error":
		return nil, errors.New("some error")
	default:
		return &meta.ConfigStoreValue{
			Value: "",
		}, nil
	}
}
func (store *TestConfigStore) GetMany(ctx context.Context, keys []string, session *sess.Session) (*meta.ConfigStoreValueCollection, error) {
	results := meta.ConfigStoreValueCollection{}
	for _, key := range keys {
		value, err := store.Get(ctx, key, session)
		if err != nil {
			return nil, err
		}
		results = append(results, value)
	}
	return &results, nil
}
func (store *TestConfigStore) Set(ctx context.Context, key, value string, session *sess.Session) error {
	return nil
}

func (store *TestConfigStore) Remove(ctx context.Context, key string, session *sess.Session) error {
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
			got, err := getValueInternal(context.Background(), tt.cv, nil)
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
