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
import { SongData, transposeChord } from '../data/popularSongs';
import { searchOnlineSongs, fetchCompleteSong, SearchSongItem } from '../services/chordService';
import { REPERTOIRE_PIECES, RepertoirePiece } from '../data/repertoire';
import { playGuitarStringTone } from '../audio/toneGenerator';

interface SongSearchModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenChordInfo?: (chordName: string) => void;
  isEmbedded?: boolean;
}

type SongSectionTab = 'search' | 'favorites' | 'repertoire';
type RepertoireFilter = 'all' | 'classical' | 'fingerstyle' | 'blues';

export const SongSearchModal: React.FC<SongSearchModalProps> = ({
  isOpen = true,
  onClose,
  onOpenChordInfo,
  isEmbedded = false,
}) => {
  // Navigation Tabs
  const [sectionTab, setSectionTab] = useState<SongSectionTab>('search');
  const [repertoireFilter, setRepertoireFilter] = useState<RepertoireFilter>('all');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchSongItem[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');

  // Song View State
  const [selectedSong, setSelectedSong] = useState<SongData | null>(null);
  const [isLoadingSong, setIsLoadingSong] = useState<boolean>(false);
  const [transposeOffset, setTransposeOffset] = useState<number>(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1);

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
  const scrollIntervalRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

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

  // Search Debounce
  useEffect(() => {
    if (!isOpen) return;

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsLoadingResults(false);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = window.setTimeout(async () => {
      setIsLoadingResults(true);
      try {
        const results = await searchOnlineSongs(searchQuery);
        setSearchResults(results);

        // Save to search history if non-trivial
        if (searchQuery.trim().length >= 3) {
          setSearchHistory((prev) => {
            const trimmed = searchQuery.trim();
            const filtered = prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
            return [trimmed, ...filtered].slice(0, 10);
          });
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoadingResults(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery, isOpen]);

  // Auto-scroll loop
  useEffect(() => {
    if (isAutoScrolling) {
      scrollIntervalRef.current = window.setInterval(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop += scrollSpeed;
        }
      }, 50);
    } else {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [isAutoScrolling, scrollSpeed]);

  if (!isOpen) return null;

  // Toggle Favorite
  const isFavorite = (songId: string): boolean => {
    return favorites.some((f) => f.id === songId);
  };

  const toggleFavorite = (item: SearchSongItem | SongData) => {
    const songItem: SearchSongItem = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      url: (item as any).url || item.id,
      source: (item as any).source || 'Favorite',
      difficulty: item.difficulty,
      hasChords: true,
    };

    setFavorites((prev) => {
      if (prev.some((f) => f.id === songItem.id)) {
        return prev.filter((f) => f.id !== songItem.id);
      } else {
        return [songItem, ...prev];
      }
    });
  };

  // Open Song
  const handleSelectSong = async (item: SearchSongItem) => {
    setIsLoadingSong(true);
    try {
      const fullSong = await fetchCompleteSong(item);
      setSelectedSong(fullSong);
      setTransposeOffset(0);

      // Add to recent songs
      setRecentSongs((prev) => {
        const filtered = prev.filter((s) => s.id !== item.id);
        return [item, ...filtered].slice(0, 10);
      });
    } catch (err) {
      console.error('Error opening song:', err);
    } finally {
      setIsLoadingSong(false);
    }
  };

  const handleSelectRepertoire = (piece: RepertoirePiece) => {
    const fullSong: SongData = {
      id: piece.id,
      title: piece.title,
      artist: piece.artist,
      key: piece.key,
      capo: piece.capo,
      tuning: piece.tuning,
      difficulty: piece.difficulty,
      allChords: piece.allChords,
      sections: piece.sections,
    };
    setSelectedSong(fullSong);
    setTransposeOffset(0);

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

  const handleDirectUrlFetch = async () => {
    if (!urlInput.trim()) return;
    setIsLoadingSong(true);
    try {
      const fakeItem: SearchSongItem = {
        id: urlInput,
        title: 'Custom Imported Song',
        artist: 'GuitarTuna',
        url: urlInput,
        source: 'GuitarTuna',
      };
      const fullSong = await fetchCompleteSong(fakeItem);
      setSelectedSong(fullSong);
      setTransposeOffset(0);
      setUrlInput('');
    } catch (err) {
      console.error('Error loading custom URL:', err);
    } finally {
      setIsLoadingSong(false);
    }
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
    if (onOpenChordInfo) onOpenChordInfo(chordName);
  };

  // Filtered Repertoire
  const filteredRepertoire = useMemo(() => {
    if (repertoireFilter === 'all') return REPERTOIRE_PIECES;
    return REPERTOIRE_PIECES.filter((p) => p.category === repertoireFilter);
  }, [repertoireFilter]);

  const content = (
    <div className={`relative w-full ${isEmbedded ? 'max-w-4xl h-full' : 'max-w-4xl h-[92vh]'} bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden`}>
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-3">
          {selectedSong && (
            <button
              onClick={() => {
                setSelectedSong(null);
                setIsAutoScrolling(false);
                setTransposeOffset(0);
              }}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Back to Song Lists"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{selectedSong ? selectedSong.title : 'AGSOFT ACOUSTICS • SONGS & REPERTOIRE'}</span>
              {!selectedSong && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> LIVE SCRAPER & MASTERPIECES
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {selectedSong ? `${selectedSong.artist} • ${selectedSong.key}` : 'Live search across GuitarTuna, classical fingerstyle studies, and favorite saved chords'}
            </p>
          </div>
        </div>

        {!isEmbedded && onClose && (
          <button
            onClick={() => {
              setIsAutoScrolling(false);
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main View Area */}
      {!selectedSong ? (
        <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mb-4 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setSectionTab('search')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                sectionTab === 'search'
                  ? 'bg-emerald-500 text-black shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>SEARCH & HISTORY</span>
            </button>

            <button
              onClick={() => setSectionTab('favorites')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                sectionTab === 'favorites'
                  ? 'bg-rose-500 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${favorites.length > 0 ? 'fill-current' : ''}`} />
              <span>LIKED & FAVORITES ({favorites.length})</span>
            </button>

            <button
              onClick={() => setSectionTab('repertoire')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                sectionTab === 'repertoire'
                  ? 'bg-cyan-500 text-black shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>REPERTOIRE ({REPERTOIRE_PIECES.length})</span>
            </button>
          </div>

          {/* TAB 1: SEARCH & HISTORY */}
          {sectionTab === 'search' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Type any song or artist (e.g. Kal Ho Naa Ho, Cuban Dance, Ed Sheeran, Nirvana)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full text-slate-500 hover:text-white absolute right-10 top-1/2 -translate-y-1/2 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isLoadingResults && (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400 absolute right-4 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {/* Direct GuitarTuna URL Input */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs">
                <span className="text-slate-500 shrink-0 font-mono text-[11px] pl-1">GuitarTuna URL:</span>
                <input
                  type="text"
                  placeholder="https://guitartuna.com/chords/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-slate-600 focus:outline-none text-xs"
                />
                <button
                  onClick={handleDirectUrlFetch}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-black text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Fetch
                </button>
              </div>

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
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                        <span>Connecting to GuitarTuna database...</span>
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
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 flex items-center justify-center font-bold text-white shadow-md shrink-0">
                                <Guitar className="w-5 h-5 text-black" />
                              </div>
                              <div className="truncate">
                                <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition truncate flex items-center gap-2">
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
                                  <span className="text-xs text-emerald-400 font-medium">{song.source}</span>
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
                                className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold group-hover:bg-emerald-500/25 transition cursor-pointer"
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
                              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-emerald-300 transition flex items-center gap-1.5 cursor-pointer"
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
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                  <Guitar className="w-4 h-4" />
                                </div>
                                <div className="truncate">
                                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition truncate">
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
                                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/25 transition"
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
                          Type any song title above to pull real-time chords from GuitarTuna, or browse the <strong>Repertoire</strong> tab for classical and delta blues pieces.
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

          {/* TAB 3: CLASSICAL, FINGERSTYLE & DELTA BLUES REPERTOIRE */}
          {sectionTab === 'repertoire' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Category Filter Chips */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <button
                  onClick={() => setRepertoireFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                    repertoireFilter === 'all'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ALL PIECES ({REPERTOIRE_PIECES.length})
                </button>
                <button
                  onClick={() => setRepertoireFilter('classical')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                    repertoireFilter === 'classical'
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  CLASSICAL GUITAR
                </button>
                <button
                  onClick={() => setRepertoireFilter('fingerstyle')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                    repertoireFilter === 'fingerstyle'
                      ? 'bg-emerald-400 text-black shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  FINGERSTYLE
                </button>
                <button
                  onClick={() => setRepertoireFilter('blues')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                    repertoireFilter === 'blues'
                      ? 'bg-purple-400 text-black shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  DELTA BLUES & RAGTIME
                </button>
              </div>

              {/* Pieces Grid */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredRepertoire.map((piece) => (
                  <div
                    key={piece.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div
                      onClick={() => handleSelectRepertoire(piece)}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase ${
                          piece.category === 'classical'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : piece.category === 'fingerstyle'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                        }`}>
                          {piece.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {piece.tempo}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                          {piece.difficulty}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition flex items-center gap-2">
                        <span>{piece.title}</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-sans">
                        Composer / Artist: <strong className="text-slate-300">{piece.artist}</strong> • Key: <strong className="text-emerald-400">{piece.key}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic">
                        {piece.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => toggleFavorite(piece)}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          isFavorite(piece.id)
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-rose-400'
                        }`}
                        title={isFavorite(piece.id) ? 'Unlike' : 'Save to Favorites'}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite(piece.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleSelectRepertoire(piece)}
                        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs font-mono tracking-wider transition cursor-pointer shadow-md"
                      >
                        PLAY STUDY
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* FULL SONG CHORD SHEET VIEW */
        <div className="flex-1 flex flex-col overflow-hidden">
          {isLoadingSong ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-sm font-semibold">Loading chords & sheet music...</span>
            </div>
          ) : (
            <>
              {/* Song Controls Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-800 bg-slate-950/40 text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">
                    TUNING: <strong className="text-slate-200">{selectedSong.tuning}</strong>
                  </span>
                  <span className="text-slate-400">
                    CAPO: <strong className="text-emerald-400">{selectedSong.capo}</strong>
                  </span>
                  <span className="text-slate-400">
                    KEY: <strong className="text-cyan-400">{selectedSong.key}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Like / Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(selectedSong)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      isFavorite(selectedSong.id)
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFavorite(selectedSong.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{isFavorite(selectedSong.id) ? 'SAVED' : 'SAVE'}</span>
                  </button>

                  {/* Transpose Key Controls */}
                  <div className="flex items-center gap-2 bg-slate-800/80 rounded-xl px-2.5 py-1 border border-slate-700">
                    <span className="text-slate-400 font-semibold text-[11px]">TRANSPOSE:</span>
                    <button
                      onClick={() => setTransposeOffset((prev) => prev - 1)}
                      className="w-5 h-5 rounded bg-slate-700 text-white font-bold flex items-center justify-center hover:bg-slate-600 active:scale-95 transition cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-white min-w-[32px] text-center">
                      {transposeOffset === 0 ? 'ORIG' : `${transposeOffset > 0 ? '+' : ''}${transposeOffset}`}
                    </span>
                    <button
                      onClick={() => setTransposeOffset((prev) => prev + 1)}
                      className="w-5 h-5 rounded bg-slate-700 text-white font-bold flex items-center justify-center hover:bg-slate-600 active:scale-95 transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Auto Scroll Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                        isAutoScrolling
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-emerald-500 text-black shadow-md'
                      }`}
                    >
                      {isAutoScrolling ? (
                        <>
                          <Pause className="w-3.5 h-3.5" /> STOP SCROLL
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> AUTO SCROLL
                        </>
                      )}
                    </button>

                    <select
                      value={scrollSpeed}
                      onChange={(e) => setScrollSpeed(Number(e.target.value))}
                      className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-2 py-1 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value={0.5}>0.5x Slow</option>
                      <option value={1}>1.0x Normal</option>
                      <option value={1.5}>1.5x Fast</option>
                      <option value={2}>2.0x Turbo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Clickable Chords Pill Bar */}
              {selectedSong.allChords.length > 0 && (
                <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 border-b border-slate-800/80 overflow-x-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                    CHORDS IN SONG:
                  </span>
                  {selectedSong.allChords.map((chord) => {
                    const transposed = transposeChord(chord, transposeOffset);
                    return (
                      <button
                        key={chord}
                        onClick={() => handlePlayChord(transposed)}
                        className="group px-3 py-1 rounded-xl bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 text-xs font-mono font-bold text-white hover:text-emerald-300 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{transposed}</span>
                        <Volume2 className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Scrollable Song Sections */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-6 py-6 font-mono space-y-6"
              >
                {selectedSong.sections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-3">
                    <div className="text-xs font-bold text-emerald-400 tracking-wider uppercase border-b border-slate-800 pb-1 flex items-center justify-between">
                      <span>[{section.sectionTitle}]</span>
                      <span className="text-[10px] text-slate-500 font-normal">
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
                              className="flex flex-wrap items-center gap-2 py-2 px-3 my-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 w-fit"
                            >
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mr-1">
                                CHORD BAR:
                              </span>
                              {line.chords.map((c, cIdx) => (
                                <span
                                  key={cIdx}
                                  onClick={() =>
                                    handlePlayChord(transposeChord(c.chord, transposeOffset))
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs cursor-pointer transition hover:scale-105"
                                >
                                  {transposeChord(c.chord, transposeOffset)}
                                </span>
                              ))}
                            </div>
                          );
                        }

                        let lastPos = 0;
                        return (
                          <div key={lIdx} className="flex flex-col py-1 overflow-x-auto">
                            {/* Chords Line visually aligned over syllable columns */}
                            {line.chords.length > 0 && (
                              <div className="font-mono text-xs font-bold text-emerald-400 select-none flex items-center whitespace-pre leading-none py-1">
                                {line.chords.map((c, cIdx) => {
                                  const transposed = transposeChord(c.chord, transposeOffset);
                                  const targetPos = Math.max(lastPos, c.position || 0);
                                  const spacesBefore = targetPos - lastPos;
                                  lastPos = targetPos + transposed.length;
                                  return (
                                    <span key={cIdx} className="inline-flex items-center">
                                      {spacesBefore > 0 && <span>{' '.repeat(spacesBefore)}</span>}
                                      <button
                                        onClick={() => handlePlayChord(transposed)}
                                        className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold cursor-pointer transition hover:scale-105 shadow-sm inline-block"
                                      >
                                        {transposed}
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* Lyrics Line in matching monospace font */}
                            {line.lyrics && (
                              <div className="font-mono text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                                {line.lyrics}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="py-8 text-center text-xs text-slate-500 border-t border-slate-800/80">
                  ✨ End of song • Studio chord sheet provided by AGSoft Acoustics
                </div>
              </div>
            </>
          )}
        </div>
      )}
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
