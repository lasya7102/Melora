import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, idOf, mediaUrl, type Music } from '@/lib/api';

type PlayerContextValue = {
  current: Music | null; queue: Music[]; playing: boolean; progress: number; duration: number; volume: number;
  shuffle: boolean; repeat: boolean; playSong: (song: Music, list?: Music[]) => void; toggle: () => void;
  seek: (value: number) => void; setVolume: (value: number) => void; next: () => void; previous: () => void;
  toggleShuffle: () => void; toggleRepeat: () => void;
};
const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Music | null>(null);
  const [queue, setQueue] = useState<Music[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(.72);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  useEffect(() => {
    const el = new Audio(); audio.current = el; el.volume = volume;
    const time = () => setProgress(el.currentTime);
    const meta = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    const ended = () => repeat ? void el.play() : next();
    el.addEventListener('timeupdate', time); el.addEventListener('loadedmetadata', meta); el.addEventListener('ended', ended);
    return () => { el.pause(); el.removeEventListener('timeupdate', time); el.removeEventListener('loadedmetadata', meta); el.removeEventListener('ended', ended); };
  }, [repeat, queue, current]);
  useEffect(() => { if (audio.current) audio.current.volume = volume; }, [volume]);
  useEffect(() => { if (audio.current && current) { audio.current.src = mediaUrl(current.uri); audio.current.load(); if (playing) void audio.current.play().catch(() => setPlaying(false)); } }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  const playSong = (song: Music, list?: Music[]) => {
    setQueue(list?.length ? list : [song]); setCurrent(song); setPlaying(true);
    void api(`/music/PlaySong/${idOf(song)}`, { method: 'GET' }).catch(() => undefined);
  };
  const toggle = () => { if (!current) return; if (playing) audio.current?.pause(); else void audio.current?.play(); setPlaying(!playing); };
  const next = () => {
    if (!queue.length) return;
    const index = queue.findIndex((x) => idOf(x) === idOf(current || {}));
    const target = shuffle ? queue[Math.floor(Math.random() * queue.length)] : queue[(index + 1) % queue.length];
    if (target) { setCurrent(target); setPlaying(true); }
  };
  const previous = () => {
    if (!queue.length) return;
    const index = queue.findIndex((x) => idOf(x) === idOf(current || {}));
    const target = queue[(index - 1 + queue.length) % queue.length]; if (target) { setCurrent(target); setPlaying(true); }
  };
  const value = useMemo(() => ({
    current, queue, playing, progress, duration, volume, shuffle, repeat, playSong, toggle,
    seek: (v: number) => { if (audio.current) { audio.current.currentTime = v; setProgress(v); } },
    setVolume: setVolumeState, next, previous, toggleShuffle: () => setShuffle((v) => !v), toggleRepeat: () => setRepeat((v) => !v),
  }), [current, queue, playing, progress, duration, volume, shuffle, repeat]);
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
export const usePlayer = () => {
  const value = useContext(PlayerContext); if (!value) throw new Error('PlayerProvider missing'); return value;
};