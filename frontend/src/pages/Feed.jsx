import React, { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { Loader2, Instagram, Twitter, ExternalLink, MessageSquare, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Feed() {
  const [posts, setPosts] = useState(null);
  const [instaFeed, setInstaFeed] = useState(null);

  useEffect(() => {
    api.get("/feed")
      .then(({ data }) => setPosts(data))
      .catch(() => setPosts([]));
      
    api.get("/feed/instagram")
      .then(({ data }) => setInstaFeed(data))
      .catch(() => setInstaFeed([]));
  }, []);

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <Helmet>
        <title>Social Feed - Wanderlust Adventure</title>
      </Helmet>
      
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="label-caps text-gold mb-4">Live Updates</div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-sand font-bold tracking-tight mb-6">
              Our Journey
            </h1>
            <p className="text-fog sm:text-lg leading-relaxed">
              Follow along with our latest adventures, travel tips, and stunning destinations from across the globe.
            </p>
          </div>

          {instaFeed && instaFeed.length > 0 && (
            <div className="mb-20">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-serif text-2xl text-sand flex items-center gap-3">
                  <Instagram className="text-gold h-6 w-6" />
                  <span className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 bg-clip-text text-transparent">@wanderlustadventure</span>
                </h2>
              </div>
              <InstaCarousel posts={instaFeed} />
            </div>
          )}

          {posts && posts.length > 0 && (
            <div className="mb-8">
              <h2 className="font-serif text-2xl text-sand mb-8">Latest Updates</h2>
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                {posts.map((post) => (
                  <FeedCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}
          
          {!posts && !instaFeed && (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          )}

          {posts?.length === 0 && (!instaFeed || instaFeed.length === 0) && (
            <div className="text-center py-24 border border-charcoal rounded-2xl bg-charcoal/20">
              <MessageSquare className="h-12 w-12 text-driftwood mx-auto mb-4" strokeWidth={1} />
              <h3 className="font-serif text-xl text-sand mb-2">No updates yet</h3>
              <p className="text-fog">Check back soon for our latest travel moments.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FeedCard({ post }) {
  const isInstagram = post.platform === "instagram";
  const isTwitter = post.platform === "twitter";
  
  return (
    <div className="break-inside-avoid bg-charcoal rounded-2xl overflow-hidden shadow-2xl border border-white/5 transition-transform hover:-translate-y-1 duration-300">
      {post.image_url && (
        <div className="relative group overflow-hidden">
          <img 
            src={post.image_url} 
            alt="Feed post" 
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${isInstagram ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' : isTwitter ? 'bg-sky-500' : 'bg-charcoal border border-fog/20'}`}>
              {isInstagram ? <Instagram className="h-4 w-4 text-white" /> : 
               isTwitter ? <Twitter className="h-4 w-4 text-white" /> : 
               <MessageSquare className="h-4 w-4 text-sand" />}
            </div>
            <span className="text-xs font-label uppercase tracking-wider text-driftwood">
              {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
        
        <p className="text-sand/90 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
          {post.content}
        </p>

        {post.link_url && (
          <a 
            href={post.link_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-label uppercase tracking-wider text-gold hover:text-gold-soft transition-colors"
          >
            View Original
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function InstaCarousel({ posts }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === "left" ? -400 : 400;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative group">
      <button 
        onClick={() => scroll('left')}
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-charcoal/80 hover:bg-gold text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm border border-white/10 hidden sm:block"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {posts.map((post) => {
          const isVideo = post.media_type === "VIDEO";
          const mediaUrl = isVideo ? post.thumbnail_url : post.media_url;
          
          return (
            <a 
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-none w-72 sm:w-80 snap-start group/card relative rounded-xl overflow-hidden bg-charcoal border border-white/5 shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-[4/5] relative overflow-hidden bg-ink">
                {mediaUrl ? (
                  <img 
                    src={mediaUrl} 
                    alt={post.caption || "Instagram post"} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-driftwood">
                    <Instagram className="w-8 h-8 opacity-50" />
                  </div>
                )}
                
                {isVideo && (
                  <div className="absolute top-3 right-3 p-1.5 bg-black/50 backdrop-blur-md rounded-full">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover/card:translate-y-0 transition-transform duration-300">
                  <p className="text-white/90 text-sm line-clamp-3 font-medium">
                    {post.caption}
                  </p>
                  <span className="text-gold text-xs mt-2 block font-label uppercase tracking-widest">
                    {new Date(post.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <button 
        onClick={() => scroll('right')}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-charcoal/80 hover:bg-gold text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm border border-white/10 hidden sm:block"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
    </div>
  );
}
