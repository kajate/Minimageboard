const express = require("express");
const app = express();
const db = require("./db.js");
const multer = require("multer");
const uidSafe = require("uid-safe");
const path = require("path");
const s3 = require("./s3.js");
const config = require("./config");
const bodyParser = require('body-parser');


var diskStorage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, __dirname + "/uploads");
    },
    filename: function(req, file, callback) {
        uidSafe(24).then(function(uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    }
});

var uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 0
    }
});

app.use((req, res, next) => {
    if (
        process.env.NODE_ENV == "production" &&
        !req.headers["x-forwarded-proto"].startsWith("https")
    ) {
        return res.redirect(`https://${req.hostname}${req.url}`);
    } else {
        next();
    }
});

app.use(bodyParser.json());

app.use(express.static("public"));
app.use(express.static("uploads"));

app.get("/images", (req, res) => {
    db
        .getImages()
        .then(results => {
            res.json({
                images: results.rows
            });
        })
        .catch(function(err) {
            console.log("couldn't get images", err);
        });
});

app.get("/images/:id", (req, res) => {
    console.log(req.params.id);
    db
        .getMoreImages(req.params.id)
        .then(results => {
            res.json({
                images: results.rows
            });
        })
        .catch(function(err) {
            console.log("couldn't get new images", err);
        });
});

app.post("/upload", uploader.single("file"), s3.upload, (req, res) => {
    db
        .insertFormData(
            req.body.title,
            req.body.description,
            req.body.username,
            config.s3Url + req.file.filename
        )
        .then(function(results) {
            console.log(results);
            res.json({
                image: results.rows[0]
            });
        })
        .catch(function(err) {
            console.log("Error in app.post('/upload'): ", err);
            if (err.code == 23502) {
                res.status(500).send({
                    message: "Fields cannot be empty"
                });
            } else if (err.code == 22001) {
                res.status(500).send({
                    message: "Title or username too long"
                });
            } else {
                res.status(500).send({
                    message: "Upload is disabled in this version"
                });
            }

            res.status(500).send({
                message: "Error"
            });
        });
});

app.get("/image/:id", (req, res) => {
    db
        .getImageById(req.params.id)
        .then(function(result) {
            res.json({
                currentImage: result.rows[0]
            });
        })
        .catch(function(e) {
            console.log("couldn't open image in modal", e);
        });
});

app.get("/comments/:id", (req, res) => {
    db
        .getCommentById(req.params.id)
        .then(function(results) {
            res.json({
                comments: results.rows
            });
            console.log("showing results rows: ", results.rows);
        })
        .catch(function(err) {
            console.log("Error in app.get('/comments')", err);
        });
});

app.post("/comments", (req, res) => {
    db
        .saveComment(req.body.image_id, req.body.commenter, req.body.comment)
        .then(function(results) {
            res.json({
                newComment: results.rows[0]
            })
        })
        .catch(function(err) {
            console.log("Error in app.post('/comments')", err);
        });
});
var port = process.env.PORT || 8080;
app.listen(port);
// app.listen(8080, () => "Listening on 8080");
