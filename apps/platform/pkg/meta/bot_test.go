package meta

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestNewListenerBot(t *testing.T) {
	type args struct {
		namespace string
		name      string
	}
	tests := []struct {
		name string
		args args
		want *Bot
	}{
		{
			"creates a Listener Bot wrapper",
			args{
				namespace: "luigi/dev",
				name:      "add_numbers",
			},
			&Bot{
				BuiltIn: BuiltIn{},
				BundleableBase: BundleableBase{
					Namespace: "luigi/dev",
					Name:      "add_numbers",
				},
				CollectionRef: "",
				Type:          "LISTENER",
				Dialect:       "",
				Params:        nil,
				FileContents:  "",
			},
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			assert.Equalf(t, tt.want, NewListenerBot(tt.args.namespace, tt.args.name), "NewListenerBot(%v, %v)", tt.args.namespace, tt.args.name)
		})
	}
}

func TestNewGeneratorBot(t *testing.T) {
	type args struct {
		namespace string
		name      string
	}
	tests := []struct {
		name string
		args args
		want *Bot
	}{
		{
			"creates a Generator Bot wrapper",
			args{
				namespace: "luigi/dev",
				name:      "generate_something",
			},
			&Bot{
				BuiltIn: BuiltIn{},
				BundleableBase: BundleableBase{
					Namespace: "luigi/dev",
					Name:      "generate_something",
				},
				CollectionRef: "",
				Type:          "GENERATOR",
				Dialect:       "",
				Params:        nil,
				FileContents:  "",
			},
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			assert.Equalf(t, tt.want, NewGeneratorBot(tt.args.namespace, tt.args.name), "NewGeneratorBot(%v, %v)", tt.args.namespace, tt.args.name)
		})
	}
}
