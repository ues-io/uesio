package sendgrid

import (
	"log/slog"

	"github.com/gofrs/uuid"
	"github.com/sendgrid/rest"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

type devClient struct {
}

func (c *devClient) Send(email *mail.SGMailV3) (*rest.Response, error) {
	instance, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}
	slog.Info("[SendGrid mock client] Email to be sent", slog.Any("email", email))
	return &rest.Response{
		StatusCode: 202,
		Headers: map[string][]string{
			"X-Message-Id": {instance.String()},
		},
	}, nil
}
