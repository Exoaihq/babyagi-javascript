// Here's the converted code to JavaScript:

// ```javascript
const openai = require("openai");
const axios = require("axios");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function openaiCall(prompt, maxTokens = 2000) {
  while (true) {
    try {
      const response = await openai.Completion.create({
        engine: "davinci-codex",
        prompt: prompt,
        max_tokens: maxTokens,
        n: 1,
        stop: null,
        temperature: 0.5,
      });
      return response.choices[0].text.trim();
    } catch (error) {
      if (error instanceof openai.errors.RateLimitError) {
        console.log(
          "   *** OpenAI API rate limit exceeded. Waiting 60 seconds and trying again. ***"
        );
        await sleep(60000);
      } else if (error instanceof openai.errors.AuthenticationError) {
        console.log(
          "   *** OpenAI API authentication error. Check your API key and try again. ***"
        );
        break;
      } else if (error instanceof openai.errors.NetworkError) {
        console.log(
          "   *** OpenAI API network error. Check your network settings, proxy configuration, SSL certificates, or firewall rules. Waiting 10 seconds and trying again. ***"
        );
        await sleep(10000);
      } else if (error instanceof openai.errors.InvalidRequestError) {
        console.log(
          "   *** OpenAI API invalid request. Check the documentation for the specific API method you are calling and make sure you are sending valid and complete parameters. Waiting 10 seconds and trying again. ***"
        );
        await sleep(10000);
      } else if (error instanceof openai.errors.ServiceUnavailableError) {
        console.log(
          "   *** OpenAI API service unavailable. Waiting 10 seconds and trying again. ***"
        );
        await sleep(10000);
      } else {
        break;
      }
    }
  }
}

// The rest of the code remains the same, just replace the `time.sleep()` calls with `await sleep()` and use async/await for the functions.
```

Remember to install the required packages using npm:

```
npm install openai axios
```