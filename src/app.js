require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const { NODE_ENV } = require("./config");
const ArticlesService = require("./articles-service");

// create Express app
const app = express();

// use Express to parse Json
const jsonParser = express.json();

// log 'tiny' output if in production, else log 'common'
const morganOption = NODE_ENV === "production" ? "tiny" : "common";
app.use(morgan(morganOption));

// hide sensitive data with 'helmet' and allow cors
app.use(helmet());
app.use(cors());

app.get("/articles", (req, res, next) => {
  const knexInstance = req.app.get("db");
  ArticlesService.getAllArticles(knexInstance)
    .then(articles => {
      res.json(
        articles.map(article => ({
          id: article.id,
          title: article.title,
          style: article.style,
          content: article.content,
          date_published: new Date(article.date_published)
        }))
      );
    })
    .catch(next);
});

app.post("/articles", jsonParser, (req, res, next) => {
  const { title, content, style } = req.body;
  const newArticle = { title, content, style };
  ArticlesService.insertArticle(req.app.get("db"), newArticle)
    .then(article => {
      res.status(201).json(article);
    })
    .catch(next);
});

app.get("/articles/:article_id", (req, res, next) => {
  const knexInstance = req.app.get("db");
  ArticlesService.getById(knexInstance, req.params.article_id)
    .then(article => {
      if (!article) {
        return res.status(404).json({
          error: { message: `Article doesn't exist` }
        });
      }
      res.json({
        id: article.id,
        title: article.title,
        style: article.style,
        content: article.content,
        date_published: new Date(article.date_published)
      });
    })
    .catch(next);
});

// basic endpoint for app.js
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

// error handling middleware gives short response if in production
app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

// export the app
module.exports = app;
