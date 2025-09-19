export interface Category {
    id: number;
    name: { fr: string; en: string };
    slug: string;
    description?: { fr: string; en: string };
    color: string;
  }
  
  export interface BlogPost {
    id: number;
    title: { fr: string; en: string };
    slug: string;
    content: { fr: string; en: string };
    excerpt: { fr: string; en: string };
    author: number;
    category: number;
    status: 'draft' | 'published' | 'archived';
    featured_image?: string;
    is_featured: boolean;
    read_time: string;
    tags: { fr: string[]; en: string[] };
    meta_title?: { fr: string; en: string };
    meta_description?: { fr: string; en: string };
    created_at: string;
    updated_at: string;
  }
  
  export interface BlogStats {
    total_posts: number;
    draft_count: number;
    published_count: number;
    archived_count: number;
    featured_count: number;
  }