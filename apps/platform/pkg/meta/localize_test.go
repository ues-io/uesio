package meta

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetLocalizedKey(t *testing.T) {

	type testCase struct {
		name        string
		description string
		itemkey     string
		namespace   string
		expected    string
	}

	var tests = []testCase{
		{
			"localize",
			"localize if namespace is local",
			"my/namespace.myitem",
			"my/namespace",
			"myitem",
		},
		{
			"don't localize",
			"don't localize if namespace is not local",
			"my/namespace.myitem",
			"my/othernamespace",
			"my/namespace.myitem",
		},
		{
			"localize this/app",
			"localize if namespace is this/app",
			"this/app.myitem",
			"my/namespace",
			"myitem",
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			assert.Equal(t, tc.expected, GetLocalizedKey(tc.itemkey, tc.namespace))
		})
	}

}

func TestGetFullyQualifiedKey(t *testing.T) {

	type testCase struct {
		name        string
		description string
		itemkey     string
		namespace   string
		expected    string
	}

	var tests = []testCase{
		{
			"unlocalize",
			"unlocalize if namespace is not provided",
			"myitem",
			"my/namespace",
			"my/namespace.myitem",
		},
		{
			"noop local provided",
			"don't do anything if namespace is local",
			"my/namespace.myitem",
			"my/namespace",
			"my/namespace.myitem",
		},
		{
			"noop for managed namespace",
			"don't do anything if namespace is local",
			"my/othernamespace.myitem",
			"my/namespace",
			"my/othernamespace.myitem",
		},
		{
			"unlocalize this/app",
			"unlocalize if namespace is this/app",
			"this/app.myitem",
			"my/namespace",
			"my/namespace.myitem",
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			assert.Equal(t, tc.expected, GetFullyQualifiedKey(tc.itemkey, tc.namespace))
		})
	}

}
