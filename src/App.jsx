import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ALL_EPISODE_IDS, CAMPAIGN_CONFIG, CASES_CONFIG, EPISODE_META, VOCABULARY_REGISTRY } from './data/campaign.js';
import { computeScore, getStars, masteryScore } from './engine/scoring.js';
import { gameReducer, createInitialState, validateSavedState } from './engine/game.js';
import { commitImport, createExportPayload, exportSessionFor, initialCampaignProgress, isEpisodeUnlocked, loadCampaign, loadSession, loadVocabularyProgress, resetSession, saveCampaign, saveSession, saveVocabularyProgress, sessionKey, validateImportPayload } from './engine/persistence.js';
import { recordVocabularyResponse, recordVocabularySeen, vocabularyStats } from './engine/vocabulary.js';
import { playArabic, stopAudio } from './services/audioService.js';
import SceneArt from './components/SceneArt.jsx';

const formatDate = (value) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value)) : 'Belum selesai';
const isArabic = (value = '') => /[\u0600-\u06FF]/.test(value);
const modeLabels = { vocabulary: 'Kosakata', reading: 'Membaca', grammar: 'Tata bahasa' };
const statusLabels = { new: 'Belum dipelajari', learning: 'Sedang dipelajari', review: 'Perlu diulang', mastered: 'Dikuasai' };

function getRecoveryCopies() {
  const entries = [];
  try {
    for (const storageName of ['localStorage', 'sessionStorage']) {
      const storage = window[storageName];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key?.startsWith('basyir-agency:recovery:')) entries.push({ storage: storageName, key, raw: storage.getItem(key) });
      }
    }
  } catch { /* Browser storage may be disabled. */ }
  return entries;
}

function App() {
  const [screen, setScreen] = useState('campaign');
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [campaign, setCampaign] = useState(() => loadCampaign(ALL_EPISODE_IDS));
  const [vocabularyProgress, setVocabularyProgress] = useState(() => loadVocabularyProgress());
  const [notice, setNotice] = useState(null);
  const [activeSessionExport, setActiveSessionExport] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [importError, setImportError] = useState('');
  const [dictionarySearch, setDictionarySearch] = useState('');
  const [showFullReset, setShowFullReset] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { saveCampaign(campaign); }, [campaign]);
  useEffect(() => { saveVocabularyProgress(vocabularyProgress); }, [vocabularyProgress]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 4800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const handleAudioStatus = (event) => {
      if (event.detail?.message) setNotice({ kind: event.detail.kind || 'warning', message: event.detail.message });
    };
    window.addEventListener('basyir-audio-status', handleAudioStatus);
    return () => window.removeEventListener('basyir-audio-status', handleAudioStatus);
  }, []);

  const stats = useMemo(() => vocabularyStats(vocabularyProgress, VOCABULARY_REGISTRY), [vocabularyProgress]);
  const unlockedCount = useMemo(() => EPISODE_META.filter((item) => isEpisodeUnlocked(CASES_CONFIG[item.id], ALL_EPISODE_IDS, campaign)).length, [campaign]);
  const completedCount = useMemo(() => EPISODE_META.filter((item) => campaign.episodes[item.id]?.caseCompleted).length, [campaign]);
  const recoveryCount = getRecoveryCopies().length;

  const openEpisode = (id) => {
    const caseData = CASES_CONFIG[id];
    if (!isEpisodeUnlocked(caseData, ALL_EPISODE_IDS, campaign)) {
      setNotice({ kind: 'warning', message: 'Episode masih terkunci. Selesaikan kasus sebelumnya dan capai mastery minimal 70/100.' });
      return;
    }
    setActiveCaseId(id);
    setScreen('game');
    setActiveSessionExport(null);
  };

  const recordAttempt = useCallback((id) => {
    setCampaign((previous) => ({
      ...previous,
      episodes: {
        ...previous.episodes,
        [id]: { ...previous.episodes[id], attemptCount: (previous.episodes[id]?.attemptCount ?? 0) + 1 }
      }
    }));
  }, []);

  const recordCaseCompletion = useCallback((id, score, stars) => {
    setCampaign((previous) => {
      const old = previous.episodes[id] ?? initialCampaignProgress(ALL_EPISODE_IDS).episodes[id];
      const bestScore = Math.max(old.bestScore ?? 0, score);
      return {
        ...previous,
        episodes: {
          ...previous.episodes,
          [id]: {
            ...old,
            caseCompleted: true,
            latestScore: score,
            bestScore,
            starsEarned: getStars(bestScore, true),
            completedAt: new Date().toISOString()
          }
        }
      };
    });
  }, []);

  const recordMastery = useCallback((id, score) => {
    setCampaign((previous) => {
      const old = previous.episodes[id];
      return {
        ...previous,
        episodes: {
          ...previous.episodes,
          [id]: {
            ...old,
            latestMasteryScore: score,
            bestMasteryScore: Math.max(old.bestMasteryScore ?? 0, score)
          }
        }
      };
    });
    const nextIndex = ALL_EPISODE_IDS.indexOf(id) + 1;
    if (score >= 70 && nextIndex < ALL_EPISODE_IDS.length) {
      setNotice({ kind: 'success', message: 'Checkpoint selesai. Progres penguasaan terbaik diperbarui, dan episode berikutnya dapat terbuka jika kasus ini juga sudah selesai.' });
    } else if (score < 70) {
      setNotice({ kind: 'info', message: 'Mastery masih di bawah 70. Ulangi checkpoint untuk latihan terarah. Kasus tidak perlu dimainkan dari awal.' });
    }
  }, []);

  const recordVocabSeen = useCallback((vocabId, episodeId) => {
    setVocabularyProgress((previous) => recordVocabularySeen(previous, vocabId, episodeId));
  }, []);

  const recordVocabResponse = useCallback((vocabId, episodeId, correct, mode) => {
    setVocabularyProgress((previous) => recordVocabularyResponse(previous, vocabId, episodeId, correct, mode));
  }, []);

  const handleExportRecovery = () => {
    const copies = getRecoveryCopies();
    if (!copies.length) { setNotice({ kind: 'info', message: 'Tidak ada salinan pemulihan yang ditemukan.' }); return; }
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), recoveryCopies: copies }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `basyir-agency-recovery-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    setNotice({ kind: 'success', message: 'Salinan pemulihan diekspor. Simpan file ini sebelum melakukan reset penuh.' });
  };

  const handleExport = () => {
    let activeSession = activeSessionExport;
    const payload = createExportPayload(campaign, vocabularyProgress, activeSession);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `basyir-agency-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice({ kind: 'success', message: 'File backup JSON disiapkan. Simpan di tempat yang aman.' });
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImportError('');
    try {
      const payload = JSON.parse(await file.text());
      const imported = validateImportPayload(payload, ALL_EPISODE_IDS, new Set(Object.keys(VOCABULARY_REGISTRY)));
      if (imported.activeSession) {
        const caseData = CASES_CONFIG[imported.activeSession.caseId];
        if (!caseData || imported.activeSession.envelope.schemaVersion !== 1 || imported.activeSession.envelope.contentVersion !== caseData.contentVersion) {
          throw new Error('Snapshot sesi memiliki versi yang tidak cocok. Progres aktif tidak diubah.');
        }
        validateSavedState(imported.activeSession.envelope.state, caseData);
        if (typeof imported.activeSession.key !== 'string' || imported.activeSession.key !== sessionKey(caseData)) {
          throw new Error('Kunci snapshot sesi tidak valid.');
        }
      }
      setPendingImport({ imported, fileName: file.name });
    } catch (error) {
      setImportError(error?.message ?? 'Berkas tidak dapat dibaca.');
    }
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    try {
      commitImport(pendingImport.imported, campaign, vocabularyProgress);
      setCampaign(pendingImport.imported.campaignProgress);
      setVocabularyProgress(pendingImport.imported.vocabularyProgress);
      setPendingImport(null);
      setActiveCaseId(null);
      setActiveSessionExport(null);
      setScreen('campaign');
      setNotice({ kind: 'success', message: 'Impor berhasil. Progres lama telah dicadangkan sebelum data diganti.' });
    } catch (error) {
      setImportError(error?.message ?? 'Impor gagal. Progres aktif dipertahankan.');
      setPendingImport(null);
    }
  };

  const resetCampaignOnly = () => {
    if (!window.confirm('Reset seluruh hasil kampanye? Kamus Detektif tetap dipertahankan.')) return;
    setCampaign(initialCampaignProgress(ALL_EPISODE_IDS));
    setActiveCaseId(null);
    setScreen('campaign');
    setNotice({ kind: 'info', message: 'Hasil kampanye direset. Progres Kamus Detektif tetap tersimpan.' });
  };

  const resetDictionaryOnly = () => {
    if (!window.confirm('Reset seluruh progres Kamus Detektif? Hasil episode tidak akan dihapus.')) return;
    setVocabularyProgress({});
    setNotice({ kind: 'info', message: 'Progres kamus direset. Hasil kampanye tetap tersimpan.' });
  };

  const resetEverything = () => {
    try {
      Object.keys(localStorage).filter((key) => key.startsWith('basyir-agency:')).forEach((key) => localStorage.removeItem(key));
      Object.keys(sessionStorage).filter((key) => key.startsWith('basyir-agency:')).forEach((key) => sessionStorage.removeItem(key));
    } catch { /* State will still reset in memory. */ }
    setCampaign(initialCampaignProgress(ALL_EPISODE_IDS));
    setVocabularyProgress({});
    setActiveCaseId(null);
    setActiveSessionExport(null);
    setScreen('campaign');
    setShowFullReset(false);
    setNotice({ kind: 'info', message: 'Reset penuh selesai. Semua progres lokal dihapus. Gunakan ekspor JSON sebelum reset jika ingin menyimpan cadangan.' });
  };

  const nav = (next) => {
    stopAudio();
    setScreen(next);
    setActiveCaseId(null);
    setPendingImport(null);
  };

  return (
    <div className="app-root">
      <Header screen={screen} onNavigate={nav} onExport={handleExport} />
      {notice && <div className={`toast toast-${notice.kind}`} role="status"><span>{notice.kind === 'success' ? '✓' : notice.kind === 'warning' ? '!' : 'i'}</span>{notice.message}<button className="toast-close" onClick={() => setNotice(null)} aria-label="Tutup pemberitahuan">×</button></div>}
      <main id="main-content" className="main-shell">
        {screen === 'campaign' && <CampaignScreen campaign={campaign} unlockedCount={unlockedCount} completedCount={completedCount} vocabularyStats={stats} onOpenEpisode={openEpisode} onGoDictionary={() => nav('dictionary')} onGoData={() => nav('data')} />}
        {screen === 'game' && activeCaseId && <GameView key={activeCaseId} caseData={CASES_CONFIG[activeCaseId]} campaign={campaign} onBack={() => nav('campaign')} onAttempt={recordAttempt} onCaseComplete={recordCaseCompletion} onMasteryComplete={recordMastery} onVocabularySeen={recordVocabSeen} onVocabularyResponse={recordVocabResponse} onSessionChange={setActiveSessionExport} onNotice={setNotice} />}
        {screen === 'dictionary' && <DictionaryScreen progress={vocabularyProgress} search={dictionarySearch} setSearch={setDictionarySearch} onBack={() => nav('campaign')} onSeen={recordVocabSeen} onResponse={recordVocabResponse} />}
        {screen === 'data' && <DataScreen campaign={campaign} vocabularyStats={stats} recoveryCount={recoveryCount} onBack={() => nav('campaign')} onExport={handleExport} onExportRecovery={handleExportRecovery} onChooseImport={() => fileInputRef.current?.click()} onResetCampaign={resetCampaignOnly} onResetDictionary={resetDictionaryOnly} onResetFull={() => setShowFullReset(true)} importError={importError} />}
      </main>
      <input ref={fileInputRef} type="file" accept="application/json,.json" className="visually-hidden" onChange={handleFile} />
      {pendingImport && <div className="modal-backdrop" role="presentation"><section className="modal-card import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title"><div className="modal-eyebrow">Pemulihan data</div><h2 id="import-title">Konfirmasi impor backup</h2><p>File <strong>{pendingImport.fileName}</strong> lolos pemeriksaan struktur. Impor akan mengganti hasil kampanye dan progres kamus saat ini.</p><div className="import-summary"><div><strong>{Object.values(pendingImport.imported.campaignProgress.episodes).filter((row) => row.caseCompleted).length}</strong><span>kasus selesai</span></div><div><strong>{Object.keys(pendingImport.imported.vocabularyProgress).length}</strong><span>entri kamus</span></div><div><strong>{pendingImport.imported.activeSession ? 'Ada' : 'Tidak'}</strong><span>sesi aktif</span></div></div><p className="muted small">Sistem akan membuat backup progres aktif sebelum menggantinya. Penggabungan data tidak tersedia pada versi ini.</p><div className="modal-actions"><button className="btn btn-secondary" onClick={() => setPendingImport(null)}>Batal</button><button className="btn btn-primary" onClick={confirmImport}>Buat backup dan impor</button></div></section></div>}
      {showFullReset && <div className="modal-backdrop" role="presentation"><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="reset-title"><div className="modal-eyebrow danger-text">Tindakan permanen</div><h2 id="reset-title">Reset seluruh data lokal?</h2><p>Hasil kampanye, progres kamus, dan snapshot sesi akan dihapus. Aplikasi akan mencoba membuat salinan lokal sebelum reset. Untuk cadangan yang lebih aman, ekspor JSON terlebih dahulu.</p><div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowFullReset(false)}>Batalkan</button><button className="btn btn-danger" onClick={resetEverything}>Ya, reset penuh</button></div></section></div>}
      <Footer />
    </div>
  );
}

