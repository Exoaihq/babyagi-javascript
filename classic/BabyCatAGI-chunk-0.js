const axios = require("axios");
const cheerio = require("cheerio");

async function fetchUrlContent(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching URL content: ${error}`);
    return null;
  }
}

async function extractText(content) {
  const $ = cheerio.load(content);
  return $("body").text();
}

async function extractLinks(content) {
  const $ = cheerio.load(content);
  const links = [];
  $("a").each((index, element) => {
    const link = $(element).attr("href");
    if (link) {
      links.push(link);
    }
  });
  return links;
}

async function main() {
  const url = "https://example.com";
  const content = await fetchUrlContent(url);
  const text = await extractText(content);
  const links = await extractLinks(content);

  console.log(`Text: ${text}`);
  console.log(`Links: ${links.join(", ")}`);
}

main();