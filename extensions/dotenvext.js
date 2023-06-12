const dotenv = require('dotenv');

function loadDotenvExtensions(dotenvFiles) {
    for (const dotenvFile of dotenvFiles) {
        dotenv.config({ path: dotenvFile });
    }
}