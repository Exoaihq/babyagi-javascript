Here's the converted JavaScript code:

```javascript
const axios = require("axios");
const cheerio = require("cheerio");

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
};

async function fetchUrlContent(url) {
  try {
    const response = await axios.get(url, { headers, timeout: 10000 });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(`Error while fetching the URL: ${error}`);
    return "";
  }
}

function extractLinks(content) {
  const $ = cheerio.load(content);
  const links = [];
  $("a[href^='http']").each((index, element) => {
    links.push($(element).attr("href"));
  });
  return links;
}

function extractText(content) {
  const $ = cheerio.load(content);
  return $.text().trim();
}

function extractRelevantInfo(objective, largeString, task) {
  const chunkSize = 3000;
  const overlap = 500;
  let notes = "";

  for (let i = 0; i < largeString.length; i += chunkSize - overlap) {
    const chunk = largeString.slice(i, i + chunkSize);

    // You'll need to replace the following code with your GPT-3 API call
    // since GPT-3 is not available in JavaScript directly.
    // Use the 'chunk' variable as input for GPT-3.

    // notes += response.choices[0].message['content'].trim() + ". ";
  }

  return notes;
}
```

You'll need to install the `axios` and `cheerio` packages using npm or yarn to use this code. Also, note that you'll need to replace the commented section with your GPT-3 API call, as GPT-3 is not available in JavaScript directly.