import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { SongData, transposeChord } from '../data/popularSongs';
import { searchOnlineSongs, fetchCompleteSong, SearchSongItem } from '../services/chordService';
import { playGuitarStringTone } from '../audio/toneGenerator';

interface SongSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChordInfo?: (chordName: string) => void;
}

export const SongSearchModal: React.FC<SongSearchModalProps> = ({
  isOpen,
  onClose,
  onOpenChordInfo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchSongItem[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);
  const [selectedSong, setSelectedSong] = useState<SongData | null>(null);
  const [isLoadingSong, setIsLoadingSong] = useState<boolean>(false);
  const [transposeOffset, setTransposeOffset] = useState<number>(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1);
  const [urlInput, setUrlInput] = useState<string>('');

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Initial load & search debounce
  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = window.setTimeout(async () => {
      setIsLoadingResults(true);
      try {
        const results = await searchOnlineSongs(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoadingResults(false);
      }
    }, 280);

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

  const handleSelectSong = async (item: SearchSongItem) => {
    setIsLoadingSong(true);
    try {
      const fullSong = await fetchCompleteSong(item);
      setSelectedSong(fullSong);
      setTransposeOffset(0);
    } catch (err) {
      console.error('Error opening song:', err);
    } finally {
      setIsLoadingSong(false);
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            {selectedSong && (
              <button
                onClick={() => {
                  setSelectedSong(null);
                  setIsAutoScrolling(false);
                  setTransposeOffset(0);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{selectedSong ? selectedSong.title : 'LIVE SONG CHORDS & TABS'}</span>
                {!selectedSong && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> ON-DEMAND SCRAPER
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedSong ? `${selectedSong.artist} • ${selectedSong.key}` : 'Live search across GuitarTuna & Songsterr for any song in the world'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsAutoScrolling(false);
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SONG SEARCH LIST VIEW */}
        {!selectedSong ? (
          <div className="flex-1 flex flex-col p-5 overflow-hidden">
            {/* Live Search Input */}
            <div className="relative mb-3">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Type ANY song or artist (e.g. Ed Sheeran, Queen, Nirvana, Coldplay, Oasis)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
              />
              {isLoadingResults && (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400 absolute right-4 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Direct GuitarTuna URL Input */}
            <div className="flex items-center gap-2 mb-4 p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs">
              <span className="text-slate-500 shrink-0 font-mono text-[11px] pl-1">Or Paste URL:</span>
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

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-1 px-1">
                <span>{searchQuery ? `SEARCH RESULTS FOR "${searchQuery}"` : 'TRENDING GUITARTUNA CHORDS'}</span>
                <span>{searchResults.length} AVAILABLE</span>
              </div>

              {isLoadingResults && searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-xs gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  <span>Connecting to GuitarTuna database...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-xs">
                  <span>No songs found. Try a different artist or paste a GuitarTuna URL.</span>
                </div>
              ) : (
                searchResults.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => handleSelectSong(song)}
                    className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 flex items-center justify-center font-bold text-white shadow-md">
                        <Guitar className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition flex items-center gap-2">
                          <span>{song.title}</span>
                          {song.difficulty && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              {song.difficulty}
                            </span>
                          )}
                        </h3>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{song.artist}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-emerald-400 font-medium">{song.source}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold group-hover:bg-emerald-500/25 transition">
                        VIEW CHORDS
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* FULL SONG CHORD SHEET VIEW */
          <div className="flex-1 flex flex-col overflow-hidden">
            {isLoadingSong ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <span className="text-sm font-semibold">Scraping complete chord sheet from GuitarTuna...</span>
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

                {/* Full Complete Scrollable Song Lyrics and Chords */}
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
                    ✨ End of song • Full chord chart provided by GuitarTuna & AuraTuner
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
