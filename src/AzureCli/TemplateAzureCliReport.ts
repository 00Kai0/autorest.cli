﻿/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModelCli } from "./CodeModelCli"
import { CommandExample } from "./CodeModelCliImpl"

export function GenerateAzureCliReport(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("# Azure CLI Module Creation Report");
    output.push("");

    let cmds = {};
    
    do
    {
        var mo: string[] = [];
        mo.push("## " + model.Command_Name);
        mo.push("");

        let methods: string[] = model.GetCliCommandMethods();
        for (let mi = 0; mi < methods.length; mi++)
        {
            // create, delete, list, show, update
            let method: string = methods[mi];
            // options
            let ctx = model.SelectMethod(method);
            if (ctx == null)
                continue;

            mo.push("### " + model.Command_Name + " " + method);
            mo.push("");
            mo.push(method + " a " + model.Command_Name +  ".");
            mo.push("");

            mo.push("|Option|Type|Description|Path (SDK)|Path (swagger)|");
            mo.push("|------|----|-----------|----------|--------------|");


            model.SelectFirstOption();

            // first parameters that are required
            do
            {
                if (model.Option_Type != "placeholder" && model.Option_IsRequired)
                {
                    mo.push("|**--" + model.Option_Name + "**|" + model.Option_Type + "|" + model.Option_Description + "|" + model.Option_PathSdk + "|" + model.Option_PathSwagger + "|");
                }
            }
            while (model.SelectNextOption());

            model.SelectFirstOption();

            // following by required parameters
            do {
                if (model.Option_Type != "placeholder" && !model.Option_IsRequired)
                {
                    mo.push("|--" + model.Option_Name + "**|" + model.Option_Type + "|" + model.Option_Description + "|" + model.Option_PathSdk + "|" + model.Option_PathSwagger + "|");
                }
            }
            while (model.SelectNextOption());


            if (model.SelectFirstExample())
            {
                do
                {
                    mo.push("");
                    mo.push ("**Example: " + model.Example_Title + "**");
                    mo.push("");
                    mo.push("```");

                    let next: string = model.Command_Name + " " + method + " ";
                    for (let k in model.Example_Params)
                    {
                        let v: string = model.Example_Params[k];
                        if (/\s/.test(v))
                        {
                            v = "\"" + v.replace("\"", "\\\"") + "\"";
                        }

                        next += k + " " + v;
                        mo.push(next);
                        next = "        ";
                    }
                    mo.push("```");
                } while (model.SelectNextExample());
            }
                        
        }

        cmds[model.Command_Name] = mo;
    } while (model.SelectNextCmdGroup());;

    // build sorted output
    var keys = Object.keys(cmds);
    keys.sort();

    for (var i = 0; i < keys.length; i++)
    {
        output = output.concat(cmds[keys[i]]);
    } 

    return output;
}
