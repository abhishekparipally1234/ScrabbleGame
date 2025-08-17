// server.js (Updated)
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// --- Trie Data Structure (copied from your Trie.js) ---
class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
    }
}
class Trie {
    constructor() { this.root = new TrieNode(); }
    insert(word) {
        let node = this.root;
        for (const char of word.toLowerCase()) {
            if (!node.children[char]) node.children[char] = new TrieNode();
            node = node.children[char];
        }
        node.isEndOfWord = true;
    }
    search(word) {
        if (!word) return false;
        let node = this.root;
        for (const char of word.toLowerCase()) {
            if (!node.children[char]) return false;
            node = node.children[char];
        }
        return node.isEndOfWord;
    }
}
// -----------------------------------------------------------

const app = express();
const port = 5000;
const dictionaryTrie = new Trie();

// Load dictionary into the Trie on server startup
const dictionaryPath = path.join(__dirname, 'words_alpha.txt');
try {
    const data = fs.readFileSync(dictionaryPath, 'utf8');
    const words = data.split('\n').map(w => w.trim()).filter(Boolean);
    console.log(`Loading ${words.length} words into dictionary...`);
    words.forEach(word => dictionaryTrie.insert(word));
    console.log('Dictionary loaded successfully into Trie.');
} catch (err) {
    console.error('Failed to load dictionary file:', err);
    process.exit(1); // Exit if the dictionary can't be loaded
}

app.use(cors());

// NEW: Endpoint to validate a word
app.get('/api/validate-word/:word', (req, res) => {
    const { word } = req.params;
    const isValid = dictionaryTrie.search(word);
    res.json({ word: word, isValid: isValid });
});

// OLD: Endpoint to serve the whole file (can be kept or removed)
app.get('/api/words', (req, res) => {
    res.sendFile(dictionaryPath);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});