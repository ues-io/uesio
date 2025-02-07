#!/bin/bash

CERT_FILE="$PWD/certificate.crt"

if [ -f "$CERT_FILE" ]; then
    echo "SSL certificate already exists. Delete the existing certificate and re-run to generate a new SSL certificate."
else
  # Generate a new primary key
  openssl req -new -x509 -newkey rsa:2048 -sha256 -nodes -keyout private.key -days 3560 -out "$CERT_FILE" -config config.txt
  echo "SSL Certificate and private key created!"

  # OS X shortcut to automatically trust the certificate
  if [[ "$(uname)" == "Darwin" ]]; then
    sudo security add-trusted-cert -d -r trustRoot -k "/Library/Keychains/System.keychain" "$CERT_FILE"
  else
    # Update CA certificates so that CLI and Curl will not complain when connecting
    # to our local Uesio instance with self-signed certificate
    # TODO: update-ca-certificates should be fairly portable across distros but may need to handle differently in some cases
    sudo cp "$CERT_FILE" /usr/local/share/ca-certificates/
    sudo update-ca-certificates
  fi
  echo "System certificate trust store updated to trust SSL certificate!"
fi

