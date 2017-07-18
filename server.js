const express = require("express");
const bodyParser = require("body-parser");
const mustacheExpress = require("mustache-express");
const session = require("express-session");
const sessionConfig = require("./sessionConfig");
const app = express();
const port = process.env.PORT || 3000;
const fs = require("fs");
const words = fs
  .readFileSync("/usr/share/dict/words", "utf-8")
  .toLowerCase()
  .split("\n");
var expressValidator = require("express-validator");

app.engine("mustache", mustacheExpress());
app.set("views", "./public");
app.set("view engine", "mustache");
app.use(expressValidator());

//middleware
app.use("/", express.static("./public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session(sessionConfig));

var lettersGuessed = [];
var guessesLeft = 8;
var mode;
var randomWord;
var hangman;

function displayGame(wordLen, letter) {
  var display = "";
  if (letter == -1) {
    for (var i = 0; i < wordLen; i++) {
      display += "_ ";
    }
    return display;
  } else {
    if (randomWord.indexOf(letter) >= 0) {
      var correctguess = 0;
      var counter;
      for (var i = 0; i < randomWord.length; i++) {
        counter = 0;
        for (var j = 0; j < lettersGuessed.length; j++) {
          if (lettersGuessed[j] == randomWord[i]) {
            display += lettersGuessed[j] + " ";
            counter = 1;
            correctguess = +1;
          }
        }
        if (counter == 0) {
          display += "_ ";
        }
      }
      return display;
    } else {
      guessesLeft -= 1;
      return hangman;
    }
  }
}

function solve(word, solvedword) {
  var newword = "";
  var solved;
  for (var i = 0; i < solvedword.length; i++) {
    newword += solvedword[i] + " ";
  }
  if (word == newword) {
    solved = true;
  } else {
    solved = false;
  }
  return solved;
}

function game(type) {
  if (type == "Easy") {
    var word = words.filter(function(str) {
      return (str.length >= 4) & (str.length <= 6);
    });
  } else if (type == "Normal") {
    var word = words.filter(function(str) {
      return (str.length >= 6) & (str.length <= 8);
    });
  } else {
    var word = words.filter(function(str) {
      return str.length > 8;
    });
  }
  randomWord = word[Math.floor(Math.random() * word.length)];
  return randomWord;
}

function redLetters(displayWord, originalWord) {
  var wordWithSpaces = "";
  for (var i = 0; i < originalWord.length; i++) {
    wordWithSpaces += originalWord[i] + " ";
  }
  var wordWithRed = "";
  for (var j = 0; j < displayWord.length; j++) {
    if (displayWord[j] == "_") {
      wordWithRed += '<span id="red">' + wordWithSpaces[j] + "</span>";
    } else {
      wordWithRed += displayWord[j];
    }
  }
  return wordWithRed;
}

app.get("/", function(req, res) {
  var letter;
  var solved;
  if (!req.session.word) {
    lettersGuessed = [];
    guessesLeft = 8;
    res.render("index");
  } else {
    if (guessesLeft >= 1) {
      if (lettersGuessed.length == 0) {
        letter = -1;
      } else {
        letter = lettersGuessed[lettersGuessed.length - 1];
      }
      hangman = displayGame(req.session.word.length, letter);
      solved = solve(hangman, req.session.word);
      if (!solved && guessesLeft == 0) {
        hangman = redLetters(hangman, req.session.word);
        res.render("index", {
          guess: guessesLeft,
          guessedLetters: lettersGuessed,
          gamemode: mode,
          hangman: hangman.toString(),
          solved: true,
          lost: true
        });
      } else if (!solved) {
        res.render("index", {
          guess: guessesLeft,
          guessedLetters: lettersGuessed,
          gamemode: mode,
          hangman: hangman.toString(),
          solved: solved,
          lost: false
        });
      } else {
        res.render("index", {
          guess: guessesLeft,
          guessedLetters: lettersGuessed,
          gamemode: mode,
          hangman: hangman.toString(),
          solved: true,
          lost: false
        });
      }
    }
  }
});

app.post("/", function(req, res) {
  if (req.body.status) {
    req.session.destroy();
    res.redirect("/");
  }
  if (req.body.mode) {
    randomWord = game(req.body.mode).toUpperCase();
    req.session.word = randomWord.toUpperCase();
    mode = req.body.mode;
    res.redirect("/");
  } else {
    req.checkBody("choice", "You must enter uppercase letter!").isAlpha();
    req.checkBody("choice", "You must enter one letter!").isLength({ max: 1 });
    req.checkBody("choice", "You must enter a letter!").notEmpty();

    var errors = req.validationErrors();
    if (errors) {
      res.render("index", {
        broken: errors,
        gamemode: mode,
        guess: guessesLeft,
        guessedLetters: lettersGuessed,
        hangman: hangman
      });
    } else {
      if (
        (lettersGuessed.length > 0) &
        (lettersGuessed.indexOf(req.body.choice.toUpperCase()) == -1)
      ) {
        lettersGuessed.push(req.body.choice.toUpperCase());
        res.redirect("/");
      } else if (lettersGuessed.length == 0) {
        lettersGuessed.push(req.body.choice.toUpperCase());
        res.redirect("/");
      } else {
        var text = {
          msg: "Please enter a letter that has not already been used."
        };
        console.log(mode);
        console.log(lettersGuessed);
        console.log(hangman);
        res.render("index", {
          broken: text,
          gamemode: mode,
          guess: guessesLeft,
          guessedLetters: lettersGuessed,
          hangman: hangman
        });
      }
    }
  }
});

app.listen(port, function() {
  console.log("Server started on port", port);
});