function Header({ screen, onNavigate, onExport }) {
  const links = [{ id: 'campaign', label: 'Kampanye' }, { id: 'dictionary', label: 'Kamus Detektif' }, { id: 'data', label: 'Data & backup' }];
  return <header className="site-header">
    <div className="header-inner">
      <button className="brand" onClick={() => onNavigate('campaign')} aria-label="Kembali ke halaman kampanye">
        <span className="brand-mark"><span>ب</span><i /></span>
        <span className="brand-copy"><strong>BASYIR <em>AGENCY</em></strong><small>DETECTIVE LEARNING LAB</small></span>
      </button>
      <nav className="main-nav" aria-label="Navigasi utama">{links.map((link) => <button key={link.id} className={screen === link.id ? 'nav-link active' : 'nav-link'} onClick={() => onNavigate(link.id)}>{link.label}</button>)}</nav>
      <button className="header-backup" onClick={onExport}><span>↥</span> Ekspor data</button>
    </div>
  </header>;
}

function CampaignScreen({ campaign, unlockedCount, completedCount, vocabularyStats: vStats, onOpenEpisode, onGoDictionary, onGoData }) {
  const totalBestScore = EPISODE_META.reduce((sum, item) => sum + (campaign.episodes[item.id]?.bestScore ?? 0), 0);
  const bestMastery = Math.max(0, ...EPISODE_META.map((item) => campaign.episodes[item.id]?.bestMasteryScore ?? 0));
  return <div className="campaign-screen page-enter">
    <section className="hero-panel">
      <div className="hero-text">
        <div className="eyebrow"><span className="eyebrow-dot" /> KAMPANYE INVESTIGASI BAHASA ARAB</div>
        <h1>Setiap kata menyimpan <span>petunjuk.</span></h1>
        <p>Masuk ke ruang kasus, kumpulkan bukti, baca petunjuk berbahasa Arab, dan susun kembali cerita yang tersembunyi.</p>
        <div className="hero-actions"><button className="btn btn-primary btn-large" onClick={() => onOpenEpisode('ep01-library')}>Mulai investigasi <span>↗</span></button><button className="btn btn-ghost" onClick={onGoDictionary}>Buka Kamus Detektif</button></div>
        <div className="hero-footnote"><span className="mini-shield">✦</span> Empat episode. Satu jejak bulan sabit. Banyak kata untuk ditemukan.</div>
      </div>
      <div className="hero-art" aria-label="Ilustrasi papan investigasi">
        <div className="hero-art-grid" />
        <div className="orbit orbit-one" /><div className="orbit orbit-two" />
        <div className="hero-folder"><div className="folder-tab" /><div className="folder-label">CASE FILE <strong>04 / 04</strong></div><div className="folder-stamp">CLASSIFIED</div><div className="folder-lines"><i /><i /><i /></div><div className="folder-crescent">☾</div></div>
        <div className="hero-pin pin-a">مِفْتَاحٌ</div><div className="hero-pin pin-b">رِسَالَةٌ</div><div className="hero-pin pin-c">سِجِلٌّ</div>
        <div className="hero-note note-a"><span>CASE NOTE</span><strong>Compare the clues.</strong><small>05 pieces of evidence</small></div>
        <div className="hero-note note-b"><span>LEAD FOUND</span><strong>☾ Crescent mark</strong><small>Follow the transfer record</small></div>
      </div>
    </section>

    <section className="stat-row" aria-label="Ringkasan progres">
      <StatCard icon="◈" label="Kasus selesai" value={`${completedCount}/4`} detail="Penyelesaian investigasi" />
      <StatCard icon="✦" label="Episode terbuka" value={`${unlockedCount}/4`} detail="Berdasarkan mastery" />
      <StatCard icon="▤" label="Kosakata ditemui" value={`${vStats.seen}/${vStats.total}`} detail={`${vStats.mastered} kata dikuasai`} />
      <StatCard icon="◎" label="Skor terbaik" value={totalBestScore.toLocaleString('id-ID')} detail={`Mastery tertinggi ${bestMastery}/100`} />
    </section>

    <section className="section-heading"><div><div className="eyebrow">THE CASE FILES</div><h2>Pilih kasus berikutnya</h2><p>Episode terbuka mengikuti hasil investigasi dan checkpoint Bahasa Arab.</p></div><button className="text-link" onClick={onGoData}>Kelola progres <span>↗</span></button></section>
    <div className="episode-grid">{EPISODE_META.map((meta, index) => {
      const caseData = CASES_CONFIG[meta.id];
      const progress = campaign.episodes[meta.id];
      const unlocked = isEpisodeUnlocked(caseData, ALL_EPISODE_IDS, campaign);
      const completed = progress?.caseCompleted;
      const percent = progress?.bestMasteryScore ?? 0;
      return <article key={meta.id} className={`episode-card accent-${meta.accent} ${!unlocked ? 'episode-locked' : ''}`}>
        <div className="episode-card-top"><span className="episode-number">EPISODE {meta.label}</span><span className={`episode-status ${completed ? 'status-complete' : unlocked ? 'status-open' : 'status-locked'}`}>{completed ? '✓ Selesai' : unlocked ? 'Terbuka' : 'Terkunci'}</span></div>
        <div className="episode-art-mini"><div className="mini-art-glow" /><div className="mini-art-icon">{unlocked ? meta.icon : '🔒'}</div><div className="mini-art-location">{meta.location}</div><span className="mini-art-index">{meta.label}</span></div>
        <div className="episode-card-body"><h3>{meta.title}</h3><p>{caseData.caseInfo.description}</p><div className="episode-meta"><span><i /> {caseData.curriculum.level}</span><span>{caseData.evidence.length} bukti</span></div>
          <div className="episode-progress-label"><span>Mastery terbaik</span><strong>{percent}/100</strong></div><div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
          <div className="episode-card-bottom"><div className="episode-score"><span>Skor terbaik</span><strong>{(progress?.bestScore ?? 0).toLocaleString('id-ID')} <small>/ 1.000</small></strong></div><button className={`icon-action ${unlocked ? '' : 'disabled'}`} onClick={() => onOpenEpisode(meta.id)} aria-label={`${unlocked ? 'Buka' : 'Episode terkunci'} ${meta.title}`} disabled={!unlocked}>{unlocked ? '↗' : '⌑'}</button></div>
        </div>
      </article>;
    })}</div>
    <section className="learning-note"><div className="note-icon">✦</div><div><strong>Catatan pembelajaran</strong><p>Materi Bahasa Arab pada versi ini masih berstatus draf implementasi. Harakat, transliterasi, struktur, dan rekaman perlu mendapat validasi guru atau penutur sebelum digunakan sebagai asesmen resmi.</p></div><button onClick={onGoDictionary} className="note-link">Latihan kosakata ↗</button></section>
  </div>;
}

