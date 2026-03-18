"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Dog, Clock, LogIn, LogOut, CheckCircle, Users, Activity, RefreshCw, Calendar, ShieldCheck, Sparkles } from "lucide-react";
import Cookies from "js-cookie";
import styles from "./page.module.css";

// Use a distinct type that matches our Prisma schema include
type ActiveSession = {
  id: number;
  memberId: string;
  enteredAt: string;
  member: {
    id: string;
    dogName: string;
    photoUrl?: string | null;
  };
};

export default function Home() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotation, setRotation] = useState<{ patrol: string; clean: string } | null>(null);
  const [memberId, setMemberId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRotation = async () => {
    try {
      const res = await fetch("/api/rotation");
      const data = await res.json();
      if (data.success) {
        setRotation(data.rotation);
      }
    } catch (error) {
      console.error("Failed to fetch rotation:", error);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/status");
      const data = await res.json();
      if (data.success) {
        setSessions(data.activeSessions);
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchRotation();
    // Refresh every minute to show accurate durations and auto-remove after 30 mins
    const interval = setInterval(fetchSessions, 60000);
    
    // Load saved member ID from cookie
    const savedId = Cookies.get("wanwan_member_id");
    if (savedId) {
      setMemberId(savedId);
    }
    
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: "enter" | "exit", overrideId?: string) => {
    const idToUse = overrideId || memberId.trim();
    if (!idToUse) {
      setMessage({ type: "error", text: "会員IDを入力してください" });
      return;
    }

    try {
      setActionLoading(true);
      setMessage(null);
      const res = await fetch(`/api/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: idToUse }),
      });
      const data = await res.json();

      if (data.success) {
        if (action === "enter") {
          setMessage({ type: "success", text: `${data.session.member.dogName}ちゃんの入室を記録しました！` });
          Cookies.set("wanwan_member_id", idToUse, { expires: 30 }); // Save for 30 days
        } else {
          setMessage({ type: "success", text: "退室しました！" });
        }
        if (!overrideId) setMemberId(""); // Clear input only if not using override
        fetchSessions(); // Refresh the list
      } else {
        setMessage({ type: "error", text: data.error || "エラーが発生しました" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setActionLoading(false);
      // clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const formatDuration = (enteredAt: string) => {
    const diffMs = Date.now() - new Date(enteredAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return `${diffMins}分前`;
  };

  return (
    <div className="app-container">
      <nav className="navbar glass-panel">
        <Link href="/" className="nav-brand">
          <Dog size={28} />
          DogRun <span className="brandHighlight">Connect</span>
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link active">ダッシュボード</Link>
          <Link href="/members" className="nav-link">会員管理</Link>
          <Link href="/history" className="nav-link">利用履歴</Link>
        </div>
      </nav>

      <main className={styles.main}>

        <div className={styles.dashboardGrid}>
          {/* Left Column: Active Dogs */}
          <div className={`glass-panel ${styles.cardContainer}`}>
            <div className={styles.sectionTitle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity className="brandHighlight" /> 利用中のワンちゃん
              </div>
              <button 
                className={`btn btn-outline ${styles.refreshBtn}`} 
                onClick={fetchSessions} 
                disabled={loading}
                title="更新"
              >
                <RefreshCw size={16} className={loading ? styles.spin : ""} />
              </button>
            </div>

            {loading && sessions.length === 0 ? (
              <div className={styles.emptyState}>読み込み中...</div>
            ) : sessions.length > 0 ? (
              <div className={styles.dogsList}>
                {sessions.map((session) => (
                  <div 
                    key={session.id} 
                    className={styles.dogCard} 
                    onClick={() => {
                      if (confirm(`${session.member.dogName}ちゃんを退室させますか？`)) {
                        handleAction("exit", session.memberId);
                      }
                    }}
                    title={`${session.member.dogName}ちゃんを退室させる`}
                  >
                    <div className={styles.dogAvatar}>
                      {session.member.photoUrl ? (
                        <img 
                          src={session.member.photoUrl} 
                          alt={session.member.dogName} 
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <Dog size={40} />
                      )}
                    </div>
                    <div className={styles.dogName}>{session.member.dogName}</div>
                    <div className={styles.dogTime}>
                      <Clock size={14} /> 入室: {formatDuration(session.enteredAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Dog size={48} style={{ opacity: 0.2, margin: "0 auto 1rem" }} />
                <p>現在利用中のワンちゃんはいません。</p>
                <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>誰もいない貸切チャンスかも？</p>
              </div>
            )}
          </div>

          <div className={styles.rightColumn}>
            {/* Monthly Rotation Card */}
            <div className={`glass-panel ${styles.rotationCard} animate-fade-in`}>
              <div className={styles.sectionTitleSmall}>
                <Calendar size={18} className="brandHighlight" /> 今月のローテーション
              </div>
              {rotation ? (
                <div className={styles.rotationContent}>
                  <div className={styles.rotationItem}>
                    <div className={styles.rotationLabel}>
                      <ShieldCheck size={16} /> エチケット
                    </div>
                    <div className={styles.rotationValue}>{rotation.patrol}班</div>
                  </div>
                  <div className={styles.rotationDivider}></div>
                  <div className={styles.rotationItem}>
                    <div className={styles.rotationLabel}>
                      <Sparkles size={16} /> 公園清掃
                    </div>
                    <div className={styles.rotationValue}>{rotation.clean}班</div>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyRotation}>読み込み中...</div>
              )}
            </div>

            {/* Right Column: Entry/Exit Form */}
            <div className={`glass-panel ${styles.cardContainer}`}>
              <div className={styles.sectionTitle}>
                <Users className="brandHighlight" /> 入退室管理
              </div>
            
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              会員IDを入力して、入室または退室を記録してください。また、上のカードをタップしても退室できます。<br/>
              ※入室から30分経過すると自動的に退室扱いになります。
            </p>

            {message && (
              <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"} animate-fade-in`}>
                {message.text}
              </div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="memberId">会員ID</label>
              <input
                id="memberId"
                type="text"
                className="input-field"
                placeholder="例: 001"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                disabled={actionLoading}
              />
            </div>

            <div className={styles.formActions}>
              <button 
                className="btn btn-primary" 
                onClick={() => handleAction("enter")}
                disabled={actionLoading || !memberId.trim()}
              >
                <LogIn size={18} /> 入室
              </button>
              <button 
                className="btn btn-outline" 
                onClick={() => handleAction("exit")}
                disabled={actionLoading || !memberId.trim()}
              >
                <LogOut size={18} /> 退室
              </button>
            </div>
            </div>
          </div>
        </div>
      </main>

        <footer style={{ textAlign: "center", padding: "2rem", marginTop: "2rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          <p>&copy; {new Date().getFullYear()} DogRun Connect. All rights reserved.</p>
        </footer>
      </div>
    );
  }

