package templating

import (
	"testing"
)

func TestNew(t *testing.T) {
	t.Run("Sanity check template creation", func(t *testing.T) {
		_, err := NewTemplateWithValidKeysOnly("example")
		if err != nil {
			t.Errorf("failed to parse simple template")
		}
	})
}
