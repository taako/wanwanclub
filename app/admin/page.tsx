"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Dog, PlusCircle, Users, IdCard, Edit2, XCircle, Save } from "lucide-react";
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
  const [isEditMode, setIsEditMode] = useState(false);

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

  const handleEdit = (member: Member) => {
    setIsEditMode(true);
    setMemberId(member.id);
    setDogName(member.dogName);
    setPhotoPreview(member.photoUrl || null);
    setPhotoFile(null); // Clear selected file logic, existing photo shows in preview
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setMemberId("");
    setDogName("");
    setPhotoPreview(null);
    setPhotoFile(null);
    setMessage(null);
    
    // reset file input visually
    const fileInput = document.getElementById("photo") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
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
        method: isEditMode ? "PUT" : "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: isEditMode ? "会員情報を更新しました！" : "会員を登録しました！" });
        if (!isEditMode) {
            setMemberId("");
        }
        setDogName("");
        setPhotoFile(null);
        setPhotoPreview(null);
        setIsEditMode(false);
        fetchMembers();
      } else {
        setMessage({ type: "error", text: data.error || "登録に失敗しました" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
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
          <Link href="/history" className="nav-link">利用履歴</Link>
          <Link href="/admin" className="nav-link active">管理画面</Link>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className="page-title">{isEditMode ? "会員情報の編集" : "新規会員登録"}</h1>
          <p className="page-subtitle">{isEditMode ? "登録済みのワンちゃんの情報を更新します" : "新しいワンちゃんと飼い主様をシステムに登録します"}</p>
        </div>

        <div className={`glass-panel ${styles.formContainer}`}>
          <div className={styles.sectionTitle}>
            {isEditMode ? <Edit2 className="brandHighlight" /> : <PlusCircle className="brandHighlight" />} 
            {isEditMode ? " 編集フォーム" : " 登録フォーム"}
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
                disabled={loading || isEditMode}
              />
              {!isEditMode && <p className={styles.helperText}>※他の方とかぶらないIDを設定してください</p>}
              {isEditMode && <p className={styles.helperText}>※会員IDは変更できません</p>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="dogName">
                <Dog size={16} style={{display: "inline", marginRight: "4px", verticalAlign: "middle"}}/>
                ワンちゃんの名前
              </label>
              <input
                id="dogName"
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
              <button type="submit" className="btn btn-primary" disabled={loading || !memberId.trim() || !dogName.trim()}>
                {isEditMode ? <><Save size={20} /> 更新する</> : <><PlusCircle size={20} /> 登録する</>}
              </button>
              {isEditMode && (
                  <button type="button" className="btn btn-outline" onClick={handleCancelEdit} disabled={loading}>
                      <XCircle size={20} /> キャンセル
                  </button>
              )}
            </div>
          </form>
        </div>

        {/* List of registered members for demo purposes */}
        <div className={styles.membersListContainer}>
          <div className={styles.sectionTitle}>
            <Users className="brandHighlight" /> 登録済み会員一覧
          </div>
          
          <div className={styles.membersList}>
            {members.length === 0 ? (
              <div style={{textAlign: "center", color: "var(--text-secondary)", padding: "2rem"}}>
                まだ会員が登録されていません
              </div>
            ) : (
              members.map((member) => (
                <div key={member.id} className={styles.memberItem}>
                  <div className={styles.memberInfo}>
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.dogName} className={styles.memberListPhoto} />
                    ) : (
                      <Dog className="brandHighlight" size={20} />
                    )}
                    <span style={{fontWeight: 600}}>{member.dogName}</span>
                  </div>
                  <div className={styles.memberActionsWrap}>
                    <div className={styles.memberId}>ID: {member.id}</div>
                    <button 
                      className={`btn btn-outline ${styles.editButton}`} 
                      onClick={() => handleEdit(member)}
                      title="この会員を編集"
                    >
                      <Edit2 size={14} /> 編集
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
