import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { Loader2, ArrowLeft, Calendar, Share2 } from "lucide-react";

export default function BlogPost() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/blogs/${slug}`)
      .then(({ data }) => {
        setBlog(data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-0 flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="h-10 w-10 animate-spin text-gold" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-ink-0 flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col justify-center items-center px-4">
          <h1 className="font-display text-4xl font-bold text-ocean mb-4">Post Not Found</h1>
          <p className="text-charcoal mb-8">The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/blog" className="px-6 py-3 bg-ocean text-white rounded-lg font-label font-semibold uppercase tracking-wider hover:bg-ocean/90 transition-colors">
            Back to Journal
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-0 flex flex-col">
      {/* SEO metadata injection */}
      <Helmet>
        <title>{blog.title} | Wanderlust Journal</title>
        <meta name="description" content={blog.excerpt || blog.title} />
        {blog.tags && blog.tags.length > 0 && (
          <meta name="keywords" content={blog.tags.join(", ")} />
        )}
        {/* Open Graph Tags for Social Sharing */}
        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={blog.excerpt || blog.title} />
        <meta property="og:type" content="article" />
        {blog.cover_image_url && (
          <meta property="og:image" content={blog.cover_image_url} />
        )}
      </Helmet>
      
      <Navbar />
      
      <main className="flex-1 w-full pt-28 pb-20">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-label font-bold uppercase tracking-wider text-driftwood hover:text-ocean transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Journal
          </Link>
          
          <header className="mb-12">
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex gap-2 mb-6 flex-wrap">
                {blog.tags.map(tag => (
                  <span key={tag} className="text-xs font-label font-bold uppercase tracking-wider text-gold bg-gold/10 px-3 py-1.5 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ocean mb-6 leading-tight">
              {blog.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-charcoal/70 border-y border-fog/60 py-4 mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gold" />
                <span className="font-label tracking-wide">
                  {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }}
                className="flex items-center gap-2 hover:text-ocean transition-colors ml-auto"
              >
                <Share2 className="h-4 w-4" />
                <span className="font-label uppercase tracking-wider text-xs font-bold">Share</span>
              </button>
            </div>
          </header>

          {blog.cover_image_url && (
            <figure className="mb-16 rounded-2xl overflow-hidden shadow-lift">
              <img 
                src={blog.cover_image_url} 
                alt={blog.title} 
                className="w-full h-auto aspect-video object-cover"
              />
            </figure>
          )}

          {/* WYSIWYG HTML CONTENT */}
          {/* We use a specific div with "prose" classes if tailwind typography was installed.
              Since we are using custom styling, we'll style the raw HTML explicitly. */}
          <div 
            className="font-body text-lg text-charcoal leading-relaxed space-y-6 
                       [&>p]:mb-6 
                       [&>h2]:font-display [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:text-ocean [&>h2]:mt-12 [&>h2]:mb-6
                       [&>h3]:font-display [&>h3]:text-2xl [&>h3]:font-bold [&>h3]:text-ocean [&>h3]:mt-10 [&>h3]:mb-4
                       [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ul>li]:mb-2
                       [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6 [&>ol>li]:mb-2
                       [&>blockquote]:border-l-4 [&>blockquote]:border-gold [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-charcoal/80 [&>blockquote]:my-8
                       [&>img]:rounded-xl [&>img]:shadow-lift [&>img]:my-10 [&>img]:w-full
                       [&>a]:text-ocean [&>a]:underline [&>a]:underline-offset-4 hover:[&>a]:text-gold transition-colors"
            dangerouslySetInnerHTML={{ __html: blog.content }} 
          />
        </article>
      </main>
      
      <Footer />
    </div>
  );
}
