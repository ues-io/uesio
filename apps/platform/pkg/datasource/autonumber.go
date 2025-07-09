package datasource

import (
	"fmt"

	"github.com/btcsuite/btcd/btcutil/base58"
	"github.com/gofrs/uuid/v5"
)

func getAutoID() (string, error) {
	u, err := uuid.NewV7()
	if err != nil {
		return "", fmt.Errorf("error generating auto id: %w", err)
	}
	return base58.Encode(u.Bytes()), nil
}
