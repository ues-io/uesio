package secretstore

import (
	"context"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func newMockStore() SecretStore {
	return &mockStore{
		vals: map[string]string{},
	}
}

type mockStore struct {
	vals map[string]string
}

func (ms *mockStore) Get(ctx context.Context, key string, session *sess.Session) (*meta.SecretStoreValue, error) {
	if val, isPresent := ms.vals[key]; isPresent {
		return &meta.SecretStoreValue{
			Value: val,
			Key:   key,
		}, nil
	} else {
		return nil, exceptions.NewNotFoundException("secret not found: " + key)
	}
}
func (ms *mockStore) Set(ctx context.Context, key, value string, session *sess.Session) error {
	ms.vals[key] = value
	return nil
}
func (ms *mockStore) Remove(ctx context.Context, key string, session *sess.Session) error {
	return nil
}

func TestGetSecret(t *testing.T) {

	storeInstance := newMockStore()
	assert.Nil(t, storeInstance.Set(context.Background(), "luigi/secretstests.some_api_key", "site-store-value", nil))
	RegisterSecretStore("mock", storeInstance)

	assert.Nil(t, os.Setenv("UESIO_SECRET_LUIGI_SECRETSTESTS_SOME_API_KEY", "some-api-key-env-value"))
	assert.Nil(t, os.Setenv("UESIO_SECRET_LUIGI_SECRETSTESTS_OTHER_KEY", "other-key-value"))

	tests := []struct {
		name            string
		secretNamespace string
		secretName      string
		want            string
		wantErr         bool
	}{
		{
			"value in site store but also has env var default - prefer site store",
			"luigi/secretstests",
			"some_api_key",
			"site-store-value",
			false,
		},
		{
			"value NOT in site store, but has env var default - use the env var default",
			"luigi/secretstests",
			"other_key",
			"other-key-value",
			false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := getSecretInternal(context.Background(), &meta.Secret{
				BundleableBase: meta.BundleableBase{
					Name:      tt.secretName,
					Namespace: tt.secretNamespace,
				},
				Store: "mock",
			}, nil)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetSecret() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("GetSecret() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_getEnvironmentVariableName(t *testing.T) {
	tests := []struct {
		name   string
		secret *meta.Secret
		want   string
	}{
		{
			"underscores in name",
			&meta.Secret{
				BundleableBase: meta.BundleableBase{
					Name:      "some_api_key",
					Namespace: "uesio/crm",
				},
			},
			"UESIO_SECRET_UESIO_CRM_SOME_API_KEY",
		},
		{
			"no underscores",
			&meta.Secret{
				BundleableBase: meta.BundleableBase{
					Name:      "somekey",
					Namespace: "luigi/foo",
				},
			},
			"UESIO_SECRET_LUIGI_FOO_SOMEKEY",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := getEnvironmentVariableName(tt.secret); got != tt.want {
				t.Errorf("getEnvironmentVariableName() = %v, want %v", got, tt.want)
			}
		})
	}
}
