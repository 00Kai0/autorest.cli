import { AutoRestExtension } from "autorest-extension-base";
import * as yaml from "node-yaml";
import { MapGenerator } from "./MapGenerator"
import { MapFlattener } from "./MapFlattener"
import { CodeModel } from "./CodeModel"
import { GenerateMagicModulesInput } from "./TemplateMagicModulesInput"
import { GenerateExampleAnsibleRest } from "./AnsibleExampleRest"
import { GenerateExampleAnsibleRrm } from "./AnsibleExample"
import { GenerateExamplePythonRest } from "./TemplateExamplePythonRest"
import { GenerateMagicModulesAnsibleExample } from "./TemplateMagicModulesAnsibleExample"

import { ExampleProcessor } from "./ExampleProcessor";
import { Example } from "./Example";
import { Adjustments } from "./Adjustments";

export type LogCallback = (message: string) => void;

//
const extension = new AutoRestExtension();

extension.Add("azureresourceschema", async autoRestApi => {
  // read files offered to this plugin
  const inputFileUris = await autoRestApi.ListInputs();
  const inputFiles = await Promise.all(inputFileUris.map(uri => autoRestApi.ReadFile(uri)));

  // get settings
  const isDebugFlagSet = await autoRestApi.GetValue("debug");
  const namespace = await autoRestApi.GetValue("namespace");

  let adjustments = await autoRestApi.GetValue("adjustments");
  if (adjustments == null) adjustments = {};
  let adjustmentsObject = new Adjustments(adjustments);
  let debug = await autoRestApi.GetValue("debug");

  // emit a messages
  autoRestApi.Message({
    Channel: "information",
    Text: "adjustments " + JSON.stringify(adjustments)
  });

  // emit a messages
  //autoRestApi.Message({
  //  Channel: "warning",
  //  Text: "Hello World! The `debug` flag is " + (isDebugFlagSet ? "set" : "not set"),
  //});
  //autoRestApi.Message({
  //  Channel: "information",
  //  Text: "AutoRest offers the following input files: "  + inputFileUris.join("\n"),
  //});

  for (var iif in inputFiles)
  {
    let swagger = JSON.parse(inputFiles[iif]);
    let exampleProcessor = new ExampleProcessor(swagger);
    let examples: Example[] = exampleProcessor.GetExamples();
    let mapGenerator = new MapGenerator(swagger, adjustmentsObject, examples, debug, function(msg: string) {
      autoRestApi.Message({
        Channel: "warning",
        Text: msg
      });
    });
  
      let map = null;
      try
      {
        map = mapGenerator.CreateMap();
      } catch (e) {
        autoRestApi.Message({
          Channel: "warning",
          Text: "ERROR " + e.stack,
        });
      }

      // flatten the map using flattener
      let mapFlattener = new MapFlattener(map, adjustmentsObject, debug, function(msg: string) {
        autoRestApi.Message({
          Channel: "warning",
          Text: msg
        });
      });
      mapFlattener.Flatten();

      autoRestApi.WriteFile("intermediate/" + mapGenerator.GetGlobalFilename() + "-input.yml", yaml.dump(swagger));
  
      if (map != null)
      {
        autoRestApi.WriteFile("intermediate/" + mapGenerator.GetGlobalFilename() + "-map-pre.yml", yaml.dump(map));

        // Generate raw REST examples
        for (var i = 0; i < examples.length; i++)
        {
          var example: Example = examples[i];
          var filename = example.Filename;
          autoRestApi.WriteFile("intermediate/examples_rest/" + filename + ".yml", GenerateExampleAnsibleRest(example));
          autoRestApi.WriteFile("intermediate/examples_python/" + filename + ".yml", GenerateExamplePythonRest(example).join('\r\n'));
        }

        // generate modules & mm input files
        let index = 0;
        while (index < map.Modules.length) {
          let model = new CodeModel(map, index);
          try
          {
            autoRestApi.Message({
              Channel: "information",
              Text: "PROCESSING " + model.ModuleName + " [" + (index + 1) + " / " + map.Modules.length + "]"
            });

            if (!model.ModuleName.endsWith('_info')) {
              autoRestApi.WriteFile("magic-modules-input/" + model.ModuleName + "/api.yaml", GenerateMagicModulesInput(model).join('\r\n'));
            } else {
              // info modules to be implemented
            }

            // generate magic modules input example files
            let moduleExamples: Example[] = model.ModuleExamples;
            for (let exampleIdx in moduleExamples)
            {
              var example = moduleExamples[exampleIdx];
              var filename = example.Filename;
              autoRestApi.WriteFile("intermediate/examples_rrm/" + filename + ".yml", GenerateExampleAnsibleRrm(example, model.Module).join('\r\n'));
              autoRestApi.WriteFile("magic-modules-input/" + model.ModuleName + "/examples/ansible/" + filename + ".yml", GenerateMagicModulesAnsibleExample(example, model.Module).join('\r\n'));
            }
          }
          catch (e)
          {
            autoRestApi.Message({
              Channel: "warning",
              Text: "ERROR " + e.stack,
            });
          }
          index++;
        }

        // write map after everything is done
        autoRestApi.WriteFile("intermediate/" + mapGenerator.GetGlobalFilename() + "-map.yml", yaml.dump(map));
      }
  }
});

extension.Run();