function StatCard({ icon, label, value, detail }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div className="stat-content"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}

function GameView({ caseData, campaign, onBack, onAttempt, onCaseComplete, onMasteryComplete, onVocabularySeen, onVocabularyResponse, onSessionChange, onNotice }) {
  const [hydrated] = useState(() => loadSession(caseData));
  const reducer = useCallback((state, action) => gameReducer(state, action, caseData), [caseData]);
  const [state, dispatch] = useReducer(reducer, hydrated.state);
  const [storageStatus, setStorageStatus] = useState(hydrated.status);
  const recoveryBlocked = useRef(hydrated.blocked);
  const completionRecorded = useRef(false);
  const [activeOverlay, setActiveOverlay] = useState(null);
  const overlayDialogRef = useRef(null);
  const overlayTriggerRef = useRef(null);
  const [gameView, setGameView] = useState('game');
  const [masteryResult, setMasteryResult] = useState(null);
  const score = useMemo(() => computeScore(state, caseData.evidence.length), [state, caseData.evidence.length]);
  const stars = getStars(score.total, state.phase === 'case_solved');
  const foundCount = state.foundEvidenceIds.length;
  const activeEvidence = activeOverlay?.type === 'evidence' ? caseData.evidence.find((item) => item.id === activeOverlay.id) : null;
  const selectedSuspect = caseData.suspects.find((item) => item.id === state.selectedSuspectId);
  const episodeProgress = campaign.episodes[caseData.caseInfo.id];

  useEffect(() => {
    if (!recoveryBlocked.current) {
      const result = saveSession(state, caseData, false);
      setStorageStatus(result.status);
    }
    onSessionChange(exportSessionFor(caseData, state));
  }, [state, caseData, onSessionChange]);

  useEffect(() => {
    if (state.phase === 'case_solved' && !completionRecorded.current) {
      completionRecorded.current = true;
      onCaseComplete(caseData.caseInfo.id, score.total, stars);
    }
  }, [state.phase, score.total, stars, caseData.caseInfo.id, onCaseComplete]);

  useEffect(() => {
    if (!state.hintTargetId) return undefined;
    const timer = window.setTimeout(() => dispatch({ type: 'CLEAR_HINT' }), 3000);
    return () => window.clearTimeout(timer);
  }, [state.hintTargetId]);

  useEffect(() => {
    if (!state.hintCooldownActive) return undefined;
    const timer = window.setTimeout(() => dispatch({ type: 'HINT_COOLDOWN_END' }), 5000);
    return () => window.clearTimeout(timer);
  }, [state.hintCooldownActive]);

  useEffect(() => {
    if (!activeOverlay) {
      if (overlayTriggerRef.current?.isConnected) overlayTriggerRef.current.focus();
      return undefined;
    }
    const dialog = overlayDialogRef.current;
    const focusableSelector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = dialog ? [...dialog.querySelectorAll(focusableSelector)] : [];
    (focusables[0] ?? dialog)?.focus?.();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); setActiveOverlay(null); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const items = [...dialog.querySelectorAll(focusableSelector)];
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeOverlay]);

  const openOverlay = (payload) => { overlayTriggerRef.current = document.activeElement; setActiveOverlay(payload); };
  const openEvidence = (item) => {
    openOverlay({ type: 'evidence', id: item.id });
    onVocabularySeen(item.vocabularyId, caseData.caseInfo.id);
  };
  const findEvidence = () => {
    if (!activeEvidence) return;
    dispatch({ type: 'FIND_EVIDENCE', id: activeEvidence.id });
    setActiveOverlay(null);
  };
  const resetCurrent = () => {
    if (!window.confirm('Reset sesi episode ini? Hasil terbaik dan Kamus Detektif tetap tersimpan.')) return;
    stopAudio();
    const resetResult = resetSession(caseData);
    recoveryBlocked.current = false;
    completionRecorded.current = false;
    dispatch({ type: 'RESET_GAME' });
    setActiveOverlay(null);
    setGameView('game');
    setMasteryResult(null);
    setStorageStatus(resetResult.ok ? 'ready' : 'storage-failed');
    onNotice({ kind: 'info', message: 'Sesi episode direset. Hasil terbaik dan kamus tetap dipertahankan.' });
  };

  const startMastery = () => {
    if (state.phase !== 'case_solved') return;
    stopAudio();
    setMasteryResult(null);
    setGameView('mastery');
  };

  const completeMastery = (result) => {
    setMasteryResult(result);
    onMasteryComplete(caseData.caseInfo.id, result.score);
    setGameView('mastery-result');
  };

  const closeMastery = () => {
    setGameView('game');
    if (masteryResult?.score >= 70) onNotice({ kind: 'success', message: `Mastery ${masteryResult.score}/100 tersimpan. Periksa peta kampanye untuk melihat status episode berikutnya.` });
  };

  const statusText = storageStatus === 'saved' ? 'Progres sesi tersimpan' : storageStatus === 'storage-failed' ? 'Penyimpanan gagal' : storageStatus === 'recovery-needed' ? 'Penyimpanan diblokir' : storageStatus === 'version-incompatible' ? 'Versi data tidak cocok' : 'Sesi belum disimpan';
  const phaseIndex = ['intro', 'investigation', 'puzzle', 'suspect_selection', 'case_solved'].indexOf(state.phase);

  if (gameView === 'mastery') return <MasteryRunner caseData={caseData} onBack={closeMastery} onComplete={completeMastery} onVocabularyResponse={onVocabularyResponse} />;
  if (gameView === 'mastery-result') return <MasteryResult caseData={caseData} result={masteryResult} bestScore={Math.max(episodeProgress?.bestMasteryScore ?? 0, masteryResult?.score ?? 0)} onRetry={() => setGameView('mastery')} onBack={closeMastery} />;

  return <div className="game-screen page-enter">
    <div className="game-topbar"><button className="back-link" onClick={onBack}><span>←</span> Peta kampanye</button><div className="game-top-title"><span className="case-number">CASE {caseData.caseInfo.number}</span><strong>{caseData.caseInfo.title}</strong></div><div className={`storage-pill ${storageStatus === 'saved' ? 'is-saved' : storageStatus.includes('failed') || storageStatus.includes('needed') || storageStatus.includes('incompatible') ? 'is-warning' : ''}`}><i />{statusText}</div><button className="game-reset-link" onClick={resetCurrent}>Reset sesi</button></div>
    <section className="game-progress-header"><div><div className="eyebrow">{caseData.caseInfo.location.toUpperCase()}</div><h1>{state.phase === 'intro' ? 'Buka berkas kasus' : state.phase === 'investigation' ? 'Periksa tempat kejadian' : state.phase === 'puzzle' ? 'Susun potongan kalimat' : state.phase === 'suspect_selection' ? 'Periksa alibi tersangka' : 'Kasus terselesaikan'}</h1><p>{state.phase === 'intro' ? 'Baca briefing sebelum memulai investigasi.' : state.phase === 'investigation' ? 'Temukan semua lima bukti. Kamu dapat menggunakan gambar atau daftar target.' : state.phase === 'puzzle' ? 'Susun empat potongan sesuai struktur kalimat Bahasa Arab.' : state.phase === 'suspect_selection' ? 'Pilih kesimpulan yang paling konsisten dengan bukti.' : 'Lihat ringkasan, lalu selesaikan checkpoint Bahasa Arab.'}</p></div><div className="game-score-card"><span>SKOR SAAT INI</span><strong>{score.total.toLocaleString('id-ID')}</strong><small>/ 1.000 poin</small></div></section>
    <div className="phase-track" aria-label="Tahapan kasus">{[{label:'Briefing',phase:'intro'},{label:'Investigasi',phase:'investigation'},{label:'Puzzle',phase:'puzzle'},{label:'Vonis',phase:'suspect_selection'},{label:'Rekap',phase:'case_solved'}].map((item,index)=><div key={item.phase} className={`phase-step ${index < phaseIndex ? 'step-done' : index === phaseIndex ? 'step-current' : ''}`}><span>{index < phaseIndex ? '✓' : `0${index+1}`}</span><small>{item.label}</small></div>)}</div>

    {state.phase === 'intro' && <section className="briefing-layout"><div className="briefing-card"><div className="briefing-card-top"><span className="case-tag">FILE TERBATAS</span><span className="case-index">{caseData.caseInfo.number} / 04</span></div><div className="briefing-emblem">{caseData.sceneType === 'library' ? '📚' : caseData.sceneType === 'laboratory' ? '🧪' : caseData.sceneType === 'office' ? '📒' : '🕒'}</div><h2>{caseData.caseInfo.title}</h2><p>{caseData.caseInfo.description}</p><div className="briefing-location"><span>⌖</span><div><small>LOKASI</small><strong>{caseData.caseInfo.location}</strong></div></div><div className="briefing-divider" /><h3>Instruksi kasus</h3><ol className="briefing-list">{caseData.caseInfo.briefing.map((line,i)=><li key={line}><span>{String(i+1).padStart(2,'0')}</span>{line}</li>)}</ol><button className="btn btn-primary btn-full" onClick={() => { dispatch({ type: 'START_GAME' }); onAttempt(caseData.caseInfo.id); }}>Mulai investigasi <span>↗</span></button></div><div className="briefing-side"><div className="side-art"><SceneArt sceneType={caseData.sceneType} /><div className="scene-label">GAMBAR ILUSTRASI TKP</div></div><div className="side-objectives"><h3>Target pembelajaran</h3><div className="objective-row"><span>01</span><div><strong>Temukan 5 bukti</strong><small>Amati gambar dan daftar target.</small></div></div><div className="objective-row"><span>02</span><div><strong>Pahami kosakata</strong><small>Arab, transliterasi, dan arti.</small></div></div><div className="objective-row"><span>03</span><div><strong>Susun kesimpulan</strong><small>Bandingkan minimal dua petunjuk.</small></div></div></div></div></section>}

    {state.phase === 'investigation' && <section className="investigation-layout"><div className="scene-panel"><div className="panel-heading"><div><span className="panel-kicker">SCENE 01</span><h2>Tempat kejadian</h2></div><button className="btn btn-small btn-outline" onClick={() => openOverlay({ type: 'how-to' })}>Cara bermain</button></div><div className="scene-wrap"><SceneArt sceneType={caseData.sceneType} />{caseData.evidence.map((item,index)=><button key={item.id} className={`scene-hotspot ${state.foundEvidenceIds.includes(item.id) ? 'hotspot-found' : ''} ${state.hintTargetId === item.id ? 'hotspot-hinted' : ''}`} style={{ left: `${item.hotspot.left}%`, top: `${item.hotspot.top}%` }} onClick={() => openEvidence(item)} aria-label={`Periksa ${item.meaningIndo}`} title={item.meaningIndo}><span>{state.foundEvidenceIds.includes(item.id) ? '✓' : String(index+1).padStart(2,'0')}</span></button>)}</div><div className="scene-caption"><span><i className="legend-dot legend-found" /> Ditemukan</span><span><i className="legend-dot legend-unfound" /> Belum ditemukan</span><span className="scene-caption-note">Hotspot bukan satu-satunya cara. Gunakan daftar target.</span></div><div className="investigation-actions"><button className="btn btn-secondary" onClick={() => openOverlay({ type: 'board' })}>▦ Papan bukti <span className="counter-pill">{foundCount}/5</span></button><button className="btn btn-secondary" disabled={state.hintsUsed >= 3 || state.hintCooldownActive || Boolean(state.hintTargetId)} onClick={() => dispatch({ type: 'USE_HINT' })}>✦ Gunakan petunjuk <span className="counter-pill">{3-state.hintsUsed} tersisa</span></button></div></div><div className="targets-panel"><div className="panel-heading"><div><span className="panel-kicker">EVIDENCE LOG</span><h2>Daftar target</h2></div><span className="target-count">{foundCount}<small> / 5</small></span></div><div className="target-progress"><div className="progress-track"><span style={{ width: `${foundCount / 5 * 100}%` }} /></div><small>{foundCount === 5 ? 'Semua bukti terkumpul' : `Temukan ${5-foundCount} bukti lagi untuk membuka puzzle`}</small></div><div className="target-list">{caseData.evidence.map((item,index)=>{const found=state.foundEvidenceIds.includes(item.id);return <button key={item.id} className={`target-item ${found ? 'target-found' : ''} ${state.hintTargetId === item.id ? 'target-hinted' : ''}`} onClick={() => openEvidence(item)}><span className="target-glyph">{found ? '✓' : item.glyph}</span><span className="target-copy"><strong lang="ar" dir="rtl">{item.nameAr}</strong><small>{found ? item.meaningIndo : `Target ${String(index+1).padStart(2,'0')} · belum diperiksa`}</small></span><span className="target-arrow">{found ? '✓' : '↗'}</span></button>;})}</div><div className="target-footer"><span className="score-mini"><strong>{score.total}</strong> poin</span><span className="hint-mini">Petunjuk terpakai: {state.hintsUsed}/3</span></div><button className="btn btn-primary btn-full" disabled={foundCount !== 5} onClick={() => dispatch({ type: 'OPEN_PUZZLE' })}>Susun surat <span>→</span></button>{foundCount !== 5 && <p className="button-help">Tombol aktif setelah lima bukti dicatat.</p>}</div></section>}

    {state.phase === 'puzzle' && <section className="puzzle-layout"><div className="puzzle-intro-card"><div className="puzzle-icon">✉</div><span className="panel-kicker">FRAGMENT ANALYSIS</span><h2>Surat yang terpotong</h2><p>Susun potongan dari atas ke bawah. Gunakan arti dan transliterasi untuk membantu memahami urutan kalimat.</p><div className="puzzle-tip"><span>✦</span><div><strong>Petunjuk tata bahasa</strong><p>{caseData.puzzle.grammarNote}</p></div></div><div className="puzzle-stats"><div><span>Pengiriman susunan</span><strong>{state.puzzleAttempts}</strong></div><div><span>Nilai puzzle</span><strong>{score.puzzle}/200</strong></div></div></div><div className="puzzle-board"><div className="panel-heading"><div><span className="panel-kicker">LETTER PUZZLE</span><h2>Atur urutan kalimat</h2></div><span className="puzzle-count">4 fragmen</span></div><div className="puzzle-instruction">Gunakan tombol panah untuk memindahkan setiap potongan.</div><div className="puzzle-piece-list">{state.puzzleOrder.map((pieceId,index)=>{const item=caseData.puzzle.pieces.find((pieceItem)=>pieceItem.id===pieceId);return <div className={`puzzle-piece ${state.isPuzzleSolved ? 'piece-solved' : ''}`} key={pieceId}><span className="piece-number">{String(index+1).padStart(2,'0')}</span><div className="piece-text"><strong lang="ar" dir="rtl">{item.textArabic}</strong><span>{item.transliteration} <i>·</i> {item.translation}</span></div><div className="piece-controls"><button onClick={() => dispatch({type:'MOVE_PIECE',index,direction:-1})} disabled={index===0 || state.isPuzzleSolved} aria-label={`Pindahkan fragmen ${index+1} ke atas`}>↑</button><button onClick={() => dispatch({type:'MOVE_PIECE',index,direction:1})} disabled={index===state.puzzleOrder.length-1 || state.isPuzzleSolved} aria-label={`Pindahkan fragmen ${index+1} ke bawah`}>↓</button></div></div>;})}</div>{state.isPuzzleSolved ? <div className="sentence-reveal"><span className="success-check">✓</span><div><small>KALIMAT UTUH</small><strong lang="ar" dir="rtl">{caseData.puzzle.pieces.filter((pieceItem)=>caseData.puzzle.acceptedOrders[0].includes(pieceItem.id)).sort((a,b)=>caseData.puzzle.acceptedOrders[0].indexOf(a.id)-caseData.puzzle.acceptedOrders[0].indexOf(b.id)).map((item)=>item.textArabic).join(' ')}</strong><p>{caseData.puzzle.fullTranslation}</p></div></div> : <button className="btn btn-primary btn-full" onClick={() => dispatch({type:'SUBMIT_PUZZLE'})}>Periksa susunan <span>✓</span></button>}{state.isPuzzleSolved && <button className="btn btn-primary btn-full" onClick={() => dispatch({type:'CONTINUE_TO_SUSPECTS'})}>Lanjut ke pemilihan tersangka <span>→</span></button>}<p className="button-help">Setiap pengiriman susunan lengkap dihitung sebagai satu percobaan. Memindahkan fragmen tidak menambah percobaan.</p></div></section>}

    {state.phase === 'suspect_selection' && <section className="suspect-screen"><div className="suspect-intro"><div className="panel-kicker">FINAL DEDUCTION</div><h2>Siapa yang bertanggung jawab?</h2><p>Gunakan bukti yang telah ditemukan. Pilih orang yang paling sesuai dengan rantai petunjuk, bukan hanya satu catatan.</p><div className="evidence-recap-strip">{caseData.evidence.map((item)=> <span key={item.id} title={item.meaningIndo}>{item.glyph}<small>{item.meaningIndo}</small></span>)}</div></div><div className="suspect-grid">{caseData.suspects.map((item,index)=><button key={item.id} className={`suspect-card ${state.selectedSuspectId===item.id?'suspect-selected':''}`} onClick={()=>dispatch({type:'SELECT_SUSPECT',id:item.id})}><div className="suspect-card-top"><span className="suspect-index">SUSPECT 0{index+1}</span><span className="radio-mark">{state.selectedSuspectId===item.id?'✓':''}</span></div><div className="suspect-avatar"><span>{item.initials}</span><i /></div><h3>{item.name}</h3><strong lang="ar" dir="rtl" className="suspect-arabic">{item.nameAr}</strong><span className="suspect-role">{item.role}</span><div className="suspect-card-divider" /><div className="suspect-detail"><small>PERNYATAAN</small><p>{item.alibi}</p></div><div className="suspect-note"><span>!</span>{item.policeNote}</div></button>)}</div><div className="verdict-bottom"><div><span className="panel-kicker">KESIMPULAN</span><strong>{selectedSuspect ? `Pilihan: ${selectedSuspect.name}` : 'Belum ada tersangka dipilih'}</strong><small>Percobaan vonis: {state.verdictAttempts}</small></div><button className="btn btn-primary" disabled={!state.selectedSuspectId} onClick={()=>dispatch({type:'SUBMIT_VERDICT'})}>Kirim vonis <span>→</span></button></div></section>}

    {state.phase === 'case_solved' && <section className="summary-layout"><div className="summary-main"><div className="summary-seal">✓</div><div className="eyebrow">CASE CLOSED · {caseData.caseInfo.number}</div><h2>Investigasi selesai.</h2><p>{caseData.storyHook}</p><div className="summary-score-block"><div><span>SKOR KASUS</span><strong>{score.total.toLocaleString('id-ID')}</strong><small>dari 1.000 poin</small></div><div className="stars-row" aria-label={`${stars} bintang`}>{[1,2,3].map((n)=><span key={n} className={n<=stars?'star-filled':'star-empty'}>★</span>)}</div></div><div className="summary-breakdown"><div><span>Bukti</span><strong>{score.evidence}/500</strong></div><div><span>Puzzle</span><strong>{score.puzzle}/200</strong></div><div><span>Vonis</span><strong>{score.verdict}/300</strong></div><div><span>Penalti hint</span><strong className="penalty">−{score.hintPenalty}</strong></div></div><button className="btn btn-primary btn-full btn-large" onClick={startMastery}>Mulai checkpoint Bahasa Arab <span>↗</span></button><p className="button-help">Checkpoint berisi 10 item. Mastery minimal 70/100 diperlukan untuk membuka episode berikutnya.</p><button className="btn btn-ghost btn-full" onClick={onBack}>Kembali ke peta kampanye</button></div><div className="summary-side"><div className="summary-suspect"><div className="panel-kicker">KESIMPULAN UTAMA</div><div className="suspect-avatar suspect-avatar-large"><span>{caseData.suspects.find((item)=>item.isGuilty)?.initials}</span><i /></div><h3>{caseData.suspects.find((item)=>item.isGuilty)?.name}</h3><strong lang="ar" dir="rtl">{caseData.suspects.find((item)=>item.isGuilty)?.nameAr}</strong><p>{caseData.suspects.find((item)=>item.isGuilty)?.role}</p><div className="summary-proof"><span>✓</span><div><strong>Rantai bukti terkumpul</strong><small>5/5 bukti, puzzle benar, dan vonis benar.</small></div></div></div><div className="mastery-card"><div className="mastery-card-icon">◉</div><div><strong>Mastery Bahasa Arab</strong><p>Skor game tidak menggantikan hasil checkpoint bahasa.</p><span>Hasil terbaik saat ini: {episodeProgress?.bestMasteryScore ?? 0}/100</span></div></div></div></section>}

    {state.feedback && <div className={`game-feedback feedback-${state.feedback.kind}`} role="status" aria-live="polite"><span>{state.feedback.kind==='success'?'✓':state.feedback.kind==='warning'?'!':'i'}</span>{state.feedback.message}<button onClick={()=>dispatch({type:'CLEAR_FEEDBACK'})} aria-label="Tutup pesan">×</button></div>}

    {activeOverlay && <div className="modal-backdrop" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)setActiveOverlay(null);}}>{activeOverlay.type==='evidence' && activeEvidence && <section ref={overlayDialogRef} className="modal-card evidence-modal" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="evidence-title"><button className="modal-close" onClick={()=>setActiveOverlay(null)} aria-label="Tutup detail bukti">×</button><div className="evidence-modal-icon">{activeEvidence.glyph}</div><div className="modal-eyebrow">BUKTI {String(caseData.evidence.findIndex((item)=>item.id===activeEvidence.id)+1).padStart(2,'0')} · {state.foundEvidenceIds.includes(activeEvidence.id)?'TELAH DICATAT':'TARGET BARU'}</div><h2 id="evidence-title" lang="ar" dir="rtl">{activeEvidence.nameAr}</h2><div className="vocab-reading"><span>{activeEvidence.transliteration}</span><i>·</i><strong>{activeEvidence.meaningIndo}</strong><button className="audio-button" onClick={()=>playArabic({text:activeEvidence.nameAr})} aria-label={`Putar pelafalan ${activeEvidence.meaningIndo}`}>▶ <small>Dengarkan</small></button></div><div className="evidence-clue"><span>CLUE FOUND</span><p>{activeEvidence.clue}</p></div><div className="evidence-modal-foot"><p>Petunjuk perlu dibandingkan dengan bukti lain sebelum membuat kesimpulan.</p>{state.foundEvidenceIds.includes(activeEvidence.id) ? <button className="btn btn-secondary" onClick={()=>setActiveOverlay(null)}>Kembali ke TKP</button> : <button className="btn btn-primary" onClick={findEvidence}>Catat bukti <span>✓</span></button>}</div></section>}{activeOverlay.type==='board' && <section ref={overlayDialogRef} className="modal-card board-modal" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="board-title"><button className="modal-close" onClick={()=>setActiveOverlay(null)} aria-label="Tutup papan bukti">×</button><div className="modal-eyebrow">CASE EVIDENCE BOARD</div><h2 id="board-title">Papan bukti</h2><p className="muted">Petunjuk yang ditemukan dapat dibaca kembali sebelum menyusun surat.</p><div className="board-evidence-list">{caseData.evidence.filter((item)=>state.foundEvidenceIds.includes(item.id)).map((item,index)=><button key={item.id} onClick={()=>setActiveOverlay({type:'evidence',id:item.id})}><span>{item.glyph}</span><div><strong>{item.meaningIndo}</strong><small>{item.clue}</small></div><i>↗</i></button>)}{foundCount===0&&<div className="empty-state">Belum ada bukti. Mulai dengan memeriksa salah satu target.</div>}</div><div className="modal-actions"><button className="btn btn-primary" onClick={()=>setActiveOverlay(null)}>Kembali ke TKP</button></div></section>}{activeOverlay.type==='how-to' && <section ref={overlayDialogRef} className="modal-card" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="howto-title"><button className="modal-close" onClick={()=>setActiveOverlay(null)} aria-label="Tutup cara bermain">×</button><div className="modal-eyebrow">QUICK GUIDE</div><h2 id="howto-title">Cara bermain</h2><ol className="howto-list"><li><span>01</span><div><strong>Periksa lima target</strong><p>Klik hotspot di gambar atau gunakan daftar target di sebelah kanan.</p></div></li><li><span>02</span><div><strong>Baca bukti</strong><p>Perhatikan kata Arab, transliterasi, arti, dan petunjuk kasus.</p></div></li><li><span>03</span><div><strong>Susun kalimat</strong><p>Pindahkan fragmen dengan panah. Hanya pengiriman susunan lengkap yang dihitung sebagai percobaan.</p></div></li><li><span>04</span><div><strong>Ambil keputusan</strong><p>Bandingkan alibi dan pilih tersangka. Hint mengurangi 25 poin.</p></div></li></ol><button className="btn btn-primary btn-full" onClick={()=>setActiveOverlay(null)}>Mengerti</button></section>}</div>}
  </div>;
}

