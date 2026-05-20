const { onRequest } = require("firebase-functions/v2/https");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

exports.serveBlogWithSEO = onRequest({ region: "us-central1", minInstances: 0 }, async (req, res) => {
  try {
    const parts = req.path.split("/");
    const slug = parts[parts.length - 1]; // /blog/slug
    
    // Read the base index.html
    const indexPath = path.join(__dirname, "index.html");
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send("File not found");
    }
    let html = fs.readFileSync(indexPath, "utf8");

    if (slug) {
      try {
        // Fetch blog data
        const response = await axios.get(`https://wanderlust-api-ppzm.onrender.com/api/blogs/${slug}`, {
          timeout: 5000
        });
        const blog = response.data;

        // Replace meta tags
        const title = `${blog.title} | Wanderlust Journal`;
        const description = blog.excerpt || blog.title;
        const imageUrl = blog.cover_image_url || "";

        const ogTags = `
          <title>${title}</title>
          <meta name="description" content="${description}" />
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:type" content="article" />
          <meta property="og:image" content="${imageUrl}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${title}" />
          <meta name="twitter:description" content="${description}" />
          <meta name="twitter:image" content="${imageUrl}" />
        `;

        // Replace the default title with our SEO tags
        html = html.replace(/<title>.*?<\/title>/i, ogTags);
      } catch (err) {
        console.error("Error fetching blog for SEO:", err.message);
        // Fallback to normal HTML if backend fails
      }
    }

    // Cache the dynamic HTML on the CDN for 5 minutes
    res.set("Cache-Control", "public, max-age=300, s-maxage=300");
    res.status(200).send(html);
  } catch (error) {
    console.error("Critical error:", error);
    res.status(500).send("Internal Server Error");
  }
});
