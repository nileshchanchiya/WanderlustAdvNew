import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { Loader2, ArrowRight } from "lucide-react";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/blogs")
      .then(({ data }) => setBlogs(data))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-ink-0 flex flex-col">
      <Helmet>
        <title>Wanderlust Journal | Travel Guides & Inspiration</title>
        <meta name="description" content="Discover travel tips, destination guides, and inspiring stories from Wanderlust Adventure." />
      </Helmet>
      
      <Navbar />
      
      <main className="flex-1 w-full pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="label-caps text-gold">The Journal</div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ocean mt-4 mb-6">
            Travel Guides & Stories
          </h1>
          <p className="text-lg text-charcoal/80 leading-relaxed font-body">
            Get expert advice, destination spotlights, and inspiration for your next great adventure.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-24 text-driftwood">
            <p className="text-xl font-display">No articles published yet.</p>
            <p className="mt-2">Check back soon for inspiring travel content!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <Link 
                key={blog.id} 
                to={`/blog/${blog.slug}`}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-fog hover:border-gold/50 shadow-lift hover:shadow-float transition-all duration-300"
              >
                {blog.cover_image_url && (
                  <div className="aspect-[4/3] overflow-hidden bg-sand/30">
                    <img 
                      src={blog.cover_image_url} 
                      alt={blog.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {blog.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-label font-bold uppercase tracking-wider text-ocean bg-ocean/5 px-2 py-1 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="text-xl font-display font-bold text-ocean group-hover:text-gold transition-colors mb-3 line-clamp-2">
                    {blog.title}
                  </h2>
                  <p className="text-charcoal/80 text-sm mb-6 line-clamp-3 flex-1">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-fog/60">
                    <span className="text-xs text-driftwood font-label tracking-wide">
                      {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-label font-bold uppercase tracking-wider text-ocean group-hover:text-gold transition-colors">
                      Read <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
