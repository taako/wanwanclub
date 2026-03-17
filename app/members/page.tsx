"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Dog, PlusCircle, Users, IdCard, Pencil, X, Save, Search } from "lucide-react";
import styles from "./page.module.css";

type Member = {
  id: string;
  dogName: string;
  photoUrl?: string | null;
  createdAt: string;
};

export default function Members() {
  const [memberId, setMemberId] = useState("");
  const [dogName, setDogName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dogNameInputRef = useRef<HTMLInputElement>(null);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (data.success) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleEdit = (member: Member) => {
    setIsEditing(true);
    setMemberId(member.id);
    setDogName(member.dogName);
    setPhotoPreview(member.photoUrl || null);
    setPhotoFile(null);
    setMessage(null);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Focus dog name input
    setTimeout(() => {
      dogNameInputRef.current?.focus();
    }, 100);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setMemberId("");
    setDogName("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "画像サイズは5MB以下にしてください" });
        return;
      }
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId.trim() || !dogName.trim()) {
      setMessage({ type: "error", text: "必須項目を入力してください" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      
      const formData = new FormData();
      formData.append("id", memberId.trim());
      formData.append("dogName", dogName.trim());
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const res = await fetch("/api/members", {
        method: isEditing ? "PATCH" : "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: isEditing ? "会員情報を更新しました！" : "会員を登録しました！" });
        if (!isEditing) {
          setMemberId("");
          setDogName("");
          setPhotoPreview(null);
        }
        setPhotoFile(null);
        setIsEditing(false);
        setMemberId("");
        setDogName("");
        setPhotoPreview(null);
        fetchMembers();
      } else {
        setMessage({ type: "error", text: data.error || "操作に失敗しました" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filteredMembers = members.filter(member => 
    member.dogName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      <nav className="navbar glass-panel">
        <Link href="/" className="nav-brand">
          <Dog size={28} />
          DogRun <span className="brandHighlight">Connect</span>
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">ダッシュボード</Link>
          <Link href="/members" className="nav-link active">会員管理</Link>
          <Link href="/history" className="nav-link">利用履歴</Link>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className="page-title">{isEditing ? "会員情報の編集" : "新規会員登録"}</h1>
          <p className="page-subtitle">
            {isEditing ? `ID: ${memberId} の情報を編集します` : "新しいワンちゃんと飼い主様をシステムに登録します"}
          </p>
        </div>

        {/* List of registered members */}
        <div className={styles.membersListContainer}>
          <div className={styles.sectionTitle}>
            <Users className="brandHighlight" /> 登録済み会員一覧
          </div>

          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="名前またはIDで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className={styles.membersList}>
            {filteredMembers.length === 0 ? (
              <div style={{textAlign: "center", color: "var(--text-secondary)", padding: "2rem"}}>
                {searchQuery ? "一致する会員が見つかりませんでした" : "まだ会員が登録されていません"}
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div key={member.id} className={styles.memberItem}>
                  <div className={styles.memberInfo}>
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.dogName} className={styles.memberListPhoto} />
                    ) : (
                      <Dog className="brandHighlight" size={20} />
                    )}
                    <div style={{display: "flex", flexDirection: "column"}}>
                      <span style={{fontWeight: 600}}>{member.dogName}</span>
                      <span className={styles.memberId}>ID: {member.id}</span>
                    </div>
                  </div>
                  <div className={styles.memberActions}>
                    <button 
                      className={styles.editBtn} 
                      onClick={() => handleEdit(member)}
                      title="編集"
                    >
                      <Pencil size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`glass-panel ${styles.formContainer}`}>
          <div className={styles.sectionTitle}>
            {isEditing ? <Pencil className="brandHighlight" /> : <PlusCircle className="brandHighlight" />} 
            {isEditing ? " 編集フォーム" : " 登録フォーム"}
          </div>
          
          {message && (
            <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"} animate-fade-in`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="memberId">
                <IdCard size={16} style={{display: "inline", marginRight: "4px", verticalAlign: "middle"}}/>
                会員ID
              </label>
              <input
                id="memberId"
                type="text"
                className="input-field"
                placeholder="好きな英数字（例: M001）"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                disabled={loading || isEditing}
              />
              {!isEditing && <p className={styles.helperText}>※他の方とかぶらないIDを設定してください</p>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="dogName">
                <Dog size={16} style={{display: "inline", marginRight: "4px", verticalAlign: "middle"}}/>
                ワンちゃんの名前
              </label>
                <input
                  id="dogName"
                  ref={dogNameInputRef}
                  type="text"
                  className="input-field"
                  placeholder="例: ぽち"
                  value={dogName}
                  onChange={(e) => setDogName(e.target.value)}
                  disabled={loading}
                />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="photo">
                ワンちゃんの写真 (任意)
              </label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                className={styles.fileInput}
              />
              {photoPreview && (
                <div className={styles.photoPreviewContainer}>
                  <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              {isEditing ? (
                <div className={styles.editActions}>
                  <button type="button" onClick={cancelEdit} className="btn btn-secondary cancelBtn" disabled={loading}>
                    <X size={20} /> キャンセル
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading || !dogName.trim()}>
                    <Save size={20} /> 更新する
                  </button>
                </div>
              ) : (
                <button type="submit" className="btn btn-primary" disabled={loading || !memberId.trim() || !dogName.trim()}>
                  <PlusCircle size={20} /> 登録する
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
