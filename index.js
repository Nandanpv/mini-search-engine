const express = require('express');
const fs = require('fs');

const app = express();
const PORT = 3000;

let articles = [];

// Middleware to parse JSON
app.use(express.json());

// Load articles from file if exists
if (fs.existsSync('articles.json')) {
    articles = JSON.parse(fs.readFileSync('articles.json', 'utf8'));
}

// Add Article (POST /articles)
app.post('/articles', (req, res) => {
    const { title, content, tags } = req.body;
    const newArticle = {
        id: articles.length + 1,
        title,
        content,
        tags,
        date: new Date().toISOString()
    };
    articles.push(newArticle);
    // Save articles to file
    fs.writeFileSync('articles.json', JSON.stringify(articles, null, 2));
    res.status(201).json({ id: newArticle.id, message: "Article added successfully." });
});

// Search Articles (GET /articles/search)
app.get('/articles/search', (req, res) => {
    const { keyword, tag } = req.query;
    let results = articles;

    if (keyword) {
        const keywordLower = keyword.toLowerCase();
        results = results.filter(article => 
            article.title.toLowerCase().includes(keywordLower) || 
            article.content.toLowerCase().includes(keywordLower)
        );
    }

    if (tag) {
        results = results.filter(article => article.tags.includes(tag));
    }

    results = results.map(article => ({
        id: article.id,
        title: article.title,
        summary: article.content.substring(0, 100) + '...',
        date: article.date,
        relevance: calculateRelevance(article, keyword)
    }));

    // Sort results by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    res.json(results);
});

// Get Article (GET /articles/:id)
app.get('/articles/:id', (req, res) => {
    const article = articles.find(a => a.id === parseInt(req.params.id));
    if (!article) {
        return res.status(404).json({ message: "Article not found." });
    }
    res.json(article);
});
// Get All Articles (GET /articles)
app.get('/articles', (req, res) => {
    res.json(articles);
});

// Helper function to calculate relevance
function calculateRelevance(article, keyword) {
    if (!keyword) return 0;
    const keywordLower = keyword.toLowerCase();
    const titleCount = (article.title.toLowerCase().match(new RegExp(keywordLower, "g")) || []).length;
    const contentCount = (article.content.toLowerCase().match(new RegExp(keywordLower, "g")) || []).length;
    return titleCount + contentCount;
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
