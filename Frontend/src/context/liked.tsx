import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, idOf, type Music } from '@/lib/api';

type LikedContextValue = {
  likedSongs: Music[];
  loading: boolean;
  error: boolean;
  isLiked: (id: string) => boolean;
  toggleLike: (song: Music) => Promise<void>;
  refresh: () => void;
};

const LikedContext = createContext<LikedContextValue | null>(null);

// Backend returns { message, liked: Music[] } from GET /music/getLikedSongs,
// which doesn't match the generic { items | musics | songs | results } shapes
// the rest of the app expects, so we unwrap it explicitly here.
const extractLiked = (value: unknown): Music[] => {
  if (Array.isArray(value)) return value as Music[];
  const liked = (value as { liked?: Music[] } | null)?.liked;
  return Array.isArray(liked) ? liked : [];
};

export function LikedProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [likedSongs, setLikedSongs] = useState<Music[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = () => {
    if (!enabled) { setLikedSongs([]); setLoading(false); setError(false); return; }
    setLoading(true);
    setError(false);
    api<unknown>('/music/getLikedSongs')
      .then((res) => setLikedSongs(extractLiked(res)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [enabled]);

  const isLiked = (id: string) => !!id && likedSongs.some((s) => idOf(s) === id);

  const toggleLike = async (song: Music) => {
    const id = idOf(song);
    if (!id) return;
    const currentlyLiked = isLiked(id);

    // Update immediately so the heart responds the instant it's clicked.
    setLikedSongs((prev) => currentlyLiked ? prev.filter((s) => idOf(s) !== id) : [song, ...prev.filter((s) => idOf(s) !== id)]);

    try {
      await api(currentlyLiked ? `/music/unlike/${id}` : `/music/Like/${id}`, { method: currentlyLiked ? 'DELETE' : 'POST' });
    } catch {
      // Revert on failure so the UI stays in sync with the backend.
      setLikedSongs((prev) => currentlyLiked ? [song, ...prev.filter((s) => idOf(s) !== id)] : prev.filter((s) => idOf(s) !== id));
    }
  };

  return <LikedContext.Provider value={{ likedSongs, loading, error, isLiked, toggleLike, refresh: load }}>{children}</LikedContext.Provider>;
}

export const useLiked = () => {
  const value = useContext(LikedContext);
  if (!value) throw new Error('LikedProvider missing');
  return value;
};