function MasteryRunner({ caseData, onBack, onComplete, onVocabularyResponse }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedbackState, setFeedbackState] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [complete, setComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [results, setResults] = useState([]);
  const question = caseData.mastery[index];

  const submit = () => {
    if (feedbackState) return;
    const correct = selected === question.correctIndex;
    setFeedbackState({ correct, explanation: question.explanation });
    setAnsweredCount((n) => n + 1);
    setCorrectCount((n) => n + (correct ? 1 : 0));
    setResults((previous) => [...previous, { id: question.id, correct, selected }]);
    onVocabularyResponse(question.vocabularyId, caseData.caseInfo.id, correct, question.mode);
  };

  const next = () => {
    if (index < caseData.mastery.length - 1) {
      setIndex((n) => n + 1);
      setSelected(null);
      setFeedbackState(null);
      return;
    }
    const resultScore = masteryScore(correctCount, caseData.mastery.length);
    setFinalScore(resultScore);
    setComplete(true);
    onComplete({ score: resultScore, correctCount, total: caseData.mastery.length, results });
  };

  if (complete) return <section className="mastery-screen page-enter"><button className="back-link" onClick={onBack}>← Kembali ke rekap kasus</button><div className="mastery-result-card"><div className="mastery-result-seal">{finalScore >= 70 ? '✓' : '↻'}</div><div className="eyebrow">CHECKPOINT SELESAI</div><h1>{finalScore >= 70 ? 'Target mastery tercapai.' : 'Perlu latihan tambahan.'}</h1><div className="mastery-big-score">{finalScore}<small>/100</small></div><p>{correctCount} dari {caseData.mastery.length} jawaban benar. {finalScore >= 70 ? 'Syarat penguasaan untuk episode ini terpenuhi.' : 'Ulangi checkpoint untuk mencoba lagi. Kamu tidak perlu mengulang investigasi.'}</p><div className="mastery-result-bar"><span style={{ width: `${finalScore}%` }} /></div><div className="mastery-result-details"><span><strong>{correctCount}</strong> benar</span><span><strong>{caseData.mastery.length-correctCount}</strong> perlu diperbaiki</span><span><strong>{finalScore >= 70 ? 'LULUS' : 'REMEDIAL'}</strong> status checkpoint</span></div><button className="btn btn-primary btn-large btn-full" onClick={onBack}>Kembali ke rekap <span>→</span></button></div></section>;

  return <section className="mastery-screen page-enter"><div className="mastery-top"><button className="back-link" onClick={onBack}>← Keluar dari checkpoint</button><span className="checkpoint-tag">LANGUAGE CHECKPOINT</span></div><div className="mastery-layout"><div className="mastery-side-card"><div className="mastery-side-icon">م</div><div className="eyebrow">{caseData.caseInfo.number} / 04 · {caseData.curriculum.level}</div><h1>Checkpoint Bahasa Arab</h1><p>Jawab sepuluh pertanyaan. Setiap item bernilai 10 poin. Jawaban kosong dihitung salah.</p><div className="mastery-progress-label"><span>Progres</span><strong>{index+1} / {caseData.mastery.length}</strong></div><div className="progress-track"><span style={{width:`${(index+1)/caseData.mastery.length*100}%`}} /></div><div className="mastery-mode-list"><span>▦ Kosakata dan konteks</span><span>◉ Membaca dan memahami</span><span>⌘ Tata bahasa</span></div><div className="mastery-side-note">Ambang pembukaan episode berikutnya: <strong>70/100</strong></div></div><div className="question-card"><div className="question-card-head"><span className="question-number">PERTANYAAN {String(index+1).padStart(2,'0')}</span><span className="question-mode">{modeLabels[question.mode]}</span></div><h2 className={question.arabicPrompt ? 'question-prompt prompt-arabic' : 'question-prompt'}>{question.prompt}</h2><div className="answer-options">{question.options.map((option,optionIndex)=><button key={option} className={`answer-option ${selected===optionIndex?'answer-selected':''} ${feedbackState && optionIndex===question.correctIndex?'answer-correct':''} ${feedbackState && selected===optionIndex && !feedbackState.correct?'answer-wrong':''}`} onClick={()=>!feedbackState&&setSelected(optionIndex)} disabled={Boolean(feedbackState)}><span className="option-letter">{String.fromCharCode(65+optionIndex)}</span><span className={isArabic(option)?'option-arabic':''}>{option}</span><i>{feedbackState&&optionIndex===question.correctIndex?'✓':selected===optionIndex?'●':''}</i></button>)}</div>{feedbackState && <div className={`question-feedback ${feedbackState.correct?'q-correct':'q-wrong'}`} role="status"><strong>{feedbackState.correct?'Tepat.':'Belum tepat.'}</strong><p>{feedbackState.explanation}</p></div>}<div className="question-card-bottom"><span>{answeredCount} jawaban dikirim</span>{feedbackState ? <button className="btn btn-primary" onClick={next}>{index===caseData.mastery.length-1?'Lihat hasil':'Pertanyaan berikutnya'} <span>→</span></button> : <button className="btn btn-primary" onClick={submit}>{selected===null?'Lewati pertanyaan':'Periksa jawaban'} <span>✓</span></button>}</div></div></div></section>;
}

