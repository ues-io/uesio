package templating

import (
	"testing"
)

func TestNew(t *testing.T) {
	t.Run("Sanity check template creation", func(t *testing.T) {
		_, err := NewRequiredKey("example")
		if err != nil {
			t.Errorf("Failed to parse simple template")
		}
	})
}
