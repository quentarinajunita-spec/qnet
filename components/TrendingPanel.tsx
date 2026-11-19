"use client";

import { useEffect, useState } from "react";

export type Trend = { tag: string; count: number };

export default function TrendingPanel() {
  const [trends, setTrends] = useState<Trend[] | null>(null);

  useEffect(() => {
    fetch("/api/trending")
      .then((res) => res.json())
      .then((data) => setTrends(data.trends ?? []))
      .catch(() => setTrends([]));
  }, []);

  return (
    <section className="card panel-card">
      <h3 className="panel-title">Trending Hashtags</h3>
      {trends === null ? (
        <p className="loading-state">Memuat...</p>
      ) : trends.length === 0 ? (
        <p className="empty-state">Belum ada hashtag. Jadilah yang pertama!</p>
      ) : (
        trends.map((trend) => (
          <a key={trend.tag} className="trend" href={`/search?q=${encodeURIComponent(trend.tag)}`}>
            <span className="trend-tag">#{trend.tag}</span>
            <span className="trend-count">{trend.count} posts</span>
          </a>
        ))
      )}
    </section>
  );
}
