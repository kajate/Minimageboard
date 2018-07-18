var spicedPg = require("spiced-pg");
var db = spicedPg("postgres:postgres:postgres@localhost:5432/imageboard");

module.exports.getImages = function getImages() {
    return db.query(`SELECT * FROM images ORDER BY created_at DESC LIMIT 10`);
};

module.exports.insertFormData = function insertFormData (
    title,
    description,
    username,
    url
) {
    return db.query(
        `INSERT INTO images (title, description, username, url)
        VALUES ($1, $2, $3, $4)
        RETURNING id, url, username, title, description`,
        [title || null, description || null, username || null, url || null]
    );
};

module.exports.getMoreImages = function getMoreImages(imageId) {
    return db.query(
        `SELECT * FROM images WHERE id < $1 ORDER BY id DESC LIMIT 10`,
        [imageId]
    );
};

module.exports.getImageById = function(id) {
    console.log("running getImageById");
    const q = `
    SELECT *, (
        SELECT id
        FROM images
        WHERE id < $1
        ORDER BY id DESC
        LIMIT 1)
        as prev_id,
        (
        SELECT id FROM images
        WHERE id > $1
        ORDER BY id ASC
        LIMIT 1)
        as next_id
    FROM images
    WHERE id = $1;
    `;
    const params = [id];
    return db.query(q, params);
};


module.exports.getCommentById = function(image_id) {
    console.log("running getCommentById");
    const q = `
SELECT * FROM comments
WHERE image_id = $1;
    `;
    const params = [image_id];
    return db.query(q, params);
};

module.exports.saveComment = function(image_id, commenter, comment) {
    console.log("running saveComment");
    const q = `
    INSERT INTO comments (image_id, commenter, comment)
    VALUES ($1, $2, $3)
    RETURNING *;
    `;
    const params = [image_id || null, commenter || null, comment || null];
    return db.query(q, params);
};
