﻿/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CodeModelCli, CommandParameter, CommandContext } from "./CodeModelCli"
import { Indent, ToSnakeCase, ToCamelCase } from "../Common/Helpers";
import { MapModuleGroup, ModuleOption, ModuleMethod, Module } from "../Common/ModuleMap"

function PythonParameterName(name: string): string
{
    let newName = name.split("-").join("_");
    if (newName == "type" || newName == "format")
    {
        newName = "_" + newName;
    }

    return newName;
}

export function GenerateAzureCliCustom(model: CodeModelCli) : string[] {
    var output: string[] = [];

    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# Copyright (c) Microsoft Corporation. All rights reserved.");
    output.push("# Licensed under the MIT License. See License.txt in the project root for license information.");
    output.push("# --------------------------------------------------------------------------------------------");
    output.push("# pylint: disable=line-too-long");
    output.push("# pylint: disable=too-many-statements");   
    output.push("# pylint: disable=too-many-lines");
    output.push("# pylint: disable=too-many-locals");
    output.push("# pylint: disable=unused-argument");
    //output.push("from knack.util import CLIError");

    let required: any = {};
    let body: string[] = GenerateBody(model, required);

    if (required['json'])
    {
        output.push("import json");
    }

    output = output.concat(body);
    output.push("");

    return output;
}


function GenerateBody(model: CodeModelCli, required: any) : string[] {
    var output: string[] = [];

    do
    {
        let methods: string[] = model.GetCliCommandMethods();
        for (let methodName of methods)
        {
            // create, delete, list, show, update

            // all methods are custom now for simplicity
            //if (methodName == "show")
            //    continue;

            if (!model.SelectMethod(methodName))
                continue;

            output.push("");
            output.push("");

            //
            // method
            //
            let updatedMethodName = (methodName != "show") ? methodName : "get";
            let call = "def " + updatedMethodName + "_" + model.GetCliCommandX().split(" ").join("_").split("-").join("_") + "(";
            let indent = " ".repeat(call.length);
            let isUpdate = (methodName == "update");

            //if (!isUpdate)
            //{
                output.push(call + "cmd, client");
            //}
            //else
            //{
            //    output.push(call + "cmd, client, body");
            //}

            let params: CommandParameter[] = model.GetSelectedCommandParameters();
 
            // first parameters that are required
            for (let element of params)
            {
                let required = element.Required;

                if (element.Type == "placeholder")
                    continue;

                if (isUpdate && element.PathSwagger.startsWith("/"))
                    required = false;

                if (required)
                {
                    let name = PythonParameterName(element.Name);
                    output[output.length - 1] += ",";  
                    output.push(indent + PythonParameterName(element.Name));
                }
            }

            // following by required parameters
            for (let element of params)
            {
                let required = element.Required;

                if (element.Type == "placeholder")
                    continue;

                if (isUpdate && element.PathSwagger.startsWith("/"))
                    required = false;

                if (!required)
                {
                    output[output.length - 1] += ",";  
                    output.push(indent + PythonParameterName(element.Name) + "=None");
                }
            }

            output[output.length - 1] += "):";  

            let output_body: string[] = []
            // create body transformation for methods that support it

            if (methodName != "show" && methodName != "list" && methodName != "delete")
            {
                // body transformation
                if (!isUpdate)
                {
                    output_body.push("    body = {}");
                }
                else
                {
                    if (methods.indexOf("show") >= 0)
                    {
                        model.SelectMethod("show");
                        output_body.push("    body = " + GetMethodCall(model, 0) + ".as_dict()");
                    }
                    else
                    {
                        output_body.push("    body = {}");
                    }
                }
                params.forEach(element => {
                    let access = "    body"
                    if (element.PathSdk.startsWith("/") && element.Type != "placeholder")
                    {
                        let parts = element.PathSdk.split("/");
                        let last: string = parts.pop();
                        parts.forEach(part => {
                            if (part != "" && part != "*")
                            {
                                access += ".setdefault('" + part + "', {})";
                            }
                        });

                        access += "['" + last + "'] = ";

                        if (element.IsList)
                        {
                            if (element.Type != "dict")
                            {
                                // a comma separated list
                                access += "None if " + PythonParameterName(element.Name) + " is None else " + PythonParameterName(element.Name) + ".split(',')";
                            }
                            else
                            {
                                // already preprocessed by actions
                                access += PythonParameterName(element.Name)
                            }
                        }
                        else if (element.Type != "dict")
                        {
                            access += PythonParameterName(element.Name) + "  # " + element.Type; // # JSON.stringify(element);
                        }
                        else
                        {
                            access += "json.loads(" + PythonParameterName(element.Name) + ") if isinstance(" + PythonParameterName(element.Name) + ", str) else " + PythonParameterName(element.Name)
                            required['json'] = true;
                        }
                        
                        if (isUpdate)
                        {
                            output_body.push("    if " + PythonParameterName(element.Name) + " is not None:");
                            output_body.push("    " + access);
                        }
                        else
                        {
                            output_body.push(access);
                        }
                    }
                });
            }

            let output_method_call: string[] = [];
            let hasBody = false;
            for (let methodIdx = 0; methodIdx < model.GetSelectedCommandMethods().length; methodIdx++)
            {
                let prefix = "    ";
                if (model.GetSelectedCommandMethods().length > 1)
                {
                    let ifStatement = prefix;
                    prefix += "    ";

                    if (methodIdx < model.GetSelectedCommandMethods().length - 1)
                    {
                        ifStatement += (methodIdx == 0) ? "if" : "elif";
                        for (let paramIdx = 0; paramIdx < model.GetSelectedCommandMethods()[methodIdx].Parameters.length; paramIdx++)
                        {
                            ifStatement += (paramIdx == 0) ? "" : " and";
                            ifStatement += " " + PythonParameterName(model.GetSelectedCommandMethods()[methodIdx].Parameters[paramIdx].Name) + " is not None"
                        }
                        ifStatement += ":";
                        output_method_call.push(ifStatement);
                    }
                    else
                    {
                        ifStatement == "";
                        prefix = "    ";
                    }
                }
                // call client & return value
                // XXX - this is still a hack

                let methodCall = prefix + "return " + GetMethodCall(model, methodIdx);
                if (model.GetSelectedCommandMethods()[methodIdx].BodyParameterName != null) hasBody = true;
                output_method_call.push(methodCall); 
            };
            
            if (hasBody)
            {
                output = output.concat(output_body);
            }

            output = output.concat(output_method_call);
        }
    } while (model.NextModule());

    return output;
}

