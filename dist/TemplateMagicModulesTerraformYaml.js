"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function GenerateMagicModulesTerraformYaml(model) {
    var output = [];
    output.push("--- !ruby/object:Provider::Azure::Terraform::Config");
    output.push("author: audevbot");
    output.push("version_added: \"2.9\"");
    output.push("overrides: !ruby/object:Overrides::ResourceOverrides");
    output.push("  " + model.ObjectName + ": !ruby/object:Provider::Azure::Terraform::ResourceOverride");
    output.push("    properties: {}");
    output.push("");
    return output;
}
exports.GenerateMagicModulesTerraformYaml = GenerateMagicModulesTerraformYaml;
