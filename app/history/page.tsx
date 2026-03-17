"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Dog, List, ArrowRight, Clock } from "lucide-react";
import styles from "./page.module.css";

type UsageSession = {
  id: number;
  memberId: string;
  enteredAt: string;
  exitedAt: string | null;
  member: {
    id: string;
    dogName: string;
    photoUrl?: string | null;
  };
};

export default function History() {
  const [history, setHistory] = useState<UsageSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('ja-JP', { 
      month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const getDuration = (entered: string, exited: string | null) => {
    if (!exited) return "-";
    const diffMs = new Date(exited).getTime() - new Date(entered).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return `${diffMins} 分`;
  };

  return (
    <div className="app-container">
      <nav className="navbar glass-panel">
        <Link href="/" className="nav-brand">
          <Dog size={28} />
          DogRun <span className="brandHighlight">Connect</span>
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">ダッシュボード</Link>
          <Link href="/members" className="nav-link">会員管理</Link>
          <Link href="/history" className="nav-link active">利用履歴</Link>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className="page-title">利用履歴一覧</h1>
          <p className="page-subtitle">ドッグランの過去の入出退出記録をすべて確認できます</p>
        </div>

        <div className={`glass-panel ${styles.cardContainer}`}>
          <div className={styles.sectionTitle}>
            <List className="brandHighlight" /> すべての履歴
          </div>

          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.emptyState}>読み込み中...</div>
            ) : history.length > 0 ? (
              <table className={styles.historyTable}>
                <thead>
                  <tr>
                    <th>ステータス</th>
                    <th>ワンちゃん</th>
                    <th>入出・退室タイムライン</th>
                    <th>利用時間</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((session) => (
                    <tr key={session.id}>
                      <td>
                        {session.exitedAt ? (
                          <span className={`${styles.badge} ${styles.badgeCompleted}`}>退室済</span>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgeActive}`}>利用中</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.dogInfo}>
                          {session.member.photoUrl ? (
                            <img src={session.member.photoUrl} alt="dog" className={styles.dogAvatar} />
                          ) : (
                            <div className={styles.dogAvatar}><Dog size={20} /></div>
                          )}
                          <span style={{fontWeight: 600}}>{session.member.dogName}</span>
                          <span style={{fontSize: "0.8rem", color: "var(--text-secondary)"}}>ID: {session.member.id}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.timelineCell}>
                          <Clock size={14} className="brandHighlight" />
                          <span>{formatDate(session.enteredAt)}</span>
                          <ArrowRight size={14} />
                          <span>{session.exitedAt ? formatDate(session.exitedAt) : "---"}</span>
                        </div>
                      </td>
                      <td style={{fontWeight: 500}}>
                        {getDuration(session.enteredAt, session.exitedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyState}>
                履歴がありません。
              </div>
            )}
          </div>
        </div>
      </main>

      <footer style={{ textAlign: "center", padding: "2rem", marginTop: "2rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
        <p>&copy; {new Date().getFullYear()} DogRun Connect. All rights reserved.</p>
        <div style={{ marginTop: "1rem" }}>
            <Link href="/members" style={{ color: "var(--text-secondary)", textDecoration: "none", opacity: 0.5 }}>
                スタッフ専用(管理画面)
            </Link>
        </div>
      </footer>
    </div>
  );
}
