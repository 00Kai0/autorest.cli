# Recovery Services

> see https://aka.ms/autorest

This is the AutoRest configuration file for Batch.

---

## Getting Started

To build the SDK for AlertsManagement, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`

To see additional help and options, run:

> `autorest --help`

---

## Configuration

### Basic Information

These are the global settings for the Alerts Management.

``` yaml
title: RecoveryServices
openapi-type: arm
```

### All included files should be added here

``` yaml
input-file:
  - Microsoft.AlertsManagement/preview/2019-05-05-preview/AlertsManagement.json
  - Microsoft.AlertsManagement/stable/2019-06-01/SmartDetectorAlertRulesApi.json
```

---

# Code Generation

## devops

These settings apply only when `--devops` is specified on the command line.

``` yaml $(devops)
devops:
  cli-name: alerts
  azure-arm: true
  license-header: MICROSOFT_MIT_NO_VERSION
  payload-flattening-threshold: 2
  namespace: azure.mgmt.alertsmanagement
  package-name: azure-mgmt-alertsmanagemenent
  clear-output-folder: false
  debug: true
  adjustments:
    "/sku": "Sku*/"
  disable-mm: true
```
