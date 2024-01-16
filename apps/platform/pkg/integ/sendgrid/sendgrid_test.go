package sendgrid

import (
	"testing"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
	"github.com/stretchr/testify/assert"

	"github.com/thecloudmasters/uesio/pkg/env"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func Test_newConnection(t *testing.T) {

	uesioCoreSendGridIntegration, _ := meta.NewIntegration("uesio/core.sendgrid")
	otherIntegration, _ := meta.NewIntegration("luigi/foo.sendgrid")

	sampleCreds := (wire.Credentials)(map[string]string{
		"apikey": "abcd",
	})
	emptyCreds := (wire.Credentials)(map[string]string{})

	tests := []struct {
		name        string
		ic          *wire.IntegrationConnection
		wantClient  EmailClient
		wantErr     string
		mockDevMode bool
	}{
		{
			name:       "happy path: Send Grid API key is in credentials",
			ic:         wire.NewIntegrationConnection(otherIntegration, nil, nil, &sampleCreds, nil),
			wantClient: sendgrid.NewSendClient("abcd"),
			wantErr:    "",
		},
		{
			name:       "happy path: uesio core Sned Grid integration, and Send Grid API key is in credentials",
			ic:         wire.NewIntegrationConnection(uesioCoreSendGridIntegration, nil, nil, &sampleCreds, nil),
			wantClient: sendgrid.NewSendClient("abcd"),
			wantErr:    "",
		},
		{
			name:        "Dev Mode: use default client if using Core Send Grid integration and API key not in credentials",
			ic:          wire.NewIntegrationConnection(uesioCoreSendGridIntegration, nil, nil, &emptyCreds, nil),
			mockDevMode: true,
			wantClient:  &devClient{},
			wantErr:     "",
		},
		{
			name:        "NON Dev Mode: should fail if using Core Send Grid integration and API key not in credentials",
			ic:          wire.NewIntegrationConnection(uesioCoreSendGridIntegration, nil, nil, &emptyCreds, nil),
			mockDevMode: false,
			wantClient:  nil,
			wantErr:     "SendGrid API Key not provided",
		},
		{
			name:        "Dev Mode, NON-Core Send Grid integration, API key not in credentials",
			ic:          wire.NewIntegrationConnection(otherIntegration, nil, nil, &emptyCreds, nil),
			mockDevMode: true,
			wantClient:  nil,
			wantErr:     "SendGrid API Key not provided",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			defer env.ResetDevMode()
			env.SetDevMode(tt.mockDevMode)
			got, err := newSendGridConnection(tt.ic)
			if tt.wantErr != "" {
				assert.NotNil(t, tt.wantErr)
				assert.Equal(t, err.Error(), tt.wantErr, "expected error message")
				return
			}
			assert.Nil(t, err, "did not expect error, but got one")
			assert.True(t, assert.ObjectsExportedFieldsAreEqual(tt.ic, got.integration), "did not get expected value: integration connection")
			assert.True(t, assert.ObjectsExportedFieldsAreEqual(tt.wantClient, got.client), "did not get expected value: client")
		})
	}
}

