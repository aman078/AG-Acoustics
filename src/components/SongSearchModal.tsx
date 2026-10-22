import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Search, 
  Play, 
  Pause, 
  ChevronLeft, 
  Volume2, 
  Guitar,
  Loader2,
  ExternalLink,
  Globe,
  Heart,
  Clock,
  Music,
  Trash2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { SongData, transposeChord, calculateSmartCapo, CapoRecommendation } from '../data/popularSongs';
import { searchOnlineSongs, fetchCompleteSong, SearchSongItem } from '../services/chordService';
import { REPERTOIRE_PIECES, RepertoirePiece } from '../data/repertoire';
import { playGuitarStringTone } from '../audio/toneGenerator';
import { TablatureViewer } from './TablatureViewer';
import { findChordDiagram, ChordDef, ChordVoicing, getChordVoicings, strumChordVoicing } from './ChordLibraryModal';
import { cacheSongOffline, getCachedSongOffline, isSongCachedOffline } from '../services/offlineStorage';
import { requestScreenWakeLock, releaseScreenWakeLock } from '../utils/wakeLock';
import { detectSongTempo } from '../data/songTempos';

interface SongSearchModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenChordInfo?: (chordName: string) => void;
  isEmbedded?: boolean;
  onSongStateChange?: (isOpen: boolean) => void;
}

type SongSectionTab = 'search' | 'favorites' | 'repertoire';
type RepertoireFilter = 'all' | 'classical' | 'fingerstyle' | 'blues';

export interface EstimatedBpmResult {
  bpm: number;
  label: string;
  isAutoDetected: boolean;
}

function getEstimatedSongBpm(song: SongData | null): EstimatedBpmResult {
  if (!song) return { bpm: 84, label: 'Standard Practice Tempo', isAutoDetected: false };

  // 1. Direct song sheet metadata
  if (song.tempo) {
    if (typeof song.tempo === 'number' && song.tempo >= 40 && song.tempo <= 240) {
      return { bpm: song.tempo, label: `Original Master Tempo (${song.tempo} BPM)`, isAutoDetected: true };
    }
    if (typeof song.tempo === 'string') {
      const match = song.tempo.match(/(\d+)\s*bpm/i) || song.tempo.match(/(\d{2,3})/);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (parsed >= 40 && parsed <= 240) {
          return { bpm: parsed, label: `Master Tempo (${parsed} BPM)`, isAutoDetected: true };
        }
      }
    }
  }

  // 2. Check curated master classical/fingerstyle repertoire
  const repPiece = REPERTOIRE_PIECES.find(
    (p) => p.id === song.id || p.title.toLowerCase() === song.title.toLowerCase()
  );
  if (repPiece && repPiece.tempo) {
    const m = repPiece.tempo.match(/(\d+)\s*bpm/i);
    if (m) {
      const parsed = parseInt(m[1], 10);
      return { bpm: parsed, label: repPiece.tempo, isAutoDetected: true };
    }
  }

  // 3. Detect against verified acoustic database or explicit sheet lines
  const lyricsText = (song.sections || [])
    .flatMap((s) => s.lines.map((l) => l.lyrics))
    .join('\n');
  const detected = detectSongTempo(song.title, song.artist, song.tabContent || lyricsText);
  const isOriginal = detected.source === 'verified_catalog' || detected.source === 'sheet_meta';

  return {
    bpm: detected.bpm,
    label: isOriginal
      ? `Original Song Tempo (${detected.bpm} BPM)`
      : `Recommended Acoustic Tempo (${detected.bpm} BPM)`,
    isAutoDetected: isOriginal,
  };
}

