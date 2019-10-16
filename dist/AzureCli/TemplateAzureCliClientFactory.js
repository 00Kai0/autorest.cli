"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateAzureCliClientFactory(model) {
    var output = [];
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("");
    output.push("");
    output.push("def cf_" + model.GetCliCommandModuleName() + "(cli_ctx, *_):");
    output.push("    from azure.cli.core.commands.client_factory import get_mgmt_service_client");
    output.push("    from .vendored_sdks." + model.PythonOperationsName + " import " + model.MgmtClientName);
    output.push("    return get_mgmt_service_client(cli_ctx, " + model.MgmtClientName + ")");
    do {
        // this is a hack, as everything can be produced from main module now
        if (model.ModuleName.endsWith("_info"))
            continue;
        output.push("");
        output.push("");
        output.push("def cf_" + model.ModuleOperationName + "(cli_ctx, *_):");
        output.push("    return cf_" + model.GetCliCommandModuleName() + "(cli_ctx)." + model.ModuleOperationName);
    } while (model.NextModule());
    output.push("");
    return output;
}
exports.GenerateAzureCliClientFactory = GenerateAzureCliClientFactory;