func Test_createMessage(t *testing.T) {
	tests := []struct {
		name           string
		requestOptions map[string]interface{}
		want           *mail.SGMailV3
	}{
		{
			"single to, cc, bcc, and use plain text",
			map[string]interface{}{
				"to":          "abel@ues.io",
				"toNames":     "Abel Jimenez",
				"cc":          "wessel@ues.io",
				"ccNames":     "Wessel van der Plas",
				"bcc":         "gregg@ues.io",
				"bccNames":    "Gregg Baxter",
				"from":        "ben@ues.io",
				"fromName":    "Ben Hubbard",
				"contentType": "text/plain",
				"subject":     "Welcome to ues.io!",
				"plainBody":   "This is an email",
			},
			&mail.SGMailV3{
				From:    &mail.Email{"Ben Hubbard", "ben@ues.io"},
				Subject: "Welcome to ues.io!",
				Content: []*mail.Content{{
					Type:  "text/plain",
					Value: "This is an email",
				}},
				Personalizations: []*mail.Personalization{{
					To:  []*mail.Email{{"Abel Jimenez", "abel@ues.io"}},
					CC:  []*mail.Email{{"Wessel van der Plas", "wessel@ues.io"}},
					BCC: []*mail.Email{{"Gregg Baxter", "gregg@ues.io"}},
				}},
			},
		},
		{
			"multiple to, cc, bcc, and use templates",
			map[string]interface{}{
				"to":          []string{"abel@ues.io", "zach@ues.io"},
				"toNames":     []string{"Abel Jimenez", "Zach McElrath"},
				"cc":          []string{"wessel@ues.io", "zach@ues.io"},
				"ccNames":     []string{"Wessel van der Plas", "Zach McElrath"},
				"bcc":         []string{"gregg@ues.io", "zach@ues.io"},
				"bccNames":    []string{"Gregg Baxter", "Zach McElrath"},
				"from":        "ben@ues.io",
				"contentType": "text/html",
				"subject":     "Welcome to ues.io!",
				"templateId":  "acjaklsdjfas",
				"dynamicTemplateData": map[string]interface{}{
					"foo": "bar",
				},
			},
			&mail.SGMailV3{
				From:       &mail.Email{"ben@ues.io", "ben@ues.io"},
				Subject:    "Welcome to ues.io!",
				TemplateID: "acjaklsdjfas",
				Content:    []*mail.Content{},
				Personalizations: []*mail.Personalization{{
					To: []*mail.Email{
						{"Abel Jimenez", "abel@ues.io"},
						{"Zach McElrath", "zach@ues.io"},
					},
					CC: []*mail.Email{
						{"Wessel van der Plas", "wessel@ues.io"},
						{"Zach McElrath", "zach@ues.io"},
					},
					BCC: []*mail.Email{
						{"Gregg Baxter", "gregg@ues.io"},
						{"Zach McElrath", "zach@ues.io"},
					},
					DynamicTemplateData: map[string]interface{}{
						"foo": "bar",
					},
				}},
			},
		},
		{
			"only addresses, no names - as string",
			map[string]interface{}{
				"to":          "abel@ues.io",
				"cc":          "wessel@ues.io",
				"bcc":         "gregg@ues.io",
				"from":        "ben@ues.io",
				"contentType": "text/plain",
				"subject":     "Another email",
				"plainBody":   "This is an email",
			},
			&mail.SGMailV3{
				From:    &mail.Email{"ben@ues.io", "ben@ues.io"},
				Subject: "Another email",
				Content: []*mail.Content{{
					Type:  "text/plain",
					Value: "This is an email",
				}},
				Personalizations: []*mail.Personalization{{
					To:  []*mail.Email{{"abel@ues.io", "abel@ues.io"}},
					CC:  []*mail.Email{{"wessel@ues.io", "wessel@ues.io"}},
					BCC: []*mail.Email{{"gregg@ues.io", "gregg@ues.io"}},
				}},
			},
		},
		{
			"only addresses, no names - as list",
			map[string]interface{}{
				"to":          []string{"abel@ues.io", "zach@ues.io"},
				"cc":          []string{"wessel@ues.io", "zach@ues.io"},
				"bcc":         []string{"gregg@ues.io", "zach@ues.io"},
				"from":        "ben@ues.io",
				"contentType": "text/plain",
				"subject":     "Another email",
				"plainBody":   "This is an email",
			},
			&mail.SGMailV3{
				From:    &mail.Email{"ben@ues.io", "ben@ues.io"},
				Subject: "Another email",
				Content: []*mail.Content{{
					Type:  "text/plain",
					Value: "This is an email",
				}},
				Personalizations: []*mail.Personalization{{
					To: []*mail.Email{
						{"abel@ues.io", "abel@ues.io"},
						{"zach@ues.io", "zach@ues.io"},
					},
					CC: []*mail.Email{
						{"wessel@ues.io", "wessel@ues.io"},
						{"zach@ues.io", "zach@ues.io"},
					},
					BCC: []*mail.Email{
						{"gregg@ues.io", "gregg@ues.io"},
						{"zach@ues.io", "zach@ues.io"},
					},
				}},
			},
		},
		{
			"backwards compatibility - support all lowercase parameter names",
			map[string]interface{}{
				// Use []interface{} type here, as that is what we get when the input comes from other Bots
				"to":          []interface{}{"abel@ues.io", "zach@ues.io"},
				"cc":          []interface{}{"wessel@ues.io", "zach@ues.io"},
				"bcc":         []interface{}{"gregg@ues.io", "zach@ues.io"},
				"from":        "ben@ues.io",
				"contenttype": "text/plain",
				"subject":     "Another email",
				"plainbody":   "This is an email",
			},
			&mail.SGMailV3{
				From:    &mail.Email{"ben@ues.io", "ben@ues.io"},
				Subject: "Another email",
				Content: []*mail.Content{{
					Type:  "text/plain",
					Value: "This is an email",
				}},
				Personalizations: []*mail.Personalization{{
					To: []*mail.Email{
						{"abel@ues.io", "abel@ues.io"},
						{"zach@ues.io", "zach@ues.io"},
					},
					CC: []*mail.Email{
						{"wessel@ues.io", "wessel@ues.io"},
						{"zach@ues.io", "zach@ues.io"},
					},
					BCC: []*mail.Email{
						{"gregg@ues.io", "gregg@ues.io"},
						{"zach@ues.io", "zach@ues.io"},
					},
				}},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := createMessage(tt.requestOptions)
			assert.Equal(t, got.Subject, tt.want.Subject, "Subject")
			assert.Equal(t, got.TemplateID, tt.want.TemplateID, "TemplateId")
			assert.Equal(t, got.Content, tt.want.Content, "Content")
			assert.Equal(t, got.From, tt.want.From, "From")
			assert.Equal(t, got.Personalizations[0].To, tt.want.Personalizations[0].To, "Personalizations: To")
			assert.Equal(t, got.Personalizations[0].CC, tt.want.Personalizations[0].CC, "Personalizations: CC")
			assert.Equal(t, got.Personalizations[0].BCC, tt.want.Personalizations[0].BCC, "Personalizations: BCC")
		})
	}
}