function MasteryResult({ caseData, result, bestScore, onRetry, onBack }) {
  return <section className="mastery-screen page-enter"><button className="back-link" onClick={onBack}>← Kembali ke rekap kasus</button><div className="mastery-result-card"><div className="mastery-result-seal">{result?.score >= 70 ? '✓' : '↻'}</div><div className="eyebrow">CHECKPOINT SELESAI</div><h1>{result?.score >= 70 ? 'Target mastery tercapai.' : 'Perlu latihan tambahan.'}</h1><div className="mastery-big-score">{result?.score ?? 0}<small>/100</small></div><p>{result?.correctCount ?? 0} dari {result?.total ?? 10} jawaban benar. Skor terbaik yang tersimpan: {bestScore}/100.</p><div className="mastery-result-bar"><span style={{ width: `${result?.score ?? 0}%` }} /></div><div className="mastery-result-details"><span><strong>{result?.correctCount ?? 0}</strong> benar</span><span><strong>{(result?.total ?? 10)-(result?.correctCount ?? 0)}</strong> perlu diperbaiki</span><span><strong>{result?.score >= 70 ? 'LULUS' : 'REMEDIAL'}</strong> status checkpoint</span></div><div className="mastery-result-actions"><button className="btn btn-secondary" onClick={onBack}>Kembali ke rekap</button><button className="btn btn-primary" onClick={onRetry}>Ulangi checkpoint <span>↻</span></button></div><p className="button-help">Hasil checkpoint mengukur mastery Bahasa Arab. Skor kasus dan bintang dihitung secara terpisah.</p></div></section>;
}

