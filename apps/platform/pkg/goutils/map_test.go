package goutils

import (
	"reflect"
	"testing"
)

func TestMapKeys(t *testing.T) {
	type args[K comparable, V any] struct {
		inputMap map[K]V
	}
	type testCase[K comparable, V any] struct {
		name string
		args args[K, V]
		want []K
	}
	tests := []testCase[string, bool]{
		{
			"it should return all keys of the given map",
			args[string, bool]{
				inputMap: map[string]bool{
					"foo": true,
					"bar": false,
					"baz": true,
				},
			},
			[]string{"foo", "bar", "baz"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := MapKeys(tt.args.inputMap); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("MapKeys() = %v, want %v", got, tt.want)
			}
		})
	}
}