function GetMethodCall(model: CodeModelCli, methodIdx: number): string
{
    let methodCall: string = "";
    //methodCall += "client." + mode.GetModuleOperationName() +"." + ctx.Methods[methodIdx].Name +  "(";
    methodCall += "client." + model.GetSelectedCommandMethods()[methodIdx].Name +  "(";

    let bodyParameterName = model.GetSelectedCommandMethods()[methodIdx].BodyParameterName;

    for (let paramIdx = 0; paramIdx < model.GetSelectedCommandMethods()[methodIdx].Parameters.length; paramIdx++)
    {
        let p = model.GetSelectedCommandMethods()[methodIdx].Parameters[paramIdx];
        let optionName = PythonParameterName(p.Name);
        let parameterName = p.PathSdk.split("/").pop();
        
        if (methodCall.endsWith("("))
        {
            // XXX - split and pop is a hack
            methodCall += parameterName + "=" + optionName;
        }
        else
        {
            methodCall += ", " + parameterName + "=" + optionName;
        }
    }

    if (bodyParameterName != null)
    {
        if (methodCall.endsWith("("))
        {
            // XXX - split and pop is a hack
            methodCall += bodyParameterName + "=body";
        }
        else
        {
            methodCall += ", " + bodyParameterName + "=body";
        }
    }

    methodCall += ")";

    return methodCall;
}
