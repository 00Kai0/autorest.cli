"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const ModuleMap_1 = require("./ModuleMap");
const Helpers_1 = require("./Helpers");
class MapFlattener {
    constructor(map, optionOverride, cmdOverride, log) {
        this._map = null;
        this._map = map;
        this._optionOverride = optionOverride;
        this._cmdOverride = cmdOverride;
        this._log = log;
    }
    Transform() {
        for (let mi in this._map.Modules) {
            for (let regex in this._cmdOverride) {
                let regexp = new RegExp(regex);
                if (this._map.Modules[mi].CommandGroup.match(regexp)) {
                    this._map.Modules[mi].CommandGroup = this._cmdOverride[regex].replace("*", this._map.CliName);
                }
            }
            // process top level options, right now it will rename xxx_name -> name
            this.ProcessTopLevelOptions(this._map.Modules[mi].Options);
            // here we perform flattening of the option according to current rules
            this._map.Modules[mi].Options = this.FlattenOptions(this._map.Modules[mi].Options, "/");
            // apply options override as a final step
            this.ApplyOptionOverride(this._map.Modules[mi].Options);
        }
    }
    ProcessTopLevelOptions(options) {
        for (let i = options.length - 1; i >= 0; i--) {
            let option = options[i];
            // OPTIONS ARE NOT SORTED CORRECTLY
            // SO THERE'S option.NameAnsible != "resource_group_name" hack here
            if (option.Kind == ModuleMap_1.ModuleOptionKind.MODULE_OPTION_PATH && option.NameAnsible != "resource_group_name" && option.NameAnsible.endsWith('_name')) {
                option.NameAnsible = "name";
                option.NameTerraform = "name";
                break;
            }
            else {
            }
            // if the option is already part of the resource URL and doesn't end with name, don't rename
            //if (option.IdPortion != null && option.IdPortion != "")
            //    break;
        }
        for (let oi in options) {
            if (options[oi].NameAnsible == "resource_group_name") {
                options[oi].NameAnsible = "resource_group";
                options[oi].NameGoSdk = "ResourceGroup";
                options[oi].NameTerraform = "resourceGroup";
            }
            if (options[oi].Type != "dict")
                options[oi].Updatable = false;
        }
    }
    FlattenOptions(options, path) {
        for (let i = options.length - 1; i >= 0; i--) {
            let option = options[i];
            let suboptions = option.SubOptions;
            if (suboptions != null) {
                let optionPath = (((path != "/") ? path : "") + "/" + option.NameSwagger).toLowerCase();
                //if (this._debug) this._log("flattener: checking path - " + optionPath);
                suboptions = this.FlattenOptions(suboptions, ((path != "/") ? path : "") + "/" + option.NameSwagger);
                // all the suboptions of current option will be attached at the end
                this._log("flattener: found path - " + optionPath);
                for (let si in suboptions) {
                    let dispositionRest = option.DispositionRest.replace("*", option.NameSwagger); // + "/" + suboptions[si].DispositionRest.replace("*", suboptions[si].NameSwagger);
                    let dispositionSdk = option.DispositionSdk.replace("*", option.NamePythonSdk); // + "/" + suboptions[si].DispositionSdk.replace("*", suboptions[si].NamePythonSdk);
                    if (path == "/") {
                        dispositionRest += option.NameSwagger;
                        if (option.NamePythonSdk != "properties") {
                            dispositionSdk += option.NamePythonSdk;
                        }
                        else {
                            dispositionSdk = "";
                        }
                    }
                    dispositionRest += "/" + suboptions[si].DispositionRest;
                    dispositionSdk += "/" + suboptions[si].DispositionSdk;
                    //if (path == "/")
                    //{
                    //    dispositionRest = "/properties/" + dispositionRest;
                    //    dispositionSdk = "/" + dispositionSdk;
                    //}
                    //else
                    //{
                    //    dispositionRest = "properties/" + dispositionRest;
                    //}
                    suboptions[si].DispositionRest = dispositionRest;
                    suboptions[si].DispositionSdk = dispositionSdk;
                    if (path != "/") {
                        suboptions[si].NameAnsible = option.NameAnsible + "_" + suboptions[si].NameAnsible;
                        suboptions[si].NameTerraform = option.NameTerraform + suboptions[si].NameAnsible;
                    }
                    // this happens only when parent is list of dictionaries containing single element
                    // so the element becomes a list itself
                    // we also inherit documentation from parent as it's usually more relevant
                    if (option.IsList) {
                        suboptions[si].IsList = option.IsList;
                        suboptions[si].Documentation = option.Documentation;
                    }
                }
                options = options.slice(0, i + 1).concat(suboptions, options.slice(i + 1));
                options[i].SubOptions = [];
                options[i].Hidden = true;
            }
        }
        return options;
    }
    ApplyOptionOverride(options) {
        if (this._optionOverride == null)
            return;
        options.forEach(option => {
            this.ApplyOptionOverrideToSingleOption(option);
            if (option.SubOptions != null)
                this.ApplyOptionOverride(option.SubOptions);
        });
    }
    ApplyOptionOverrideToSingleOption(option) {
        for (let k in this._optionOverride) {
            let regexp = new RegExp(k);
            if (!option.NameAnsible.match(regexp))
                continue;
            let override = this._optionOverride[k];
            let name = override['name'];
            let readonly = override['readonly'];
            let doc = override['doc'];
            let docReplace = override['doc-replace'];
            if (name != undefined) {
                option.NameAnsible = name;
                option.NameTerraform = Helpers_1.ToGoCase(name);
            }
            if (readonly != undefined) {
                option.IncludeInArgSpec = !readonly;
            }
            if (doc != undefined) {
                option.Documentation = doc;
            }
            if (docReplace != undefined) {
                for (let rex in docReplace) {
                    let regexp = new RegExp(rex);
                    option.Documentation = option.Documentation.replace(regexp, docReplace[rex]);
                }
            }
        }
    }
}
exports.MapFlattener = MapFlattener;
