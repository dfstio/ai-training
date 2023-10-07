import OpenAI from "openai";
import { CHATGPT_TOKEN, CHATGPT_ORG } from "../env.json";
import { fineTuningData } from "./finetunedata";
import fsp from "fs/promises";
import fs from "fs";

async function main() {
  const openai = new OpenAI({
    organization: CHATGPT_ORG,
    apiKey: CHATGPT_TOKEN,
  });
  let list;


  let data: string = "";

  let k = 0;
  for (k = 0; k < 5; k++) {
    let i = 0;
    for (i = 0; i < fineTuningData.length; i++) {
      data +=
        `{"messages": [{"role": "assistant", "content": "${fineTuningData[i]
          .replaceAll("\n", " ")
          .replaceAll("\t", " ")}"}]}` + (
          (i == fineTuningData.length - 1 && k == 4)
            ? ""
            : "\n");
    }
  }
  await fsp.writeFile("ft1.jsonl", data);


  console.log("files:");
  list = await openai.files.list();

  for await (const file of list) {
    console.log(file);
    console.log(`deleting file ${file.id}...`);
    await openai.files.del(file.id);
  }

  console.log("create file:");
  await openai.files.create({
    file: fs.createReadStream("ft1.jsonl"),
    purpose: "fine-tune",
  });


  console.log("files:");
  list = await openai.files.list();

  for await (const file of list) {
    console.log(file);
  }

  const fineTuneJobb = await openai.fineTuning.jobs.create({
    training_file: 'file-XXXXXXXXXXXXXX',  //"ft1.jsonl", 
    model: "gpt-3.5-turbo-0613",
    suffix: "YYYYYYY"
  });

  console.log(fineTuneJob);



  const fineTune = await openai.fineTuning.jobs.retrieve('ftjob-ZZZZZZZZZ');

  console.log(fineTune);

  /*
  Your fine-tuning job ftjob-ZZZZZZZZZZZ has successfully completed, 
  and a new model ft:gpt-3.5-turbo-0613:dfst-io:YYYYYYYY:AAAAAA has been created for your use.
  */

  const completion = await openai.chat.completions.create({
    model: `ft:gpt-3.5-turbo-0613:dfst-io:YYYYYYYY:AAAAAA`,
    messages: [
      {
        role: "system",
        content:
          "AAAAAA",
      },
      {
        role: "user",
        content:
          "YOUR QUESTION",
      },
    ],
  });
  console.log(completion.choices[0]);
}

main().catch((error) => {
  console.error(error);
});
