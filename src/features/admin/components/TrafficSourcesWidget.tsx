import React from 'react';
import { supabase } from '@lib/supabase';
import { MessageCircle, Instagram, Facebook, Twitter, Linkedin, Search, Globe, Mail, Youtube } from 'lucide-react';

type TrafficRow = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  visit_count: number | null;
  last_visited_at: string | null;
};

type Aggregated = {
  source: string;
  total: number;
  last_visited_at?: string | null;
};

const TrafficSourcesWidget: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<Aggregated[]>([]);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('traffic_sources')
          .select('source, medium, campaign, visit_count, last_visited_at')
          .limit(1000);
        if (error) throw error;
        const rows = (data || []) as TrafficRow[];
        const map = new Map<string, Aggregated>();
        for (const r of rows) {
          const key = (r.source || 'direct').toLowerCase();
          const prev = map.get(key);
          const total = (prev?.total || 0) + (r.visit_count || 0);
          const last = prev?.last_visited_at || r.last_visited_at || null;
          map.set(key, { source: key, total, last_visited_at: last });
        }
        const list = Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 8);
        if (mounted) setData(list);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load traffic sources');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Traffic Sources</h3>
        {!loading && (
          <span className="text-sm text-gray-500 dark:text-gray-400">Top {data.length}</span>
        )}
      </div>
      {loading && (
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>
      )}
      {!loading && error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      {!loading && !error && data.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">No data yet</div>
      )}
      {!loading && !error && data.length > 0 && (
        <div className="space-y-3">
          {data.map((row) => (
            <div key={row.source} className="flex items-center">
              <div className="flex-1">
                {getSourceIcon(row.source)}
                <span className="ml-2">{row.source}</span>
              </div>
              <div className="ml-4 text-sm font-semibold text-gray-900 dark:text-white">{row.total.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getSourceIcon = (source: string) => {
  const iconClass = 'w-4 h-4 text-gray-500 dark:text-gray-400';
  
  switch(source) {
    case 'whatsapp':
      return <MessageCircle className={iconClass} />;
    case 'instagram':
      return <Instagram className={iconClass} />;
    case 'facebook':
      return <Facebook className={iconClass} />;
    case 'twitter':
    case 'x.com':
      return <Twitter className={iconClass} />;
    case 'linkedin':
      return <Linkedin className={iconClass} />;
    case 'youtube':
      return <Youtube className={iconClass} />;
    case 'email':
    case 'mail':
    case 'outlook':
    case 'gmail':
      return <Mail className={iconClass} />;
    case 'google':
    case 'bing':
    case 'yahoo':
    case 'duckduckgo':
      return <Search className={iconClass} />;
    case 'telegram':
      return <MessageCircle className={iconClass} />;
    case 'snapchat':
      return <Globe className={iconClass} />;
    case 'pinterest':
      return <Globe className={iconClass} />;
    case 'reddit':
      return <Globe className={iconClass} />;
    case 'tiktok':
      return <Globe className={iconClass} />;
    case 'mobile_app':
      return <Globe className={iconClass} />;
    case 'chrome':
    case 'firefox':
    case 'safari':
    case 'edge':
      return <Globe className={iconClass} />;
    case 'direct':
      return <Globe className={iconClass} />;
    default:
      return <Globe className={iconClass} />;
  }
};

export default TrafficSourcesWidget;