function DictionaryScreen({ progress, search, setSearch, onBack, onSeen, onResponse }) {
  const [practiceOpen, setPracticeOpen] = useState(false);
  const rows = useMemo(() => vocabularyStats(progress, VOCABULARY_REGISTRY).rows.filter((row) => `${row.arabic} ${row.transliteration} ${row.meaningIndo}`.toLowerCase().includes(search.toLowerCase())), [progress, search]);
  return <div className="dictionary-screen page-enter"><div className="page-topline"><button className="back-link" onClick={onBack}>← Peta kampanye</button><span className="checkpoint-tag">PERSISTENT VOCABULARY</span></div><section className="dictionary-hero"><div><div className="eyebrow">DETECTIVE'S DICTIONARY</div><h1>Kamus Detektif</h1><p>Kosakata yang ditemukan dari empat kasus tersimpan di sini. Latihan retrieval membantu status penguasaan berubah berdasarkan riwayat jawaban, bukan sekadar pernah dilihat.</p><button className="btn btn-primary" onClick={()=>setPracticeOpen(true)}>Latihan 5 kata <span>↗</span></button></div><div className="dictionary-emblem">م<span>✦</span></div></section><div className="dictionary-stats"><StatCard icon="▤" label="Kosakata tersedia" value={Object.keys(VOCABULARY_REGISTRY).length} detail="Registry lintas episode"/><StatCard icon="◉" label="Pernah ditemui" value={Object.values(progress).filter((row)=>row.seenCount>0).length} detail="Tersimpan di perangkat"/><StatCard icon="✦" label="Dikuasai" value={Object.values(progress).filter((row)=>row.masteryStatus==='mastered').length} detail="Minimal tiga retrieval"/><StatCard icon="↻" label="Perlu diulang" value={Object.values(progress).filter((row)=>row.masteryStatus==='review').length} detail="Akurasi terbaru rendah"/></div><div className="dictionary-toolbar"><div><h2>Registry kosakata</h2><p>Gunakan pencarian Arab, transliterasi, atau arti.</p></div><label className="search-box"><span>⌕</span><input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Cari kosakata..." aria-label="Cari kosakata"/><kbd>⌘ K</kbd></label></div><div className="vocab-grid">{rows.map((row)=>{const current=progress[row.vocabId]??{};return <article key={row.vocabId} className="vocab-card"><div className="vocab-card-top"><span className={`vocab-status vocab-${current.masteryStatus??'new'}`}>{statusLabels[current.masteryStatus??'new']}</span><button className="audio-button" onClick={()=>{onSeen(row.vocabId,row.sourceEpisodeIds[0]);playArabic({text:row.arabic});}} aria-label={`Putar pelafalan ${row.meaningIndo}`}>▶ <small>Dengar</small></button></div><strong className="vocab-arabic" lang="ar" dir="rtl">{row.arabic}</strong><span className="vocab-translit">{row.transliteration}</span><h3>{row.meaningIndo}</h3><span className="vocab-level">{row.level} · {row.partOfSpeech}</span><div className="vocab-example"><span>CONTOH</span><strong lang="ar" dir="rtl">{row.exampleSentences[0]?.arabic}</strong><p>{row.exampleSentences[0]?.meaningIndo}</p></div><div className="vocab-card-foot"><span>Ditampilkan <strong>{current.seenCount??0}×</strong></span><span>Latihan <strong>{current.retrievalCount??0}×</strong></span><span>Benar <strong>{current.correctCount??0}</strong></span></div></article>;})}</div>{rows.length===0&&<div className="empty-state">Tidak ada kosakata yang cocok dengan pencarian.</div>}{practiceOpen&&<DictionaryPractice onClose={()=>setPracticeOpen(false)} onSeen={onSeen} onResponse={onResponse}/>}</div>;
}

