"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateAzureCliCustom(model) {
    var output = [];
    output.push("# ");
    //# --------------------------------------------------------------------------------------------
    //# Copyright (c) Microsoft Corporation. All rights reserved.
    //# Licensed under the MIT License. See License.txt in the project root for license information.
    //# --------------------------------------------------------------------------------------------
    //from knack.util import CLIError
    do {
        for (let mi in model.ModuleMethods) {
            // create, delete, list, show, update
            let method = model.ModuleMethods[mi];
            output.push("");
            output.push("");
            output.push("def create_apimanagement(cmd, client, resource_group_name, apimanagement_name, location=None, tags=None):");
            output.push("    raise CLIError('TODO: Implement `apimanagement create`')");
        }
    } while (model.NextModule());
    //def create_apimanagement(cmd, client, resource_group_name, apimanagement_name, location=None, tags=None):
    //    raise CLIError('TODO: Implement `apimanagement create`')
    //def list_apimanagement(cmd, client, resource_group_name=None):
    //    raise CLIError('TODO: Implement `apimanagement list`')
    //def update_apimanagement(cmd, instance, tags=None):
    //    with cmd.update_context(instance) as c:
    //        c.set_param('tags', tags)
    //    return instance
    return output;
}
exports.GenerateAzureCliCustom = GenerateAzureCliCustom;
