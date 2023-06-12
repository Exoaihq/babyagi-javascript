Here's the converted JavaScript code:

```javascript
function simplifySearchResults(searchResults) {
  const simplifiedResults = [];
  for (const result of searchResults) {
    const simplifiedResult = {
      position: result.position,
      title: result.title,
      link: result.link,
      snippet: result.snippet,
    };
    simplifiedResults.push(simplifiedResult);
  }
  return simplifiedResults;
}

async function webScrapeTool(url, task) {
  const content = await fetchUrlContent(url);
  if (content === null) {
    return null;
  }

  const text = extractText(content);
  console.log(`\x1b[90m\x1b[3mScrape completed. Length: ${text.length}. Now extracting relevant info...\x1b[0m`);
  const info = extractRelevantInfo(OBJECTIVE, text.slice(0, 5000), task);
  const links = extractLinks(content);

  return info;
}

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
};

async function fetchUrlContent(url) {
  try {
    const response = await fetch(url, { headers: headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error while fetching the URL: ${error}`);
    return "";
  }
}

function extractLinks(content) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const links = Array.from(doc.querySelectorAll("a[href^='http']")).map(link => link.href);
  return links;
}

function extractText(content) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const text = doc.body.textContent.trim();
  return text;
}

function extractRelevantInfo(objective, largeString, task) {
  // Implement the extractRelevantInfo function using your preferred method.
  // This may require using an external API or library.
}

// Add the remaining functions and logic as needed.
```

Please note that the `extractRelevantInfo` function requires an implementation using your preferred method, which may involve using an external API or library.