function DictionaryPractice({ onClose, onSeen, onResponse }) {
  const words = useMemo(() => Object.values(VOCABULARY_REGISTRY).slice(0, 5), []);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedbackState, setFeedbackState] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const dialogRef = useRef(null);
  const row = words[index];
  const options = useMemo(() => {
    if (!row) return [];
    const meanings = [...new Set(Object.values(VOCABULARY_REGISTRY).map((item) => item.meaningIndo))];
    const others = meanings.filter((meaning) => meaning !== row.meaningIndo)
      .slice((index * 3) % Math.max(1, meanings.length - 3), (index * 3) % Math.max(1, meanings.length - 3) + 3);
    return [row.meaningIndo, ...others].sort((a, b) => ((a.charCodeAt(0) + index) % 7) - ((b.charCodeAt(0) + index) % 7));
  }, [row, index]);
  const correctIndex = options.indexOf(row?.meaningIndo);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 0);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    if (row) onSeen(row.vocabId, row.sourceEpisodeIds[0]);
  }, [row, onSeen]);

  const submit = () => {
    if (feedbackState || !row) return;
    const correct = selected === correctIndex;
    setFeedbackState({ correct });
    setCorrectCount((count) => count + (correct ? 1 : 0));
    onResponse(row.vocabId, row.sourceEpisodeIds[0], correct, 'dictionary-practice');
  };

  const next = () => {
    if (index === words.length - 1) {
      setDone(true);
      return;
    }
    setIndex((current) => current + 1);
    setSelected(null);
    setFeedbackState(null);
  };

  if (!row && !done) return null;

  return createPortal(
    <div
      className="modal-backdrop practice-backdrop"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        ref={dialogRef}
        className="modal-card practice-modal"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="practice-title"
        aria-describedby="practice-instructions"
      >
        <button className="modal-close" onClick={onClose} aria-label="Tutup latihan">×</button>
        {done ? <>
          <div className="mastery-result-seal">✓</div>
          <div className="eyebrow">LATIHAN KAMUS SELESAI</div>
          <h2 id="practice-title">{correctCount} dari {words.length} benar</h2>
          <p id="practice-instructions">Jawabanmu telah dicatat ke riwayat latihan kosakata.</p>
          <div className="practice-result-bar"><span style={{ width: `${(correctCount / words.length) * 100}%` }} /></div>
          <button className="btn btn-primary btn-full" onClick={onClose}>Kembali ke kamus</button>
        </> : <>
          <div className="modal-eyebrow">LATIHAN KAMUS · SOAL {index + 1} DARI {words.length}</div>
          <div className="practice-progress" aria-label={`Progres latihan ${index + 1} dari ${words.length}`}>
            <span style={{ width: `${((index + 1) / words.length) * 100}%` }} />
          </div>
          <h2 id="practice-title">Pilih arti yang tepat</h2>
          <p id="practice-instructions" className="practice-instructions">Pilih satu jawaban di bawah ini, lalu tekan “Periksa jawaban”.</p>
          <div className="practice-question-panel">
            <div className="practice-word" lang="ar" dir="rtl">{row.arabic}</div>
            <div className="practice-translit">{row.transliteration}</div>
          </div>
          <div className="answer-options practice-options">
            {options.map((option, optionIndex) => <button
              key={`${index}-${option}`}
              className={`answer-option ${selected === optionIndex ? 'answer-selected' : ''} ${feedbackState && option === row.meaningIndo ? 'answer-correct' : ''} ${feedbackState && selected === optionIndex && !feedbackState.correct ? 'answer-wrong' : ''}`}
              disabled={Boolean(feedbackState)}
              onClick={() => setSelected(optionIndex)}
            >
              <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
              <span>{option}</span>
              <i>{feedbackState && option === row.meaningIndo ? '✓' : ''}</i>
            </button>)}
          </div>
          {feedbackState && <div className={`question-feedback ${feedbackState.correct ? 'q-correct' : 'q-wrong'}`} role="status">
            {feedbackState.correct ? 'Tepat.' : 'Belum tepat.'} Arti kata ini adalah {row.meaningIndo}.
          </div>}
          <div className="modal-actions">
            {feedbackState
              ? <button className="btn btn-primary btn-full" onClick={next}>{index === words.length - 1 ? 'Lihat hasil' : 'Kata berikutnya'} →</button>
              : <button className="btn btn-primary btn-full" onClick={submit} disabled={selected === null}>Periksa jawaban</button>}
          </div>
        </>}
      </section>
    </div>,
    document.body
  );
}

