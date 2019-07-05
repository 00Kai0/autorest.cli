# Frontdoor

> see https://aka.ms/autorest

This is the AutoRest configuration file for Frontdoor.

---

## Getting Started

To build the SDK for Frontdoor, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`

To see additional help and options, run:

> `autorest --help`

---

## Configuration

### Basic Information

These are the global settings for the Frontdoor API.

``` yaml
title: FrontdoorClient
openapi-type: arm
```

### All included files should be added here

``` yaml
input-file:
- /azure-rest-api-specs/specification/frontdoor/resource-manager/Microsoft.Network/stable/2019-04-01/frontdoor.json
```

---

# Code Generation

## devops

These settings apply only when `--devops` is specified on the command line.

``` yaml $(devops)
devops:
  cli-name: frontdoor
  azure-arm: true
  license-header: MICROSOFT_MIT_NO_VERSION
  payload-flattening-threshold: 2
  namespace: azure.mgmt.frontdoor
  package-name: azure-mgmt-frontdoor
  clear-output-folder: false
  debug: true
  #disable-mm: true
  disable-azure-cli: true
```
