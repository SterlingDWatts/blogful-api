// Import necessary files
const express = require("express");
const xss = require("xss");
const ArticlesService = require("./articles-service");

// Create Router for /articles endpoint
const articlesRouter = express.Router();
// Create Json parser using Express
const jsonParser = express.json();

// sanitize title and content of articles
const serializeArticle = article => ({
  id: article.id,
  style: article.style,
  title: xss(article.title),
  content: xss(article.content),
  date_published: article.date_published
});

articlesRouter
  .route("/")
  .get((req, res, next) => {
    ArticlesService.getAllArticles(req.app.get("db"))
      .then(articles => {
        res.json(articles.map(serializeArticle));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { title, content, style } = req.body;
    const newArticle = { title, content, style };

    for (const [key, value] of Object.entries(newArticle)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }

    ArticlesService.insertArticle(req.app.get("db"), newArticle)
      .then(article => {
        res
          .status(201)
          .location(`/articles/${article.id}`)
          .json(serializeArticle(article));
      })
      .catch(next);
  });

articlesRouter
  .route("/:article_id")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    ArticlesService.getById(knexInstance, req.params.article_id)
      .then(article => {
        if (!article) {
          return res.status(404).json({
            error: { message: "Article doesn't exist" }
          });
        }
        res.json(serializeArticle(article));
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    ArticlesService.deleteArticle(req.app.get("db"), req.params.article_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = articlesRouter;