function DataScreen({ campaign, vocabularyStats: vStats, recoveryCount, onBack, onExport, onExportRecovery, onChooseImport, onResetCampaign, onResetDictionary, onResetFull, importError }) {
  return <div className="data-screen page-enter"><div className="page-topline"><button className="back-link" onClick={onBack}>← Peta kampanye</button><span className="checkpoint-tag">LOCAL DATA MANAGEMENT</span></div><section className="data-hero"><div><div className="eyebrow">SAVE FILES & RECOVERY</div><h1>Data dan pemulihan</h1><p>Progres tersimpan pada browser dan perangkat ini. Tidak ada sinkronisasi cloud pada versi ini. Ekspor backup secara berkala untuk mencegah kehilangan data.</p></div><div className="data-lock-icon">▣<span>LOCAL</span></div></section><div className="data-stat-grid"><div className="data-stat"><span>Kasus selesai</span><strong>{EPISODE_META.filter((meta)=>campaign.episodes[meta.id]?.caseCompleted).length}/4</strong></div><div className="data-stat"><span>Kosakata pernah ditemui</span><strong>{vStats.seen}/{vStats.total}</strong></div><div className="data-stat"><span>Checkpoint terbaik</span><strong>{Math.max(0,...EPISODE_META.map((meta)=>campaign.episodes[meta.id]?.bestMasteryScore??0))}/100</strong></div></div><div className="data-action-grid"><article className="data-action-card"><div className="data-action-icon">↥</div><span className="panel-kicker">BACKUP</span><h2>Ekspor progres</h2><p>Unduh file JSON berisi hasil kampanye, progres kamus, dan snapshot sesi aktif jika tersedia.</p><button className="btn btn-primary btn-full" onClick={onExport}>Ekspor backup JSON <span>↗</span></button></article><article className="data-action-card"><div className="data-action-icon">↧</div><span className="panel-kicker">RESTORE</span><h2>Impor progres</h2><p>Pilih backup JSON. Sistem memvalidasi struktur, menampilkan pratinjau, lalu membuat backup progres saat ini sebelum mengganti data.</p><button className="btn btn-secondary btn-full" onClick={onChooseImport}>Pilih file JSON <span>↗</span></button>{importError&&<p className="import-error" role="alert">{importError}</p>}</article></div>{recoveryCount > 0 && <section className="recovery-notice"><div><strong>{recoveryCount} salinan pemulihan tersedia</strong><p>Data yang tidak dapat dibaca atau memiliki versi berbeda dipertahankan tanpa ditimpa. Ekspor salinan ini sebelum menghapus data situs.</p></div><button className="btn btn-secondary" onClick={onExportRecovery}>Ekspor salinan pemulihan <span>↗</span></button></section>}<section className="reset-section"><div><div className="eyebrow danger-text">RESET CONTROLS</div><h2>Atur ulang progres</h2><p>Setiap operasi memiliki cakupan berbeda. Ekspor backup terlebih dahulu jika ingin mempertahankan data.</p></div><div className="reset-actions"><button className="reset-row" onClick={onResetCampaign}><span className="reset-row-icon">↻</span><span><strong>Reset kampanye</strong><small>Hapus hasil episode. Kamus tetap.</small></span><i>→</i></button><button className="reset-row" onClick={onResetDictionary}><span className="reset-row-icon">▤</span><span><strong>Reset Kamus Detektif</strong><small>Hapus riwayat kosakata. Kampanye tetap.</small></span><i>→</i></button><button className="reset-row reset-row-danger" onClick={onResetFull}><span className="reset-row-icon">!</span><span><strong>Reset penuh</strong><small>Hapus progres kampanye, kamus, dan sesi.</small></span><i>→</i></button></div></section><div className="storage-disclaimer"><span>i</span><p><strong>Catatan penyimpanan.</strong> localStorage dan sessionStorage hanya berlaku di browser/perangkat yang sama. Menghapus data situs dapat menghapus progres. Impor versi ini menggunakan mode replace, bukan merge. Data yang tidak cocok dengan versi aplikasi akan ditolak.</p></div></div>;
}

function Footer() {
  return <footer className="site-footer"><div><span className="footer-mark">ب</span><strong>BASYIR AGENCY</strong><small>EDUCATIONAL INVESTIGATION GAME</small></div><p>vNext.1 · Prototipe client-side · Materi Arab menunggu validasi ahli</p><span className="footer-copyright">© 2026</span></footer>;
}

export default App;