export const SongSearchModal: React.FC<SongSearchModalProps> = ({
  isOpen = true,
  onClose,
  onOpenChordInfo,
  isEmbedded = false,
  onSongStateChange,
}) => {
  // Navigation Tabs
  const [sectionTab, setSectionTab] = useState<SongSectionTab>('search');
  const [repertoireFilter, setRepertoireFilter] = useState<RepertoireFilter>('all');
  const [discoverSearchQuery, setDiscoverSearchQuery] = useState<string>('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchSongItem[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);

  // Song View State
  const [selectedSong, setSelectedSong] = useState<SongData | null>(null);
  const [sheetViewMode, setSheetViewMode] = useState<'chords' | 'tab'>('chords');
  const [isLoadingSong, setIsLoadingSong] = useState<boolean>(false);
  const [transposeOffset, setTransposeOffset] = useState<number>(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('agsoft_scroll_speed');
      if (saved) {
        const val = Number(saved);
        if (!isNaN(val) && val >= 0.05 && val <= 3.0) return val;
      }
    } catch {}
    return 1;
  });

  useEffect(() => {
    try {
      localStorage.setItem('agsoft_scroll_speed', String(scrollSpeed));
    } catch {}
  }, [scrollSpeed]);

  const decreaseSpeed = () => {
    setScrollSpeed((prev) => {
      if (prev <= 0.1) return Math.max(0.05, Number((prev - 0.05).toFixed(2)));
      if (prev <= 0.3) return Number((prev - 0.05).toFixed(2));
      if (prev <= 1.0) return Number((prev - 0.1).toFixed(2));
      return Math.max(0.05, Number((prev - 0.2).toFixed(1)));
    });
  };

  const increaseSpeed = () => {
    setScrollSpeed((prev) => {
      if (prev < 0.3) return Number((prev + 0.05).toFixed(2));
      if (prev < 1.0) return Number((prev + 0.1).toFixed(2));
      return Math.min(3.0, Number((prev + 0.2).toFixed(1)));
    });
  };

  // Practice Accompaniment & Song Tempo Engine
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [practiceBpm, setPracticeBpm] = useState<number>(80);
  const [detectedTempoInfo, setDetectedTempoInfo] = useState<EstimatedBpmResult | null>(null);
  const [practiceSoundMode, setPracticeSoundMode] = useState<'both' | 'chords' | 'click' | 'silent'>('both');
  const [beatsPerChord, setBeatsPerChord] = useState<number>(4);
  const [currentBeatInBar, setCurrentBeatInBar] = useState<number>(0);
  const [currentChordIndex, setCurrentChordIndex] = useState<number>(0);
  const [isPracticeBarOpen, setIsPracticeBarOpen] = useState<boolean>(false);

  const practiceAudioCtxRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  // Flatten chords across all sections for sequential accompaniment tracking
  const flatChords = useMemo(() => {
    if (!selectedSong) return [];
    const list: Array<{
      globalIdx: number;
      chord: string;
      sectionIdx: number;
      lineIdx: number;
      chordIdx: number;
    }> = [];
    let count = 0;
    selectedSong.sections.forEach((sec, sIdx) => {
      sec.lines.forEach((line, lIdx) => {
        line.chords.forEach((c, cIdx) => {
          list.push({
            globalIdx: count,
            chord: c.chord,
            sectionIdx: sIdx,
            lineIdx: lIdx,
            chordIdx: cIdx,
          });
          count++;
        });
      });
    });
    return list;
  }, [selectedSong]);

  const chordIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    flatChords.forEach((item) => {
      map.set(`${item.sectionIdx}-${item.lineIdx}-${item.chordIdx}`, item.globalIdx);
    });
    return map;
  }, [flatChords]);

  // Audio click generator for practice metronome
  const playMetronomeClick = (isAccent: boolean) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!practiceAudioCtxRef.current) {
        practiceAudioCtxRef.current = new AudioCtxClass();
      }
      const ctx = practiceAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isAccent ? 1200 : 750, ctx.currentTime);

      gain.gain.setValueAtTime(isAccent ? 0.35 : 0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch {
      // AudioContext backgrounded or not allowed
    }
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const times = tapTimesRef.current.filter((t) => now - t < 2500);
    times.push(now);
    tapTimesRef.current = times;

    if (times.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avgInterval);
      if (bpm >= 40 && bpm <= 240) {
        setPracticeBpm(bpm);
      }
    }
  };

  const currentChordIndexRef = useRef(currentChordIndex);
  currentChordIndexRef.current = currentChordIndex;
  const currentBeatInBarRef = useRef(currentBeatInBar);
  currentBeatInBarRef.current = currentBeatInBar;
  const flatChordsRef = useRef(flatChords);
  flatChordsRef.current = flatChords;
  const beatsPerChordRef = useRef(beatsPerChord);
  beatsPerChordRef.current = beatsPerChord;
  const practiceSoundModeRef = useRef(practiceSoundMode);
  practiceSoundModeRef.current = practiceSoundMode;
  const transposeOffsetRef = useRef(transposeOffset);
  transposeOffsetRef.current = transposeOffset;

  // Strum and rhythm accompaniment loop
  useEffect(() => {
    if (!isPracticing || flatChords.length === 0) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    const msPerBeat = (60 / practiceBpm) * 1000;

    const tick = () => {
      let nextBeat = currentBeatInBarRef.current + 1;
      let nextChordIdx = currentChordIndexRef.current;

      if (nextBeat >= beatsPerChordRef.current) {
        nextBeat = 0;
        nextChordIdx = (currentChordIndexRef.current + 1) % flatChordsRef.current.length;
        currentChordIndexRef.current = nextChordIdx;
        setCurrentChordIndex(nextChordIdx);

        // Smoothly center the active playing chord on screen
        const targetToken = document.getElementById(`chord-token-${nextChordIdx}`);
        if (targetToken && scrollContainerRef.current) {
          const cRect = scrollContainerRef.current.getBoundingClientRect();
          const tRect = targetToken.getBoundingClientRect();
          if (tRect.top < cRect.top + 90 || tRect.bottom > cRect.bottom - 130) {
            targetToken.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }

        // Strum chord voicing on bar start
        const curChord = flatChordsRef.current[nextChordIdx];
        if (curChord && (practiceSoundModeRef.current === 'both' || practiceSoundModeRef.current === 'chords')) {
          const transposed = transposeChord(curChord.chord, transposeOffsetRef.current);
          const voicings = getChordVoicings(transposed);
          if (voicings && voicings.length > 0) {
            strumChordVoicing(voicings[0].frets, voicings[0].baseFret);
          }
        }
      }

      currentBeatInBarRef.current = nextBeat;
      setCurrentBeatInBar(nextBeat);

      // Play metronome click
      if (practiceSoundModeRef.current === 'both' || practiceSoundModeRef.current === 'click') {
        playMetronomeClick(nextBeat === 0);
      }
    };

    // Strum & click first beat on start
    if (currentBeatInBarRef.current === 0) {
      const curChord = flatChordsRef.current[currentChordIndexRef.current];
      if (curChord && (practiceSoundModeRef.current === 'both' || practiceSoundModeRef.current === 'chords')) {
        const transposed = transposeChord(curChord.chord, transposeOffsetRef.current);
        const voicings = getChordVoicings(transposed);
        if (voicings && voicings.length > 0) {
          strumChordVoicing(voicings[0].frets, voicings[0].baseFret);
        }
      }
      if (practiceSoundModeRef.current === 'both' || practiceSoundModeRef.current === 'click') {
        playMetronomeClick(true);
      }
    }

    timerIntervalRef.current = window.setInterval(tick, msPerBeat);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isPracticing, practiceBpm, flatChords.length]);

  // Cleanup practice audio on component unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (practiceAudioCtxRef.current && practiceAudioCtxRef.current.state !== 'closed') {
        practiceAudioCtxRef.current.close().catch(() => {});
        practiceAudioCtxRef.current = null;
      }
    };
  }, []);

  // Jump helpers for manual practice navigation
  const jumpPreviousChord = () => {
    if (flatChords.length === 0) return;
    const prev = (currentChordIndex - 1 + flatChords.length) % flatChords.length;
    setCurrentChordIndex(prev);
    setCurrentBeatInBar(0);
    const chordItem = flatChords[prev];
    if (chordItem) {
      const transposed = transposeChord(chordItem.chord, transposeOffset);
      const voicings = getChordVoicings(transposed);
      if (voicings && voicings.length > 0) {
        strumChordVoicing(voicings[0].frets, voicings[0].baseFret);
      }
    }
  };

  const jumpNextChord = () => {
    if (flatChords.length === 0) return;
    const next = (currentChordIndex + 1) % flatChords.length;
    setCurrentChordIndex(next);
    setCurrentBeatInBar(0);
    const chordItem = flatChords[next];
    if (chordItem) {
      const transposed = transposeChord(chordItem.chord, transposeOffset);
      const voicings = getChordVoicings(transposed);
      if (voicings && voicings.length > 0) {
        strumChordVoicing(voicings[0].frets, voicings[0].baseFret);
      }
    }
  };

  const [inspectChord, setInspectChord] = useState<{
    chordName: string;
    voicings: ChordVoicing[];
    activeIndex: number;
  } | null>(null);
  const [isCurrentSongOffline, setIsCurrentSongOffline] = useState<boolean>(false);

  // Dynamic Capo & Transposition Calculator
  const smartCapo: CapoRecommendation | null = useMemo(() => {
    if (!selectedSong) return null;
    return calculateSmartCapo(selectedSong.key, transposeOffset);
  }, [selectedSong, transposeOffset]);

  // Sync offline cached status & auto-calibrate song tempo whenever selected song changes
  useEffect(() => {
    if (selectedSong?.id) {
      isSongCachedOffline(selectedSong.id).then(setIsCurrentSongOffline);
      const tempoRes = getEstimatedSongBpm(selectedSong);
      setPracticeBpm(tempoRes.bpm);
      setDetectedTempoInfo(tempoRes);
      setCurrentChordIndex(0);
      setCurrentBeatInBar(0);
      setIsPracticing(false);
    } else {
      setIsCurrentSongOffline(false);
      setIsPracticing(false);
      setIsPracticeBarOpen(false);
      setDetectedTempoInfo(null);
    }
  }, [selectedSong]);

  // Local Storage States
  const [favorites, setFavorites] = useState<SearchSongItem[]>(() => {
    try {
      const saved = localStorage.getItem('agsoft_favorite_songs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('agsoft_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentSongs, setRecentSongs] = useState<SearchSongItem[]>(() => {
    try {
      const saved = localStorage.getItem('agsoft_recent_songs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const accumulatedScrollRef = useRef<number>(0);
  const isUserTouchingRef = useRef<boolean>(false);
  const touchResumeTimeoutRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeQueryRef = useRef<string>('');

  // Persist Favorites
  useEffect(() => {
    try {
      localStorage.setItem('agsoft_favorite_songs', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  // Persist Search History
  useEffect(() => {
    try {
      localStorage.setItem('agsoft_search_history', JSON.stringify(searchHistory));
    } catch (e) {
      console.error(e);
    }
  }, [searchHistory]);

  // Persist Recent Songs
  useEffect(() => {
    try {
      localStorage.setItem('agsoft_recent_songs', JSON.stringify(recentSongs));
    } catch (e) {
      console.error(e);
    }
  }, [recentSongs]);

  // Search Debounce with In-Flight Request Cancellation & Sequence Safety
  useEffect(() => {
    if (!isOpen) return;

    const currentQuery = searchQuery.trim();
    activeQueryRef.current = currentQuery;

    if (!currentQuery) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setSearchResults([]);
      setIsLoadingResults(false);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = window.setTimeout(async () => {
      // Abort any previous request in-flight
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoadingResults(true);
      try {
        const results = await searchOnlineSongs(currentQuery, controller.signal);
        
        // Strictly ensure the response belongs to the current user input before committing to state
        if (activeQueryRef.current === currentQuery && !controller.signal.aborted) {
          setSearchResults(results);

          // Save to search history if non-trivial and results were found
          if (currentQuery.length >= 3 && results.length > 0) {
            setSearchHistory((prev) => {
              const filtered = prev.filter((q) => q.toLowerCase() !== currentQuery.toLowerCase());
              return [currentQuery, ...filtered].slice(0, 10);
            });
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Search error:', err);
        }
      } finally {
        if (activeQueryRef.current === currentQuery) {
          setIsLoadingResults(false);
        }
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery, isOpen]);

  // Touch-Aware, Fluid 60fps/120fps Auto-Scroll with sub-pixel delta
  useEffect(() => {
    if (!isAutoScrolling) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    if (scrollContainerRef.current) {
      accumulatedScrollRef.current = scrollContainerRef.current.scrollTop;
    }

    let lastTimestamp = performance.now();

    const scrollStep = (now: number) => {
      const deltaSeconds = Math.min((now - lastTimestamp) / 1000, 0.05);
      lastTimestamp = now;

      const container = scrollContainerRef.current;
      if (container && !isUserTouchingRef.current) {
        // Smooth progression calibrated to scrollSpeed:
        // 0.05x gives ~1.2 px/sec (ultra-slow crawl for relaxed practice)
        // 1.0x gives 24 px/sec (natural pace)
        const pxPerSec = Math.max(0.8, scrollSpeed * 24);
        accumulatedScrollRef.current += pxPerSec * deltaSeconds;

        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll > 0 && accumulatedScrollRef.current >= maxScroll - 2) {
          container.scrollTop = maxScroll;
          setIsAutoScrolling(false);
          return;
        }

        container.scrollTop = accumulatedScrollRef.current;
      }

      animFrameIdRef.current = requestAnimationFrame(scrollStep);
    };

    animFrameIdRef.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      if (touchResumeTimeoutRef.current) {
        clearTimeout(touchResumeTimeoutRef.current);
        touchResumeTimeoutRef.current = null;
      }
    };
  }, [isAutoScrolling, scrollSpeed]);

  // Touch and Manual Scroll Handlers to prevent jerking and stutter
  const handleUserTouchStart = () => {
    isUserTouchingRef.current = true;
    if (touchResumeTimeoutRef.current) {
      clearTimeout(touchResumeTimeoutRef.current);
      touchResumeTimeoutRef.current = null;
    }
    if (scrollContainerRef.current) {
      accumulatedScrollRef.current = scrollContainerRef.current.scrollTop;
    }
  };

  const handleUserTouchEnd = () => {
    if (touchResumeTimeoutRef.current) {
      clearTimeout(touchResumeTimeoutRef.current);
    }
    touchResumeTimeoutRef.current = window.setTimeout(() => {
      if (scrollContainerRef.current) {
        accumulatedScrollRef.current = scrollContainerRef.current.scrollTop;
      }
      isUserTouchingRef.current = false;
    }, 200);
  };

  const handleContainerScroll = () => {
    if (isUserTouchingRef.current && scrollContainerRef.current) {
      accumulatedScrollRef.current = scrollContainerRef.current.scrollTop;
    }
  };

  const handleUserWheel = () => {
    isUserTouchingRef.current = true;
    if (scrollContainerRef.current) {
      accumulatedScrollRef.current = scrollContainerRef.current.scrollTop;
    }
    if (touchResumeTimeoutRef.current) {
      clearTimeout(touchResumeTimeoutRef.current);
    }
    touchResumeTimeoutRef.current = window.setTimeout(() => {
      if (scrollContainerRef.current) {
        accumulatedScrollRef.current = scrollContainerRef.current.scrollTop;
      }
      isUserTouchingRef.current = false;
    }, 300);
  };

  if (!isOpen) return null;

  // Toggle Favorite & Save Full Song Offline in IndexedDB
  const isFavorite = (songId: string): boolean => {
    return favorites.some((f) => f.id === songId);
  };

  const toggleFavorite = async (item: SearchSongItem | SongData) => {
    const isCurrentlyFav = favorites.some((f) => f.id === item.id);
    const songItem: SearchSongItem = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      url: (item as any).url || item.id,
      source: (item as any).source || 'Favorite',
      difficulty: item.difficulty,
      hasChords: true,
    };

    if (isCurrentlyFav) {
      setFavorites((prev) => prev.filter((f) => f.id !== songItem.id));
      if (selectedSong?.id === songItem.id) {
        setIsCurrentSongOffline(false);
      }
    } else {
      setFavorites((prev) => [songItem, ...prev]);

      // Cache full song content offline immediately so it's always ready with zero network
      if (selectedSong && selectedSong.id === songItem.id) {
        await cacheSongOffline(selectedSong);
        setIsCurrentSongOffline(true);
      } else {
        fetchCompleteSong(songItem).then(async (fullSong) => {
          if (fullSong) {
            await cacheSongOffline(fullSong);
          }
        }).catch((err) => {
          console.warn('Could not pre-cache favorite song offline:', err);
        });
      }
    }
  };

  // Open Song (Offline first with automatic IndexedDB caching)
  const handleSelectSong = async (item: SearchSongItem) => {
    setIsLoadingSong(true);
    try {
      // 1. Check local offline IndexedDB cache for instant zero-latency opening
      let fullSong = await getCachedSongOffline(item.id);

      // 2. If not cached locally, fetch online and cache immediately
      if (!fullSong) {
        fullSong = await fetchCompleteSong(item);
        if (fullSong) {
          await cacheSongOffline(fullSong);
          setIsCurrentSongOffline(true);
        }
      } else {
        setIsCurrentSongOffline(true);
      }

      if (fullSong) {
        setSelectedSong(fullSong);
        setTransposeOffset(0);
        setSheetViewMode(fullSong.tabContent ? 'tab' : 'chords');

        // Add to recent songs
        setRecentSongs((prev) => {
          const filtered = prev.filter((s) => s.id !== item.id);
          return [item, ...filtered].slice(0, 10);
        });
      }
    } catch (err) {
      console.error('Error opening song:', err);
    } finally {
      setIsLoadingSong(false);
    }
  };

  const handleSelectRepertoire = async (piece: RepertoirePiece) => {
    const fullSong: SongData = {
      id: piece.id,
      title: piece.title,
      artist: piece.artist,
      key: piece.key,
      capo: piece.capo,
      tuning: piece.tuning,
      difficulty: piece.difficulty,
      allChords: piece.allChords,
      tabContent: piece.tabContent,
      sections: piece.sections,
    };

    // Cache piece for offline rehearsal
    await cacheSongOffline(fullSong);
    setIsCurrentSongOffline(true);

    setSelectedSong(fullSong);
    setTransposeOffset(0);
    setSheetViewMode(piece.tabContent ? 'tab' : 'chords');

    const songItem: SearchSongItem = {
      id: piece.id,
      title: piece.title,
      artist: piece.artist,
      url: piece.id,
      source: `AGSoft ${piece.category.toUpperCase()}`,
      difficulty: piece.difficulty,
      hasChords: true,
    };
    setRecentSongs((prev) => {
      const filtered = prev.filter((s) => s.id !== piece.id);
      return [songItem, ...filtered].slice(0, 10);
    });
  };

  const handlePlayChord = (chordName: string) => {
    const noteFreqs: { [k: string]: number } = {
      'C': 130.81, 'C#': 138.59, 'D': 146.83, 'D#': 155.56,
      'E': 164.81, 'F': 174.61, 'F#': 185.00, 'G': 196.00,
      'G#': 207.65, 'A': 220.00, 'A#': 233.08, 'B': 246.94
    };
    const root = chordName.match(/^([A-G][#b]?)/)?.[1] || 'C';
    const freq = noteFreqs[root] || 196.0;
    playGuitarStringTone(freq, 1.5);
  };

  const handleInspectChord = (chordName: string) => {
    const voicings = getChordVoicings(chordName);
    if (voicings && voicings.length > 0) {
      setInspectChord({
        chordName,
        voicings,
        activeIndex: 0,
      });
      strumChordVoicing(voicings[0].frets, voicings[0].baseFret);
    } else {
      handlePlayChord(chordName);
    }
  };

  // Filtered & Discovered Repertoire Pieces
  const filteredRepertoire = useMemo(() => {
    let pieces = REPERTOIRE_PIECES;
    if (repertoireFilter !== 'all') {
      pieces = pieces.filter((p) => p.category === repertoireFilter);
    }
    if (discoverSearchQuery.trim()) {
      const q = discoverSearchQuery.toLowerCase().trim();
      pieces = pieces.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.artist.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.difficulty.toLowerCase().includes(q)
      );
    }
    return pieces;
  }, [repertoireFilter, discoverSearchQuery]);

  // Synchronize full-screen view state with parent for Android Back Button
  useEffect(() => {
    onSongStateChange?.(!!selectedSong || !!inspectChord);
  }, [selectedSong, inspectChord, onSongStateChange]);

  // Infinite Screen Timeout: Keeps mobile & browser screen awake while viewing a song or scrolling chords
  useEffect(() => {
    if (!selectedSong) {
      releaseScreenWakeLock();
      return;
    }

    requestScreenWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedSong) {
        requestScreenWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseScreenWakeLock();
    };
  }, [selectedSong]);

  // Handle custom close event from Android hardware Back Button
  useEffect(() => {
    const handleCloseEvent = () => {
      if (inspectChord) {
        setInspectChord(null);
      } else if (selectedSong) {
        setSelectedSong(null);
        setIsAutoScrolling(false);
        setTransposeOffset(0);
      } else if (sectionTab !== 'search') {
        setSectionTab('search');
      }
    };
    window.addEventListener('agsoft_close_song', handleCloseEvent);
    return () => window.removeEventListener('agsoft_close_song', handleCloseEvent);
  }, [inspectChord, selectedSong, sectionTab]);

  // Push history state so browser swipe back on mobile Chrome closes song instead of exiting
  useEffect(() => {
    if (selectedSong) {
      window.history.pushState({ songView: true }, '');
      const handlePopState = () => {
        if (inspectChord) {
          setInspectChord(null);
        } else {
          setSelectedSong(null);
          setIsAutoScrolling(false);
          setTransposeOffset(0);
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [selectedSong, inspectChord]);

  // Desktop Keyboard Shortcuts (Space for Auto-Scroll, -/+ for Speed, Arrows for Key)
  useEffect(() => {
    if (!selectedSong) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input field
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setIsAutoScrolling((prev) => !prev);
      } else if (e.key === '-' || e.key === '_' || e.key === '[' || e.key === 'ArrowDown') {
        e.preventDefault();
        decreaseSpeed();
      } else if (e.key === '+' || e.key === '=' || e.key === ']' || e.key === 'ArrowUp') {
        e.preventDefault();
        increaseSpeed();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setTransposeOffset((prev) => prev - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setTransposeOffset((prev) => prev + 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (inspectChord) {
          setInspectChord(null);
        } else {
          setSelectedSong(null);
          setIsAutoScrolling(false);
          setTransposeOffset(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSong, inspectChord]);

  // Fullscreen Immersive Song Sheet View
  if (selectedSong) {
    return (
      <div className="song-sheet-container fixed inset-0 z-[100] w-full h-full bg-white dark:bg-[#08090D] flex flex-col overflow-hidden text-slate-950 dark:text-slate-100 select-text">
        {/* Fullscreen Sticky Header with iOS Notch Safe Area Inset */}
        <div className="song-player-header flex items-center justify-between px-3 sm:px-6 pt-[max(10px,env(safe-area-inset-top,0px))] pb-2.5 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shrink-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                setSelectedSong(null);
                setIsAutoScrolling(false);
                setTransposeOffset(0);
                setInspectChord(null);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 transition cursor-pointer flex items-center gap-1 shrink-0 font-bold text-xs shadow-sm"
              title="Back to Song Search"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>SONGS</span>
            </button>
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate flex items-center gap-2">
                <span>{selectedSong.title}</span>
                {selectedSong.difficulty && (
                  <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                    {selectedSong.difficulty}
                  </span>
                )}
              </h2>
              <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-2">
                <span className="text-slate-800 dark:text-slate-300 font-medium">{selectedSong.artist}</span>
                <span>•</span>
                <span>Key: <strong className="text-cyan-600 dark:text-cyan-400">{selectedSong.key}</strong></span>
                <span>•</span>
                <span>Capo: <strong className="text-emerald-600 dark:text-emerald-400">{selectedSong.capo}</strong></span>
                {isCurrentSongOffline && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    ⚡ Offline Saved
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold" title="Screen timeout is paused while viewing this song">
                  ⚡ Screen Awake
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle: Chords vs 6-String Tab */}
            {selectedSong.tabContent && (
              <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                <button
                  onClick={() => setSheetViewMode('chords')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    sheetViewMode === 'chords'
                      ? 'bg-emerald-500 text-black shadow-sm font-extrabold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Guitar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chords</span>
                </button>
                <button
                  onClick={() => setSheetViewMode('tab')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    sheetViewMode === 'tab'
                      ? 'bg-cyan-500 text-black shadow-sm font-extrabold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">6-Str Tab</span>
                </button>
              </div>
            )}

            {/* Like / Favorite Button */}
            <button
              onClick={() => toggleFavorite(selectedSong)}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isFavorite(selectedSong.id)
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-500 dark:text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={isFavorite(selectedSong.id) ? 'Saved to Favorites' : 'Save Song'}
            >
              <Heart className={`w-4 h-4 ${isFavorite(selectedSong.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Clickable Chords Quick Audition Pill Bar */}
        {selectedSong.allChords.length > 0 && (
          <div className="flex items-center gap-2 px-3 sm:px-6 py-2 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 overflow-x-auto shrink-0 scrollbar-none z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
              CHORDS IN SONG:
            </span>
            {selectedSong.allChords.map((chord) => {
              const transposed = transposeChord(chord, transposeOffset);
              return (
                <button
                  key={chord}
                  onClick={() => handleInspectChord(transposed)}
                  className="group px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-[#f15a24]/15 border border-slate-300 dark:border-slate-700 hover:border-[#f15a24]/50 text-xs font-mono font-bold text-slate-900 dark:text-white hover:text-[#f15a24] dark:hover:text-[#ff7a45] transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                  title={`Play ${transposed} & view fingering`}
                >
                  <span>{transposed}</span>
                  <Volume2 className="w-3 h-3 text-slate-400 group-hover:text-[#f15a24]" />
                </button>
              );
            })}
          </div>
        )}

        {/* Scrollable Song Body */}
        <div
          ref={scrollContainerRef}
          onScroll={handleContainerScroll}
          onTouchStart={handleUserTouchStart}
          onTouchEnd={handleUserTouchEnd}
          onTouchCancel={handleUserTouchEnd}
          onPointerDown={handleUserTouchStart}
          onPointerUp={handleUserTouchEnd}
          onWheel={handleUserWheel}
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 font-mono space-y-6 pb-28 overscroll-contain"
        >
          {sheetViewMode === 'tab' && selectedSong.tabContent ? (
            <TablatureViewer tabContent={selectedSong.tabContent} title={selectedSong.title} />
          ) : (
            selectedSong.sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-3">
                <div className="text-xs font-mono font-bold text-[#f15a24] dark:text-[#ff7a45] tracking-wider uppercase border-b border-[#f15a24]/30 pb-1 flex items-center justify-between">
                  <span>[{section.sectionTitle}]</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-normal">
                    {section.lines.length} lines
                  </span>
                </div>

                <div className="space-y-3">
                  {section.lines.map((line, lIdx) => {
                    const isPureChords = !line.lyrics || line.lyrics.trim() === '...';

                    if (isPureChords && line.chords.length > 0) {
                      return (
                        <div
                          key={lIdx}
                          className="flex flex-wrap items-center gap-2 py-1.5 px-3 my-1 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800/80 w-fit"
                        >
                          <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-widest mr-1 font-bold">
                            CHORDS:
                          </span>
                          {line.chords.map((c, cIdx) => {
                            const transposed = transposeChord(c.chord, transposeOffset);
                            const gIdx = chordIndexMap.get(`${sIdx}-${lIdx}-${cIdx}`) ?? 0;
                            const isPlayingThisChord = isPracticing && currentChordIndex === gIdx;
                            return (
                              <button
                                key={cIdx}
                                id={`chord-token-${gIdx}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentChordIndex(gIdx);
                                  setCurrentBeatInBar(0);
                                  handleInspectChord(transposed);
                                }}
                                className={`px-2 py-0.5 rounded-lg font-mono font-extrabold text-xs cursor-pointer transition-all shadow-sm ${
                                  isPlayingThisChord
                                    ? 'bg-[#f15a24] text-white shadow-md ring-2 ring-orange-300 ring-offset-1 scale-110 font-black animate-pulse'
                                    : 'bg-[#f15a24]/15 hover:bg-[#f15a24]/25 border border-[#f15a24]/35 text-[#f15a24] dark:text-[#ff7a45]'
                                }`}
                                title={`Chord #${gIdx + 1}: ${transposed} (Click to jump practice player here)`}
                              >
                                {transposed}
                              </button>
                            );
                          })}
                        </div>
                      );
                    }

                    let lastPos = 0;
                    return (
                      <div key={lIdx} className="flex flex-col py-1 overflow-x-auto">
                        {/* Chords Line visually aligned over syllable columns in Zostel Orange */}
                        {line.chords.length > 0 && (
                          <div className="font-mono text-xs sm:text-sm font-extrabold text-[#f15a24] dark:text-[#ff7a45] select-none flex items-center whitespace-pre leading-tight py-0.5">
                            {line.chords.map((c, cIdx) => {
                              const transposed = transposeChord(c.chord, transposeOffset);
                              const targetPos = Math.max(lastPos, c.position || 0);
                              const spacesBefore = targetPos - lastPos;
                              lastPos = targetPos + transposed.length;
                              const gIdx = chordIndexMap.get(`${sIdx}-${lIdx}-${cIdx}`) ?? 0;
                              const isPlayingThisChord = isPracticing && currentChordIndex === gIdx;
                              return (
                                <span key={cIdx} className="inline-flex items-center">
                                  {spacesBefore > 0 && <span>{' '.repeat(spacesBefore)}</span>}
                                  <button
                                    id={`chord-token-${gIdx}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCurrentChordIndex(gIdx);
                                      setCurrentBeatInBar(0);
                                      handleInspectChord(transposed);
                                    }}
                                    className={`font-mono text-xs sm:text-sm font-black cursor-pointer transition-all select-none tracking-tight rounded-md px-1.5 py-0.5 ${
                                      isPlayingThisChord
                                        ? 'bg-[#f15a24] text-white shadow-lg ring-2 ring-orange-300 ring-offset-1 scale-110 font-extrabold animate-pulse'
                                        : 'text-[#f15a24] dark:text-[#ff7a45] hover:text-[#d94816] dark:hover:text-[#ffa07a] hover:bg-[#f15a24]/10'
                                    }`}
                                    title={`Chord #${gIdx + 1}: ${transposed} (Click to jump practice player here)`}
                                  >
                                    {transposed}
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Lyrics Line with crystal-clear high contrast */}
                        {line.lyrics && (
                          <div className="song-lyrics-line font-mono text-sm sm:text-base font-semibold dark:font-medium text-slate-950 dark:text-slate-100 whitespace-pre-wrap leading-relaxed tracking-wide select-text py-0.5">
                            {line.lyrics}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800/80">
            ✨ End of sheet • Studio music provided by AGSoft Acoustics
          </div>
        </div>

        {/* Dedicated Fixed Bottom Playback Bar with iOS Home-Indicator Safe Area Inset */}
        <div className="song-player-footer fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0A0D15]/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800/90 px-3 sm:px-6 pt-2.5 pb-[max(10px,env(safe-area-inset-bottom,0px))] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.7)] flex flex-col gap-2">
          {/* Smart Capo & Transposition Calculator Advice */}
          {smartCapo && (
            <div className="max-w-3xl mx-auto w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-600 dark:text-amber-300">
              <span className="flex items-center gap-1.5 font-semibold truncate">
                <span>💡</span>
                <span className="truncate">{smartCapo.recommendation}</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                Open Shape: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{smartCapo.openShapeKey}</strong>
              </span>
            </div>
          )}

          {/* Interactive Song Practice Accompaniment Drawer */}
          {isPracticeBarOpen && (
            <div className="max-w-3xl mx-auto w-full p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-800 space-y-2.5 animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPracticing(!isPracticing)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm ${
                      isPracticing
                        ? 'bg-rose-500 text-white shadow-rose-500/30'
                        : 'bg-[#f15a24] text-white shadow-[#f15a24]/30 font-extrabold hover:bg-[#d94816]'
                    }`}
                  >
                    {isPracticing ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                    <span>{isPracticing ? 'STOP PRACTICE' : 'START PRACTICE'}</span>
                  </button>

                  {/* Beat pulse visual dots */}
                  <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    {Array.from({ length: beatsPerChord }).map((_, bIdx) => (
                      <span
                        key={bIdx}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-100 ${
                          currentBeatInBar === bIdx && isPracticing
                            ? bIdx === 0
                              ? 'bg-[#f15a24] scale-125 shadow-[0_0_8px_#f15a24]'
                              : 'bg-amber-400 scale-110 shadow-[0_0_6px_#fbbf24]'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] font-mono text-slate-500 ml-1 font-semibold">
                      Beat {isPracticing ? currentBeatInBar + 1 : 1}/{beatsPerChord}
                    </span>
                  </div>
                </div>

                {/* Tempo Steppers, Tap & Auto-detect Badge */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {detectedTempoInfo && (
                    <div className="flex items-center gap-1 mr-1">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        detectedTempoInfo.isAutoDetected
                          ? 'bg-[#f15a24]/15 text-[#f15a24] dark:text-[#ff7a45] border border-[#f15a24]/30'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <Sparkles className="w-2.5 h-2.5 text-[#f15a24]" />
                        <span>{detectedTempoInfo.label}</span>
                      </span>
                      {practiceBpm !== detectedTempoInfo.bpm && (
                        <button
                          onClick={() => setPracticeBpm(detectedTempoInfo.bpm)}
                          className="text-[10px] font-mono text-[#f15a24] hover:underline cursor-pointer"
                          title="Reset to detected original tempo"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-1.5 py-1">
                    <button
                      onClick={() => setPracticeBpm((prev) => Math.max(40, prev - 2))}
                      className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-white px-2 min-w-[54px] text-center">
                      {practiceBpm} <span className="text-[9px] text-slate-400 font-normal">BPM</span>
                    </span>
                    <button
                      onClick={() => setPracticeBpm((prev) => Math.min(240, prev + 2))}
                      className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleTapTempo}
                    className="px-2 py-1 rounded-xl bg-white dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 active:scale-95 cursor-pointer shadow-xs"
                    title="Tap along to the song rhythm to detect BPM"
                  >
                    TAP
                  </button>
                </div>
              </div>

              {/* Bar Frequency, Sound Mode & Jump Controls */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                {/* Sound Mode Toggle */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-slate-500 font-bold hidden sm:inline">SOUND:</span>
                  <div className="flex items-center p-0.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                    <button
                      onClick={() => setPracticeSoundMode('both')}
                      className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        practiceSoundMode === 'both' ? 'bg-[#f15a24] text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Chords+Click
                    </button>
                    <button
                      onClick={() => setPracticeSoundMode('chords')}
                      className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        practiceSoundMode === 'chords' ? 'bg-[#f15a24] text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Chords
                    </button>
                    <button
                      onClick={() => setPracticeSoundMode('click')}
                      className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        practiceSoundMode === 'click' ? 'bg-[#f15a24] text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Click
                    </button>
                    <button
                      onClick={() => setPracticeSoundMode('silent')}
                      className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        practiceSoundMode === 'silent' ? 'bg-[#f15a24] text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Silent
                    </button>
                  </div>
                </div>

                {/* Beats per Chord Toggle: 4 beats (1 bar) or 2 beats (half bar) */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-slate-500 font-bold hidden sm:inline">BAR:</span>
                  <div className="flex items-center p-0.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                    <button
                      onClick={() => setBeatsPerChord(4)}
                      className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        beatsPerChord === 4 ? 'bg-[#f15a24] text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      4 Beats (1 Bar)
                    </button>
                    <button
                      onClick={() => setBeatsPerChord(2)}
                      className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        beatsPerChord === 2 ? 'bg-[#f15a24] text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      2 Beats (½ Bar)
                    </button>
                  </div>
                </div>

                {/* Prev / Next Chord Steppers */}
                {flatChords.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={jumpPreviousChord}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold cursor-pointer"
                      title="Previous Chord"
                    >
                      ◀ Prev
                    </button>
                    <span className="text-[10px] font-mono text-[#f15a24] dark:text-[#ff7a45] font-extrabold px-1">
                      #{currentChordIndex + 1}/{flatChords.length} ({transposeChord(flatChords[currentChordIndex]?.chord || '', transposeOffset)})
                    </span>
                    <button
                      onClick={jumpNextChord}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold cursor-pointer"
                      title="Next Chord"
                    >
                      Next ▶
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Playback Bar */}
          <div className="max-w-3xl mx-auto w-full flex items-center justify-between gap-1.5 sm:gap-3 flex-wrap sm:flex-nowrap">
            {/* Auto Scroll Button */}
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-lg shrink-0 ${
                isAutoScrolling
                  ? 'bg-rose-500 text-white shadow-rose-500/30'
                  : 'bg-[#f15a24] text-white shadow-[#f15a24]/30 font-extrabold hover:bg-[#d94816]'
              }`}
              title="Toggle Auto-Scroll (Desktop Shortcut: Spacebar)"
            >
              {isAutoScrolling ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>PAUSE</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-white/20 rounded text-white ml-0.5">Space</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>AUTO SCROLL</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-white/20 rounded text-white font-extrabold ml-0.5">Space</span>
                </>
              )}
            </button>

            {/* Granular Auto-Scroll Speed Steppers (down to 0.05x!) */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl px-1.5 sm:px-2 py-1 shrink-0">
              <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase hidden sm:inline font-bold">SPEED:</span>
              <button
                onClick={decreaseSpeed}
                className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center transition active:scale-95 cursor-pointer text-sm border border-slate-300 dark:border-transparent shadow-xs"
                title="Slower scroll (Down to 0.05x) (Shortcut: - or [ or ↓)"
              >
                -
              </button>
              <span className="font-mono font-extrabold text-[#f15a24] dark:text-[#ff7a45] text-xs sm:text-sm min-w-[42px] text-center">
                {scrollSpeed < 0.2 ? scrollSpeed.toFixed(2) : scrollSpeed.toFixed(1)}x
              </span>
              <button
                onClick={increaseSpeed}
                className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center transition active:scale-95 cursor-pointer text-sm border border-slate-300 dark:border-transparent shadow-xs"
                title="Faster scroll (Shortcut: + or = or ↑)"
              >
                +
              </button>
            </div>

            {/* Key Transpose Steppers */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl px-1.5 sm:px-2 py-1 shrink-0">
              <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase hidden sm:inline font-bold">KEY:</span>
              <button
                onClick={() => setTransposeOffset((prev) => prev - 1)}
                className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center transition active:scale-95 cursor-pointer text-sm border border-slate-300 dark:border-transparent shadow-xs"
                title="Transpose down (Shortcut: ←)"
              >
                -
              </button>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs min-w-[34px] text-center">
                {transposeOffset === 0 ? 'ORIG' : `${transposeOffset > 0 ? '+' : ''}${transposeOffset}`}
              </span>
              <button
                onClick={() => setTransposeOffset((prev) => prev + 1)}
                className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center transition active:scale-95 cursor-pointer text-sm border border-slate-300 dark:border-transparent shadow-xs"
                title="Transpose up (Shortcut: →)"
              >
                +
              </button>
            </div>

            {/* Practice Accompaniment Toggle Button */}
            <button
              onClick={() => setIsPracticeBarOpen(!isPracticeBarOpen)}
              className={`px-3 py-2 rounded-2xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm border shrink-0 ${
                isPracticing
                  ? 'bg-[#f15a24] text-white border-orange-400 font-extrabold ring-2 ring-orange-300/50 animate-pulse'
                  : isPracticeBarOpen
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                  : 'bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Practice Accompaniment & Tempo Engine"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{practiceBpm} BPM</span>
              {isPracticing && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
            </button>
          </div>
        </div>

        {/* Interactive Mini Chord Diagram Popover */}
        {inspectChord && (() => {
          const activeVoicing = inspectChord.voicings[inspectChord.activeIndex] || inspectChord.voicings[0];
          const baseFret = activeVoicing.baseFret || 1;
          const gridFrets = [baseFret, baseFret + 1, baseFret + 2, baseFret + 3, baseFret + 4];

          return (
            <div 
              onClick={() => setInspectChord(null)}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-[310px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center select-none"
              >
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-2">
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {inspectChord.chordName}
                    </h4>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      {activeVoicing.positionName}
                    </span>
                  </div>
                  <button
                    onClick={() => setInspectChord(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Close & return to song"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Multiple Position Selector Pills */}
                {inspectChord.voicings.length > 1 && (
                  <div className="flex items-center gap-1.5 w-full mb-3 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
                    {inspectChord.voicings.map((v, idx) => {
                      const isActive = idx === inspectChord.activeIndex;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setInspectChord({ ...inspectChord, activeIndex: idx });
                            strumChordVoicing(v.frets, v.baseFret);
                          }}
                          className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold transition cursor-pointer truncate ${
                            isActive
                              ? 'bg-emerald-500 text-black shadow-xs font-extrabold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {v.positionName}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fretboard Mini Diagram */}
                <div className="w-full flex flex-col items-center py-2.5 px-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 mb-3 relative">
                  {/* Fret indicator badge when higher up the neck */}
                  {baseFret > 1 && (
                    <div className="absolute top-2 left-3 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px]">
                      fr. {baseFret}
                    </div>
                  )}

                  {/* String labels & Open/Mute symbols */}
                  <div className="flex justify-between w-48 mb-1 px-1 font-mono text-[11px] font-bold">
                    {activeVoicing.frets.map((f, i) => (
                      <span
                        key={i}
                        className={f === 'x' ? 'text-rose-500' : f === 0 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-300 dark:text-slate-700'}
                      >
                        {f === 'x' ? '✕' : f === 0 ? '○' : '•'}
                      </span>
                    ))}
                  </div>

                  {/* 5 Frets Grid */}
                  <div className={`relative w-48 ${baseFret === 1 ? 'border-t-4 border-slate-800 dark:border-slate-300' : 'border-t-2 border-slate-400 dark:border-slate-600'}`}>
                    {gridFrets.map((fret) => (
                      <div
                        key={fret}
                        className="h-7 border-b border-slate-300 dark:border-slate-700 flex justify-between relative"
                      >
                        {/* Vertical string lines */}
                        {[0, 1, 2, 3, 4, 5].map((stringIdx) => (
                          <div
                            key={stringIdx}
                            className="w-px h-full bg-slate-300 dark:bg-slate-700 relative"
                          >
                            {/* Dot if chord fretted on this string & fret */}
                            {activeVoicing.frets[stringIdx] === fret && (
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 text-black font-extrabold text-[9px] flex items-center justify-center shadow-md">
                                {activeVoicing.fingers[stringIdx] ?? ''}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* String Tuning Names */}
                  <div className="flex justify-between w-48 mt-1.5 px-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                    <span>E</span><span>A</span><span>D</span><span>G</span><span>B</span><span>e</span>
                  </div>
                </div>

                {/* Finger Legend */}
                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-3 text-center">
                  1=Index • 2=Middle • 3=Ring • 4=Pinky
                </div>

                {/* Strum & Return Controls */}
                <div className="w-full flex items-center gap-2">
                  <button
                    onClick={() => strumChordVoicing(activeVoicing.frets, activeVoicing.baseFret)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-emerald-400 active:scale-95 transition cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>STRUM CHORD</span>
                  </button>
                  <button
                    onClick={() => setInspectChord(null)}
                    className="py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  const content = (
    <div className={`relative w-full ${isEmbedded ? 'max-w-4xl h-full' : 'max-w-4xl h-[92vh]'} bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden`}>
      {/* Loading Overlay */}
      {isLoadingSong && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-9 h-9 animate-spin text-[#f15a24]" />
          <span className="text-sm font-bold text-white tracking-wide">Loading chord sheet & tablature...</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 shrink-0">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>AGSoft Acoustics</span>
            <span className="text-xs text-slate-500 font-semibold">• Songs & Repertoire</span>
          </h2>
        </div>

        {!isEmbedded && onClose && (
          <button
            onClick={() => {
              setIsAutoScrolling(false);
              onClose();
            }}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mb-4 p-1 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <button
              onClick={() => setSectionTab('search')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                sectionTab === 'search'
                  ? 'bg-[#f15a24] text-white shadow-md font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>

            <button
              onClick={() => setSectionTab('favorites')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                sectionTab === 'favorites'
                  ? 'bg-rose-500 text-white shadow-md font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${favorites.length > 0 ? 'fill-current' : ''}`} />
              <span>Favorites ({favorites.length})</span>
            </button>

            <button
              onClick={() => setSectionTab('repertoire')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                sectionTab === 'repertoire'
                  ? 'bg-cyan-500 text-black shadow-md font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Discover ({REPERTOIRE_PIECES.length})</span>
            </button>
          </div>

          {/* TAB 1: SEARCH & HISTORY */}
          {sectionTab === 'search' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search Bar with Android keyboard auto-dismiss on enter */}
              <form
                action="#"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                }}
                className="relative mb-3"
              >
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="search"
                  enterKeyHint="search"
                  inputMode="search"
                  placeholder="Type any song or artist (e.g. Black, Dust in the Wind, Ed Sheeran)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl pl-11 pr-11 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-[#f15a24] shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white absolute right-10 top-1/2 -translate-y-1/2 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isLoadingResults && (
                  <Loader2 className="w-4 h-4 animate-spin text-[#f15a24] absolute right-4 top-1/2 -translate-y-1/2" />
                )}
              </form>

              {/* Body: Either Search Results OR Search History + Recent Songs */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {searchQuery.trim() ? (
                  /* Active Search Results */
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-2 px-1">
                      <span>SEARCH RESULTS FOR "{searchQuery}"</span>
                      <span>{searchResults.length} FOUND</span>
                    </div>

                    {isLoadingResults && searchResults.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-xs gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#f15a24]" />
                        <span>Searching Acoustic Studio Cloud...</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-xs">
                        <span>No songs found for "{searchQuery}". Try different keywords or check spelling.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.map((song) => (
                          <div
                            key={song.id}
                            className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700 transition"
                          >
                            <div
                              onClick={() => handleSelectSong(song)}
                              className="flex items-center gap-3.5 flex-1 cursor-pointer min-w-0"
                            >
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f15a24] to-amber-500 p-0.5 flex items-center justify-center font-bold text-white shadow-md shrink-0">
                                <Guitar className="w-5 h-5 text-white" />
                              </div>
                              <div className="truncate">
                                <h3 className="font-bold text-sm text-white group-hover:text-[#f15a24] transition truncate flex items-center gap-2">
                                  <span>{song.title}</span>
                                  {song.difficulty && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                                      {song.difficulty}
                                    </span>
                                  )}
                                </h3>
                                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                                  <span>{song.artist}</span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-xs text-[#f15a24] font-medium">{song.source}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-3 shrink-0">
                              <button
                                onClick={() => toggleFavorite(song)}
                                className={`p-2 rounded-xl border transition cursor-pointer ${
                                  isFavorite(song.id)
                                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-rose-400'
                                }`}
                                title={isFavorite(song.id) ? 'Unlike' : 'Save to Favorites'}
                              >
                                <Heart className={`w-4 h-4 ${isFavorite(song.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                              </button>

                              <button
                                onClick={() => handleSelectSong(song)}
                                className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-[#f15a24]/15 text-[#f15a24] dark:text-[#ff7a45] border border-[#f15a24]/30 font-semibold group-hover:bg-[#f15a24]/25 transition cursor-pointer"
                              >
                                PLAY
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Empty Search: Show Recent Searches & Recently Played */
                  <div className="space-y-6">
                    {/* Recent Search Queries */}
                    {searchHistory.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-2.5 px-1">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> RECENT SEARCHES
                          </span>
                          <button
                            onClick={() => setSearchHistory([])}
                            className="text-slate-500 hover:text-rose-400 transition flex items-center gap-1 text-[10px] font-mono cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Clear
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {searchHistory.map((query, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSearchQuery(query)}
                              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-[#f15a24]/40 text-xs text-slate-300 hover:text-[#f15a24] transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Search className="w-3 h-3 text-slate-500" />
                              <span>{query}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recently Played Songs */}
                    {recentSongs.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-2.5 px-1">
                          <span className="flex items-center gap-1.5">
                            <Music className="w-3.5 h-3.5 text-slate-400" /> RECENTLY PLAYED
                          </span>
                          <button
                            onClick={() => setRecentSongs([])}
                            className="text-slate-500 hover:text-rose-400 transition flex items-center gap-1 text-[10px] font-mono cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Clear
                          </button>
                        </div>
                        <div className="space-y-2">
                          {recentSongs.map((song) => (
                            <div
                              key={song.id}
                              className="group flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition"
                            >
                              <div
                                onClick={() => handleSelectSong(song)}
                                className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                              >
                                <div className="w-8 h-8 rounded-lg bg-[#f15a24]/10 border border-[#f15a24]/20 flex items-center justify-center text-[#f15a24] shrink-0">
                                  <Guitar className="w-4 h-4" />
                                </div>
                                <div className="truncate">
                                  <h4 className="text-xs font-bold text-white group-hover:text-[#f15a24] transition truncate">
                                    {song.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 ml-2 shrink-0">
                                <button
                                  onClick={() => toggleFavorite(song)}
                                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                    isFavorite(song.id)
                                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                                      : 'bg-slate-800 text-slate-500 hover:text-rose-400 border-slate-700'
                                  }`}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${isFavorite(song.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                                </button>
                                <button
                                  onClick={() => handleSelectSong(song)}
                                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#f15a24]/15 text-[#f15a24] dark:text-[#ff7a45] border border-[#f15a24]/30 cursor-pointer hover:bg-[#f15a24]/25 transition"
                                >
                                  PLAY
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchHistory.length === 0 && recentSongs.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3">
                          <Search className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">Search Any Song or Artist</h4>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Type any song title above to pull real-time chords from our acoustic cloud archive, or browse the <strong>Repertoire</strong> tab for classical and delta blues pieces.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FAVORITES & LIKED SONGS */}
          {sectionTab === 'favorites' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-3 px-1">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> YOUR SAVED REPERTOIRE
                </span>
                <span>{favorites.length} SONGS</span>
              </div>

              {favorites.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-500">
                  <div className="w-14 h-14 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
                    <Heart className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">No Favorite Songs Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    Tap the ❤️ heart icon on any song or classical piece to save it here for instant access whenever you practice.
                  </p>
                  <button
                    onClick={() => setSectionTab('repertoire')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Browse Repertoire Masterpieces
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {favorites.map((song) => (
                    <div
                      key={song.id}
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700 transition"
                    >
                      <div
                        onClick={() => handleSelectSong(song)}
                        className="flex items-center gap-3.5 flex-1 cursor-pointer min-w-0"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 p-0.5 flex items-center justify-center font-bold text-white shadow-md shrink-0">
                          <Music className="w-5 h-5 text-white" />
                        </div>
                        <div className="truncate">
                          <h3 className="font-bold text-sm text-white group-hover:text-rose-400 transition truncate flex items-center gap-2">
                            <span>{song.title}</span>
                            {song.difficulty && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 shrink-0">
                                {song.difficulty}
                              </span>
                            )}
                          </h3>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                            <span>{song.artist}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-xs text-rose-400 font-medium">{song.source}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-[10px] text-emerald-400 font-mono">⚡ Offline Ready</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <button
                          onClick={() => toggleFavorite(song)}
                          className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 transition cursor-pointer"
                          title="Remove from favorites"
                        >
                          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                        </button>

                        <button
                          onClick={() => handleSelectSong(song)}
                          className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold group-hover:bg-rose-500/25 transition cursor-pointer"
                        >
                          PLAY
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DISCOVER & REPERTOIRE MASTERPIECES */}
          {sectionTab === 'repertoire' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Discover Search Input with instant clear */}
              <div className="relative mb-2.5">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search pieces, artists, or styles (e.g. Tears in Heaven, Asturias, Kansas)..."
                  value={discoverSearchQuery}
                  onChange={(e) => setDiscoverSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
                />
                {discoverSearchQuery && (
                  <button
                    onClick={() => setDiscoverSearchQuery('')}
                    className="p-1 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white absolute right-3 top-1/2 -translate-y-1/2 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Inspiration Tags Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none text-[11px]">
                <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0 uppercase mr-0.5">Explore:</span>
                {[
                  { label: '🔥 All', query: '', filter: 'all' as RepertoireFilter },
                  { label: '🎸 Fingerstyle', query: '', filter: 'fingerstyle' as RepertoireFilter },
                  { label: '🏛️ Classical', query: '', filter: 'classical' as RepertoireFilter },
                  { label: '🎶 Delta Blues', query: '', filter: 'blues' as RepertoireFilter },
                  { label: '✨ Travis Picking', query: 'Travis', filter: 'all' as RepertoireFilter },
                  { label: '🇪🇸 Spanish', query: 'Spanish', filter: 'all' as RepertoireFilter },
                  { label: '🌿 Acoustic Ballads', query: 'Acoustic', filter: 'all' as RepertoireFilter },
                ].map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setRepertoireFilter(tag.filter);
                      setDiscoverSearchQuery(tag.query);
                    }}
                    className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer border ${
                      repertoireFilter === tag.filter && discoverSearchQuery === tag.query
                        ? 'bg-cyan-500 text-black border-cyan-400 font-extrabold shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {/* Pieces Grid & Online Discovery Bridge */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredRepertoire.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                    <Sparkles className="w-10 h-10 text-cyan-400 mb-2 opacity-60" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      No local pieces found matching "{discoverSearchQuery}"
                    </p>
                    <p className="text-xs text-slate-500 max-w-xs mb-4">
                      Search online across millions of verified international tabs & acoustic chords.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery(discoverSearchQuery);
                        setSectionTab('search');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-cyan-400 active:scale-95 transition cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      <span>Search Online for "{discoverSearchQuery}"</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {filteredRepertoire.map((piece) => (
                      <div
                        key={piece.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/50 shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div
                          onClick={() => handleSelectRepertoire(piece)}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase ${
                              piece.category === 'classical'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                : piece.category === 'fingerstyle'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                                : 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30'
                            }`}>
                              {piece.category}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {piece.tempo}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                              {piece.difficulty}
                            </span>
                            {piece.tabContent && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> 6-STR TAB
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition flex items-center gap-2">
                            <span>{piece.title}</span>
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Artist / Composer: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{piece.artist}</strong> • Key: <strong className="text-emerald-600 dark:text-emerald-400">{piece.key}</strong>
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 italic">
                            {piece.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => toggleFavorite(piece)}
                            className={`p-2 rounded-xl border transition cursor-pointer ${
                              isFavorite(piece.id)
                                ? 'bg-rose-500/20 border-rose-500/40 text-rose-500 shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-400 hover:text-rose-500'
                            }`}
                            title={isFavorite(piece.id) ? 'Saved to Favorites' : 'Save to Favorites'}
                          >
                            <Heart className={`w-4 h-4 ${isFavorite(piece.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                          </button>

                          <button
                            onClick={() => handleSelectRepertoire(piece)}
                            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs font-mono tracking-wider transition cursor-pointer shadow-md"
                          >
                            PLAY STUDY
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Online Library Discovery Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 text-center my-3">
                      <p className="font-bold text-xs text-slate-900 dark:text-white mb-1">
                        Looking for any other song in the world?
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                        Search across international tabs, chord sheets, and save any discovered song directly to your Favorites!
                      </p>
                      <button
                        onClick={() => setSectionTab('search')}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-extrabold text-xs shadow-md hover:bg-emerald-400 active:scale-95 transition cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Search Millions of Songs Online</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
  );
  if (isEmbedded) {
    return <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      {content}
    </div>
  );
};
