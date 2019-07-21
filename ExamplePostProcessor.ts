﻿import { MapModuleGroup, ModuleOption, ModuleMethod, Module, EnumValue } from "./ModuleMap"
import { Example, ExampleVariable } from "./Example"

export enum ExampleType
{
    Ansible,
    AnsibleCollection,
    Terraform
}

export class ExamplePostProcessor
{
    public constructor (module: Module)
    {
        this._module = module;
    }

    public GetExampleAsDictionary(example: Example): any
    {
        let dict = {};

        this.CreateDictionaryFromParameters(dict, example.CloneExampleParameters(), "", 0);
        return dict;
    }

    public CreateDictionaryFromParameters(dict: any, example: any, path: string, level: number)
    {
        for (let k in example) {
            if (typeof example[k] == "string" || typeof example[k] == "boolean" || typeof example[k] == "string")
            {
                dict[(path == "") ? k : (path + k)] = example[k];
            }
            else if (typeof example[k] == "object")
            {
                if (!(example[k] instanceof Array))
                {
                    if (level == 0)
                    {
                        // "parameters" shouldnt be included in the path
                        this.CreateDictionaryFromParameters(dict, example[k], "/", level + 1);
                    }
                    else
                    {
                        this.CreateDictionaryFromParameters(dict, example[k], path + k + "/", level + 1);
                    }
                }
                // XXX - handle arrays
            }
        }
    }

    public ProcessExample(example: Example, type: ExampleType, useVars: boolean): any
    {
        let e: any = {};

        e['name'] = example.Name;
        e[(type == ExampleType.AnsibleCollection) ? this._module.ModuleName.split("_").join(".") : this._module.ModuleName] = this.GetExampleProperties(example, type, useVars);

        return e;
    }

    public GetExampleProperties(example: Example, type: ExampleType, useVars: boolean)
    {
        //let compare: string[] = [];

        // find method & options
        let foundMethod: ModuleMethod = null;
        for (let x in this._module.Methods)
        {
            let method = this._module.Methods[x];

            //compare.push("COMPARE " + method.Url + "/" + method.HttpMethod + " --- " + example.Url + "/" + example.Method);
            if ((method.Url == example.Url) && (method.HttpMethod == example.Method))
            {
                //compare.push("FOUND!")
                foundMethod = method;
                break;
            }
        }

        if (foundMethod == null)
            return null; //compare;

        // just get module options
        let options: ModuleOption[] = this._module.Options;

        let response = this.ExampleFromOptions(options, example.CloneExampleParameters(), example.Variables, useVars, 0);

        if (foundMethod.HttpMethod.toLowerCase() == "delete")
        {
            response['state'] = 'absent';
        }

        return response;
    }

    private ExampleFromOptions(options: ModuleOption[], example: any, variables: ExampleVariable[], useVars: boolean, level: number): any
    {
        let response: any = {};

        for (let optionIdx in options)
        {
            let option = options[optionIdx];

            // XXX - this should not be passed
            if (option.NameSwagger == "parameters")
                continue;

            if (option.Hidden)
                continue;

            let value = undefined;
            
            if (option.DispositionRest == "*")
            {
                value = example[option.NameSwagger];
            }
            else if (option.DispositionRest.startsWith("/") && (example['parameters'] != undefined))
            {
                if (option.DispositionRest == "/")
                {
                    value = example['parameters'];
                    if (value != undefined) value = value[option.NameSwagger];
                }
                else
                {
                    // XXX - just a quick hack for now....
                    let parts = option.DispositionRest.split("/");
                    value = example['parameters']
                
                    if (value != undefined)
                    {
                        for (let didx = 1; didx < parts.length; didx++)
                        {
                            let name = parts[didx];
                            if (name == "*")
                                name = option.NameSwagger;
                            value = value[name];
        
                            if (value == undefined)
                                break;
                        }
                    }
                }

            }
            else
            {
                let parts = option.DispositionRest.split("/");
                value = example;
                
                for (let didx = 0; didx < parts.length; didx++)
                {
                    let name = parts[didx];
                    if (name == "*")
                        name = option.NameSwagger;
                    value = value[name];

                    if (value == undefined)
                        break;
                }
            }

            // don't include option of couldnt' find value in sample
            if (value == undefined)
            {
                    //response[option.NameAnsible] = {
                    //    'x-disposition': option.Disposition,
                    //    'x-example': JSON.stringify(example)
                    //};
                    continue;
            }

            // 
            if (option.DispositionRest == "*" && (level == 0))
            {
                for (let vi in variables)
                {
                    if (variables[vi].swaggerName == option.NameSwagger)
                    {
                        if (useVars)
                        {
                            value = '{{' + variables[vi].name + '}}';
                        }
                        else
                        {
                            value = variables[vi].value;
                        }
                    }
                }
            }

            //if (value == undefined)
            //{
            //    value = "---" + option.NameSwagger + "---";
            //    for (let k in example) value += k + "-"; 
            //}

            // XXX - fix it here
            if (value instanceof Array)
            {
                response[option.NameAnsible] = [];

                value.forEach(element => {

                    if (option.SubOptions != null && option.SubOptions.length > 0)
                    {
                        response[option.NameAnsible].push(this.ExampleFromOptions(option.SubOptions, element, example.Variables, useVars, level + 1));
                    }
                    else
                    {
                        response[option.NameAnsible].push(element);
                        option.ExampleValue = element;
                    }
                });
            }
            else
            {
                if (option.SubOptions != null && option.SubOptions.length > 0)
                {
                        response[option.NameAnsible] = this.ExampleFromOptions(option.SubOptions, value, example.Variables, useVars, level + 1);
                }
                else
                {
                    response[option.NameAnsible] = value;
                    option.ExampleValue = value;
                }
            }
        }

        return response;
    }

    private _module: Module;
}
