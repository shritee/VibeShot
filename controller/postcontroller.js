const Post = require('../model/post');
var post = async (req, res) => {
  try {
    const { mediaType } = req.body;
    const mediaUrl = `/uploads/${req.file.filename}`;
    const post = await Post.create({ mediaUrl, mediaType, userId: req.user.id });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {post};
