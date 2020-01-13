﻿/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModelAz } from "./CodeModelAz"
import { EscapeString, ToCamelCase, Capitalize } from "../Common/Helpers";

export function GenerateAzureCliParams(model: CodeModelAz) : string[] {
    let output: string[] = [];
    let hasActions: boolean = false;
    let hasBoolean: boolean = false;
    let hasEnum: boolean = false;
    let actions: string[] = [];
        
    var output_args: string[] = [];

    output_args.push("");
    output_args.push("");
    output_args.push("def load_arguments(self, _):");
    //output.push("    name_arg_type = CLIArgumentType(options_list=('--name', '-n'), metavar='NAME')");

    if (model.SelectFirstCommandGroup())
    {
        do
        {
            //let methods: string[] = model.CommandGroup_Commands;
            
            if (model.SelectFirstCommand())
            {
                do
                {
                    //let method: string = methods[mi];

                    //let ctx = model.SelectCommand(method);
                    //if (ctx == null)
                    //    continue;

                    output_args.push("");
                    output_args.push("    with self.argument_context('" + model.Command_Name + "') as c:");

                    if (!model.SelectFirstOption())
                    {
                        output_args.push("        pass");
                    }
                    else
                    {
                        do
                        {
                            //let parameterName: string = element.Name.split("-").join("_");
                            let parameterName = model.Option_NameUnderscored;

                            let argument = "        c.argument('" + parameterName + "'";

                            // this is to handle names like "format", "type", etc
                            if (parameterName == "type" || parameterName == "format")
                            {
                                argument = "        c.argument('_" + parameterName + "'";
                                argument += ", options_list=['--" + parameterName + "']";
                            }

                            if (model.Option_Type == "boolean")
                            {
                                hasBoolean = true;
                                argument += ", arg_type=get_three_state_flag()";
                            }
                            else if ((model.Option_EnumValues.length > 0) && !model.Option_IsList)
                            {
                                hasEnum = true;
                                argument += ", arg_type=get_enum_type([";

                                model.Option_EnumValues.forEach(element => {
                                    if (!argument.endsWith("[")) argument += ", ";
                                    argument += "'" + element + "'";
                                });
                                argument += "])";
                            }

                            if (parameterName == "resource_group")
                            {
                                argument += ", resource_group_name_type";
                            }
                            else if (parameterName == "tags")
                            {
                                argument += ", tags_type";
                            }
                            else if (parameterName == "location")
                            {
                                argument += ", arg_type=get_location_type(self.cli_ctx)";
                            }
                            else
                            {
                                argument += ", id_part=None, help='" + EscapeString(model.Option_Description) + "'"; 
                            }

                            if (model.Option_IsList)
                            {
                                if (model.Option_Type == "dict")
                                {
                                    let actionName: string = "PeeringAdd" + Capitalize(ToCamelCase(model.Option_Name));
                                    argument += ", action=" + actionName;
                                    hasActions = true;

                                    if (actions.indexOf(actionName) < 0)
                                    {
                                        actions.push(actionName);
                                    }
                                }
                                argument += ", nargs='+'";
                            }

                            argument += ")";

                            output_args.push(argument);
                        } while (model.SelectNextOption());
                    }
                }
                while (model.SelectNextCommand());
            }
        } while (model.SelectNextCommandGroup());
    }
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# pylint: disable=line-too-long");
    output.push("# pylint: disable=too-many-lines");
    output.push("# pylint: disable=too-many-statements");   
    output.push("");
    //output.push("from knack.arguments import CLIArgumentType");
    output.push("from azure.cli.core.commands.parameters import (");
    output.push("    tags_type,");
    //output.push("    get_resource_name_completion_list,");
    //output.push("    quotes,");
    if (hasBoolean) output.push("    get_three_state_flag,");
    if (hasEnum) output.push("    get_enum_type,");
    output.push("    resource_group_name_type,");
    output.push("    get_location_type");
    output.push(")");
    //output.push("from azure.cli.core.commands.validators import get_default_location_from_resource_group");

    if (hasActions)
    {
        output.push("from azext_" + model.Extension_NameUnderscored + ".action import (")

        for (let idx: number = 0; idx < actions.length; idx++)
        {
            let action = actions[idx];
            output.push("    " + action + (idx < actions.length - 1 ? "," : ""));
        }
        output.push(")")
    }

    output = output.concat(output_args);

    output.push("");
    return output;
}
