export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export type ArtistRef = string | { id?: string; _id?: string; username?: string; email?: string };
export type Music = {
  id?: string; _id?: string; uri?: string; title: string; artist?: ArtistRef;
  coverImage?: string; playCount?: number; createdAt?: string;
};
export type Album = {
  id?: string; _id?: string; title: string; artist?: ArtistRef; musics?: (string | Music)[];
  coverImage?: string; createdAt?: string;
};
export type Playlist = { id?: string; _id?: string; title: string; user?: ArtistRef; songs?: Music[] };
export type User = { id?: string; _id?: string; username: string; email: string; role?: string };
export type Dashboard = { totalSongs?: number; totalAlbums?: number; totalPlays?: number; totalLikes?: number; topSongs?: Music[]; recentUploads?: Music[] };

const unwrap = <T,>(value: unknown): T => {
  if (value && typeof value === 'object' && 'data' in value) return (value as { data: T }).data;
  return value as T;
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: { ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(init?.headers || {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error((body && (body.message || body.error)) || 'Request could not be completed');
  return unwrap<T>(body);
}
export const idOf = (x: { id?: string; _id?: string }) => x.id || x._id || '';
export const artistName = (artist?: ArtistRef) => typeof artist === 'object' ? artist?.username || artist?.email || 'Unknown artist' : artist || 'Unknown artist';
export const mediaUrl = (uri?: string) => uri ? (uri.startsWith('http') ? uri : `${API_BASE}${uri.startsWith('/') ? '' : '/'}${uri}`) : '';

export async function getMusic(query = '') { return api<Music[]>(`/music${query ? `?${query}` : ''}`); }
export async function getAlbums(query = '') { return api<Album[]>(`/music/albums${query ? `?${query}` : ''}`); }
export async function getRecent() { return api<{ playedAt?: string; song: Music }[]>('/music/recentlyPlayed'); }
export async function getLiked() { return api<Music[]>('/music/getLikedSongs'); }
export async function getPlaylists() { return api<Playlist[]>('/music/playlist'); }
export async function getDashboard() { return api<Dashboard>('/music/Dashboard'); }