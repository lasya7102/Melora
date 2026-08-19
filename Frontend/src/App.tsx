import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Router, Route, Switch, useLocation, useParams } from 'wouter';
import { ArrowLeft, ArrowUpRight, Clock3, Filter, Heart, Library, LockKeyhole, Mail, Moon, Play, Save, Search, ShieldCheck, Sparkles, Sun, Upload, UserRound } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api, artistName, getAlbums, getDashboard, getLiked, getMusic, getPlaylists, getRecent, idOf, type Album, type Dashboard, type Music, type Playlist, type User } from '@/lib/api';
import { PlayerProvider, usePlayer } from '@/context/player';
import { AlbumCard, Button, Cover, LoadingRows, SectionHeading, Shell, SongCard, SongRow, StatePanel, useTheme } from '@/components/melora';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const asList = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : ((value as { items?: T[]; musics?: T[]; songs?: T[]; results?: T[] } | null)?.items || (value as { musics?: T[] } | null)?.musics || (value as { songs?: T[] } | null)?.songs || (value as { results?: T[] } | null)?.results || []);
function useRequest<T>(request: () => Promise<T>, deps: unknown[]) { const [state, setState] = useState({ data: null as T | null, loading: true, error: false }); const reload = () => { setState((s) => ({ ...s, loading: true, error: false })); request().then((data) => setState({ data, loading: false, error: false })).catch(() => setState({ data: null, loading: false, error: true })); }; useEffect(reload, deps); return { ...state, reload }; }
function useSession() { const [user, setUser] = useState<User | null>(() => { try { return JSON.parse(localStorage.getItem('melora-user') || 'null') as User | null; } catch { return null; } }); const save = (next: User | null) => { setUser(next); next ? localStorage.setItem('melora-user', JSON.stringify(next)) : localStorage.removeItem('melora-user'); }; return { user, save }; }
function Title({ eyebrow, title, body, children }: { eyebrow?: string; title: string; body?: string; children?: ReactNode }) { return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div>{eyebrow && <p className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-accent">{eyebrow}</p>}<h1 className="display-font text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">{title}</h1>{body && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{body}</p>}</div>{children}</div>; }

function Auth({
  mode,
  onLogin,
}: {
  mode: 'login' | 'register';
  onLogin: (u: User) => void;
}) {
  const [, go] = useLocation();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    setBusy(true);
    setError('');

    try {
      // Backend expects:
      // Login    -> { email, password }
      // Register -> { username, email, password }

      const result = await api<{
        message: string;
        user: User;
      }>(
        mode === 'login' ? '/auth/login' : '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(
            mode === 'login'
              ? {
                  email: form.email,
                  password: form.password,
                }
              : {
                  username: form.username,
                  email: form.email,
                  password: form.password,
                }
          ),
        }
      );

      // Backend returns { message, user }
      onLogin(result.user);

      // Go to home after successful login/register
      go('/');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'We could not complete that request.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-[100dvh] bg-background lg:grid-cols-[1fr_1fr]">
      {/* Left side */}
      <div className="relative hidden overflow-hidden bg-[#17302f] p-12 text-[#f7f1e7] lg:flex lg:flex-col lg:justify-between">
        <div>
          <Link
            href="/"
            className="flex items-center gap-3 text-lg font-extrabold"
            data-testid="link-auth-logo"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-[#c4ddc6] text-[#17302f]">
              M
            </span>
            melora.
          </Link>

          <div className="mt-32 max-w-md">
            <p className="mono text-[10px] uppercase tracking-[.2em] text-[#e9a482]">
              A quieter way to listen
            </p>

            <h1 className="display-font mt-5 text-6xl font-extrabold leading-[.98] tracking-[-.06em]">
              Make room for the music.
            </h1>

            <p className="mt-6 max-w-sm text-sm leading-6 text-[#bdd0c4]">
              A considered home for discovery, deep listening, and the records
              you return to.
            </p>
          </div>
        </div>

        <p className="mono text-[10px] uppercase tracking-[.15em] text-[#91c4a9]/70">
          Melora / listening room no. 01
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[410px]">

          {/* Mobile logo */}
          <Link
            href="/"
            className="mb-12 block text-center display-font text-2xl font-extrabold lg:hidden"
            data-testid="link-auth-logo-mobile"
          >
            melora<span className="text-accent">.</span>
          </Link>

          <p className="mono text-[10px] uppercase tracking-[.2em] text-accent">
            {mode === 'login' ? 'Welcome back' : 'Join the room'}
          </p>

          <h2 className="display-font mt-3 text-3xl font-extrabold">
            {mode === 'login'
              ? 'Return to your collection.'
              : 'Start a more intentional listen.'}
          </h2>

          <p className="mt-3 text-sm text-muted-foreground">
            {mode === 'login'
              ? 'Sign in to pick up where you left off.'
              : 'Create an account for your personal listening room.'}
          </p>

          <form onSubmit={submit} className="mt-9 space-y-4">

            {/* Username - Register only */}
            {mode === 'register' && (
              <label className="block">
                <span className="mb-2 block text-xs font-bold">
                  Username
                </span>

                <input
                  required
                  value={form.username}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      username: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-input bg-card px-4 py-3 outline-none focus:border-primary"
                  placeholder="Your listening name"
                  data-testid="input-username"
                />
              </label>
            )}

            {/* Email */}
            <label className="block">
              <span className="mb-2 block text-xs font-bold">
                Email
              </span>

              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-3.5 text-muted-foreground"
                />

                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 outline-none focus:border-primary"
                  placeholder="you@example.com"
                  data-testid="input-email"
                />
              </div>
            </label>

            {/* Password */}
            <label className="block">
              <span className="mb-2 block text-xs font-bold">
                Password
              </span>

              <div className="relative">
                <LockKeyhole
                  size={16}
                  className="absolute left-4 top-3.5 text-muted-foreground"
                />

                <input
                  required
                  minLength={6}
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 outline-none focus:border-primary"
                  placeholder="At least 6 characters"
                  data-testid="input-password"
                />
              </div>
            </label>

            {/* Error */}
            {error && (
              <p
                className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
                data-testid="status-auth-error"
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <Button type="submit" disabled={busy}>
              {busy
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}

              <ArrowUpRight size={16} />
            </Button>
          </form>

          {/* Switch login/register */}
          <p className="mt-7 text-center text-sm text-muted-foreground">
            {mode === 'login'
              ? 'New to Melora?'
              : 'Already have an account?'}

            {' '}

            <Link
              href={mode === 'login' ? '/register' : '/login'}
              className="font-bold text-primary"
              data-testid="link-auth-switch"
            >
              {mode === 'login' ? 'Create account' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
function Home({ user }: { user: User | null }) { const songsReq = useRequest(() => getMusic('page=1&limit=12&sortBy=createdAt&order=desc'), []); const albumsReq = useRequest(() => getAlbums('page=1&limit=8&sortBy=createdAt&order=desc'), []); const recentReq = useRequest(getRecent, []); const songs = asList<Music>(songsReq.data); const albums = asList<Album>(albumsReq.data); const recent = asList<{ song: Music }>(recentReq.data).map((x) => x.song).filter(Boolean); const h = new Date().getHours(); const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; return <><div className="rise relative overflow-hidden rounded-[1.6rem] bg-[#17302f] px-6 py-8 text-[#f7f1e7] sm:px-10 sm:py-11"><div className="relative z-10 max-w-2xl"><p className="mono text-[10px] uppercase tracking-[.2em] text-[#e9a482]">{greet}, {user?.username || 'listener'}</p><h1 className="display-font mt-4 text-4xl font-extrabold leading-[1.02] tracking-[-.05em] sm:text-6xl">What will you make<br className="hidden sm:block" /> room for today?</h1><p className="mt-5 max-w-md text-sm leading-6 text-[#bdd0c4]">The best listening sessions begin with a little curiosity.</p><Link href="/search" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#c4ddc6] px-4 py-3 text-sm font-bold text-[#17302f]" data-testid="link-start-discovery">Start discovering <ArrowUpRight size={16} /></Link></div><div className="absolute -right-24 -top-32 size-[430px] rounded-full border border-[#c4ddc6]/20" /><div className="absolute right-5 top-16 size-[270px] rounded-full border border-[#e9a482]/30" /></div><div className="mt-10"><SectionHeading eyebrow="Your shortcuts" title="Pick up where you left off" /><div className="grid gap-3 sm:grid-cols-3"><Link href="/recent" className="flex min-h-[96px] items-center justify-between rounded-2xl bg-secondary p-5 transition hover:bg-primary hover:text-primary-foreground" data-testid="link-quick-recent"><div><p className="text-xs font-bold uppercase tracking-wider opacity-60">Your rotation</p><p className="mt-2 display-font text-xl font-bold">Recently played</p></div><Clock3 /></Link><Link href="/liked" className="flex min-h-[96px] items-center justify-between rounded-2xl bg-accent p-5 text-accent-foreground" data-testid="link-quick-liked"><div><p className="text-xs font-bold uppercase tracking-wider opacity-70">Your collection</p><p className="mt-2 display-font text-xl font-bold">Liked songs</p></div><Heart /></Link><Link href="/library" className="flex min-h-[96px] items-center justify-between rounded-2xl border border-border bg-card p-5" data-testid="link-quick-library"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Everything saved</p><p className="mt-2 display-font text-xl font-bold">Your library</p></div><Library className="text-primary" /></Link></div></div><section className="mt-11">{recentReq.loading ? <><SectionHeading title="Recently played" /><LoadingRows /></> : recent.length ? <><SectionHeading title="Recently played" /><div className="flex gap-5 overflow-x-auto pb-2">{recent.slice(0, 7).map((s) => <SongCard key={idOf(s)} song={s} list={recent} />)}</div></> : null}</section><section className="mt-11"><SectionHeading eyebrow="Fresh from the room" title="Popular in Melora" />{songsReq.loading ? <LoadingRows /> : songsReq.error ? <StatePanel kind="error" title="Your music is taking a moment" body="We couldn't load the latest songs right now." action={<Button onClick={songsReq.reload}>Try again</Button>} /> : songs.length ? <div className="rounded-2xl border border-border bg-card p-2">{songs.slice(0, 7).map((s, i) => <SongRow key={idOf(s) || i} song={s} list={songs} index={i} />)}</div> : <StatePanel kind="empty" title="Your listening room is quiet" body="Explore music to see songs here." action={<Link href="/search"><Button>Find music <Search size={16} /></Button></Link>} />}</section><section className="mt-11">{albumsReq.loading ? <LoadingRows /> : albumsReq.data && asList<Album>(albumsReq.data).length ? <><SectionHeading eyebrow="Curated shelves" title="Albums to spend time with" /><div className="flex gap-5 overflow-x-auto pb-2">{albums.map((a) => <AlbumCard key={idOf(a)} album={a} />)}</div></> : null}</section></>; }

function SearchPage() { const [term, setTerm] = useState(''); const [submitted, setSubmitted] = useState(''); const req = useRequest(() => submitted ? api<unknown>(`/music/searchAll?title=${encodeURIComponent(submitted)}`) : Promise.resolve(null), [submitted]); const data = req.data as { songs?: Music[]; musics?: Music[]; albums?: Album[] } | null; const songs = asList<Music>(data?.songs || data?.musics || (Array.isArray(req.data) ? req.data : null)); const albums = asList<Album>(data?.albums); return <><Title eyebrow="Find your next listen" title="Search" body="Search across songs, albums, and artists in your Melora collection." /><form onSubmit={(e) => { e.preventDefault(); setSubmitted(term.trim()); }} className="relative max-w-3xl"><Search size={21} className="absolute left-5 top-4 text-muted-foreground" /><input autoFocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search by title, artist, or album" className="w-full rounded-2xl border border-input bg-card px-14 py-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="input-search" /><button className="absolute right-2 top-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" data-testid="button-search">Search</button></form>{!submitted ? <div className="mt-14 rounded-2xl border border-dashed border-border bg-card/40 py-16 text-center"><Sparkles className="mx-auto text-accent" size={28} /><h2 className="display-font mt-4 text-xl font-bold">Search with intention</h2><p className="mt-2 text-sm text-muted-foreground">Try a song title, artist name, or album.</p></div> : req.loading ? <div className="mt-10"><LoadingRows /></div> : req.error ? <StatePanel kind="error" title="Search is unavailable" body="We couldn't reach your music collection." action={<Button onClick={req.reload}>Try again</Button>} /> : !songs.length && !albums.length ? <StatePanel kind="empty" title="No results found" body="Try searching for a different song, artist, or album." /> : <div className="mt-10 space-y-10">{songs.length > 0 && <section><SectionHeading title="Songs" /><div className="rounded-2xl border border-border bg-card p-2">{songs.map((s, i) => <SongRow key={idOf(s) || i} song={s} list={songs} index={i} />)}</div></section>}{albums.length > 0 && <section><SectionHeading title="Albums" /><div className="flex gap-5 overflow-x-auto">{albums.map((a) => <AlbumCard key={idOf(a)} album={a} />)}</div></section>}</div>}</>; }

function LibraryPage() { const initialTab = new URLSearchParams(window.location.search).get('tab'); const [tab, setTab] = useState<'songs' | 'albums' | 'artists' | 'playlists'>((initialTab === 'albums' || initialTab === 'artists' || initialTab === 'playlists') ? initialTab : 'songs'); const [sort, setSort] = useState('createdAt'); const [order, setOrder] = useState('desc'); const songsReq = useRequest(() => getMusic(`page=1&limit=50&sortBy=${sort}&order=${order}`), [sort, order]); const albumsReq = useRequest(() => getAlbums(`page=1&limit=50&sortBy=${sort}&order=${order}`), [sort, order]); const playlistsReq = useRequest(getPlaylists, []); const songs = asList<Music>(songsReq.data); const albums = asList<Album>(albumsReq.data); const playlists = asList<Playlist>(playlistsReq.data); const artists = Array.from(new Map(songs.map((song) => { const artist = song.artist; const key = typeof artist === 'object' ? idOf(artist) || artistName(artist) : artistName(artist); return [key, artist]; })).values()); return <><Title eyebrow="The archive" title="Your library" body="Everything you've chosen to keep close, in one considered place." /><div className="mb-6 flex flex-wrap justify-between gap-3"><div className="flex max-w-full overflow-x-auto rounded-xl bg-secondary p-1">{(['songs', 'albums', 'artists', 'playlists'] as const).map((x) => <button key={x} onClick={() => setTab(x)} className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${tab === x ? 'bg-card shadow-sm' : 'text-muted-foreground'}`} data-testid={`button-library-${x}`}>{x}</button>)}</div>{(tab === 'songs' || tab === 'albums') && <div className="flex items-center gap-2"><Filter size={16} className="text-muted-foreground" /><select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold" data-testid="select-library-sort"><option value="createdAt">Recently added</option><option value="title">Title</option><option value="playCount">Most played</option></select><button onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')} className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold" data-testid="button-library-order">{order === 'desc' ? '↓' : '↑'}</button></div>}</div>{tab === 'songs' ? songsReq.loading ? <LoadingRows /> : songsReq.error ? <StatePanel kind="error" title="Library unavailable" body="We couldn't load your songs." action={<Button onClick={songsReq.reload}>Try again</Button>} /> : songs.length ? <div className="rounded-2xl border border-border bg-card p-2">{songs.map((s, i) => <SongRow key={idOf(s) || i} song={s} list={songs} index={i} />)}</div> : <StatePanel kind="empty" title="Your library is empty" body="Start exploring music and build your collection." action={<Link href="/search"><Button>Explore music <Search size={16} /></Button></Link>} /> : tab === 'albums' ? albumsReq.loading ? <LoadingRows /> : albumsReq.error ? <StatePanel kind="error" title="Albums unavailable" body="We couldn't load your albums." action={<Button onClick={albumsReq.reload}>Try again</Button>} /> : albums.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">{albums.map((a) => <AlbumCard key={idOf(a)} album={a} />)}</div> : <StatePanel kind="empty" title="No albums yet" body="Albums you discover or create will live here." /> : tab === 'artists' ? artists.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{artists.map((artist, i) => <div key={typeof artist === 'object' ? idOf(artist) || i : String(artist)} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"><span className="grid size-12 place-items-center rounded-full bg-primary/12 text-primary"><UserRound size={20} /></span><div><p className="font-bold">{artistName(artist)}</p><p className="text-xs text-muted-foreground">Artist in your library</p></div></div>)}</div> : <StatePanel kind="empty" title="No artists yet" body="Artists connected to your saved songs will appear here." /> : playlistsReq.loading ? <LoadingRows /> : playlistsReq.error ? <StatePanel kind="error" title="Playlists unavailable" body="We couldn't load your playlists." action={<Button onClick={playlistsReq.reload}>Try again</Button>} /> : playlists.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{playlists.map((p, i) => <div key={idOf(p) || i} className="rounded-2xl border border-border bg-card p-5"><p className="display-font text-xl font-bold">{p.title}</p><p className="mt-2 text-xs text-muted-foreground">{p.songs?.length || 0} songs</p></div>)}</div> : <StatePanel kind="empty" title="No playlists yet" body="Create a playlist when you want to gather a particular mood." />}</>; }

function Liked() { const req = useRequest(getLiked, []); const songs = asList<Music>(req.data); const { playSong } = usePlayer(); const unlike = async (s: Music) => { await api(`/music/unlike/${idOf(s)}`, { method: 'DELETE' }).catch(() => undefined); req.reload(); }; return <><div className="relative overflow-hidden rounded-[1.5rem] bg-[#d58364] px-6 py-8 text-[#211d1b] sm:px-10 sm:py-10"><p className="mono text-[10px] uppercase tracking-[.2em] opacity-70">Your collection</p><h1 className="display-font mt-3 text-4xl font-extrabold tracking-[-.04em] sm:text-5xl">Liked songs</h1><p className="mt-3 text-sm opacity-75">{req.loading ? 'Loading your collection…' : `${songs.length} ${songs.length === 1 ? 'song' : 'songs'} you chose to keep.`}</p><Heart className="absolute -bottom-10 right-8 size-44 rotate-[-15deg] text-[#f4c0a7]/50" strokeWidth={1} /></div><div className="mt-7 flex gap-3"><Button onClick={() => songs[0] && playSong(songs[0], songs)} disabled={!songs.length}><Play size={16} fill="currentColor" /> Play all</Button><Button variant="secondary">Add to playlist</Button></div><div className="mt-7">{req.loading ? <LoadingRows /> : req.error ? <StatePanel kind="error" title="Likes are unavailable" body="We couldn't load your saved songs." action={<Button onClick={req.reload}>Try again</Button>} /> : songs.length ? <div className="rounded-2xl border border-border bg-card p-2">{songs.map((s, i) => <SongRow key={idOf(s) || i} song={s} list={songs} index={i} liked onLike={unlike} />)}</div> : <StatePanel kind="empty" title="Nothing saved yet" body="When a song catches you, tap the heart and it will appear here." action={<Link href="/search"><Button>Find something to love <Search size={16} /></Button></Link>} />}</div></>; }

function Recent() { const req = useRequest(getRecent, []); const songs = asList<{ song: Music }>(req.data).map((x) => x.song).filter(Boolean); return <><Title eyebrow="Your listening history" title="Recently played" body="A little trail of the music that has been with you lately." />{req.loading ? <LoadingRows /> : req.error ? <StatePanel kind="error" title="History is unavailable" body="We couldn't load your recent listening." action={<Button onClick={req.reload}>Try again</Button>} /> : songs.length ? <div className="rounded-2xl border border-border bg-card p-2">{songs.map((s, i) => <SongRow key={`${idOf(s)}-${i}`} song={s} list={songs} index={i} />)}</div> : <StatePanel kind="empty" title="Your history starts here" body="Play a song and Melora will keep your recent listening close." action={<Link href="/search"><Button>Search music <Search size={16} /></Button></Link>} />}</>; }

function AlbumPage() { const { albumId } = useParams<{ albumId: string }>(); const req = useRequest(() => api<Album>(`/music/albums/${albumId}`), [albumId]); const album = req.data; const songs = asList<Music>(album?.musics); const { playSong } = usePlayer(); if (req.loading) return <><div className="skeleton h-72 rounded-2xl" /><LoadingRows /></>; if (req.error || !album) return <StatePanel kind="error" title="Album unavailable" body="This album could not be loaded." action={<Link href="/library"><Button>Back to library</Button></Link>} />; return <><Link href="/library" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground" data-testid="link-back-library"><ArrowLeft size={16} /> Library</Link><div className="rounded-[1.5rem] border border-border bg-card p-5 sm:p-8"><div className="flex flex-col items-start gap-7 sm:flex-row sm:items-end"><Cover src={album.coverImage} title={album.title} className="size-48 shrink-0 rounded-xl shadow-xl sm:size-60" /><div><p className="mono text-[10px] uppercase tracking-[.2em] text-accent">Album</p><h1 className="display-font mt-2 text-4xl font-extrabold tracking-[-.04em] sm:text-5xl">{album.title}</h1><p className="mt-3 text-sm font-semibold">{artistName(album.artist)}</p><p className="mt-2 text-xs text-muted-foreground">{album.createdAt ? new Date(album.createdAt).getFullYear() : '—'} · {songs.length} songs</p><div className="mt-6"><Button onClick={() => songs[0] && playSong(songs[0], songs)}><Play size={16} fill="currentColor" /> Play album</Button></div></div></div></div><div className="mt-8 rounded-2xl border border-border bg-card p-2">{songs.length ? songs.map((s, i) => <SongRow key={idOf(s) || i} song={s} list={songs} index={i} />) : <StatePanel kind="empty" title="No tracks in this album" body="Tracks will appear here when the album is populated." />}</div></>; }

function Profile({ user }: { user: User | null }) { const [name, setName] = useState(user?.username || ''); const [message, setMessage] = useState(''); const save = async (e: FormEvent) => { e.preventDefault(); try { await api('/auth/update', { method: 'PATCH', body: JSON.stringify({ username: name }) }); setMessage('Profile updated.'); } catch { setMessage('We could not update your profile.'); } }; return <><Title eyebrow="Your account" title="Profile" body="Keep your identity in the listening room up to date." /><div className="grid max-w-4xl gap-5 lg:grid-cols-[220px_1fr]"><div className="rounded-2xl border border-border bg-card p-6 text-center"><span className="mx-auto grid size-24 place-items-center rounded-full bg-primary text-3xl font-extrabold text-primary-foreground">{(user?.username || 'G').slice(0, 1).toUpperCase()}</span><h2 className="display-font mt-4 text-xl font-bold">{user?.username || 'Guest listener'}</h2><p className="mt-1 text-sm text-muted-foreground">{user?.role || 'Listener'} account</p></div><form onSubmit={save} className="rounded-2xl border border-border bg-card p-6 sm:p-8"><div className="flex items-center gap-3 border-b border-border pb-5"><UserRound className="text-primary" size={20} /><div><h2 className="font-bold">Personal details</h2><p className="text-xs text-muted-foreground">This is how Melora knows you.</p></div></div><label className="mt-6 block max-w-md"><span className="mb-2 block text-xs font-bold">Username</span><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" data-testid="input-profile-username" /></label><label className="mt-5 block max-w-md"><span className="mb-2 block text-xs font-bold">Email</span><input value={user?.email || ''} disabled className="w-full rounded-xl border border-input bg-muted px-4 py-3 text-muted-foreground" data-testid="input-profile-email" /></label>{message && <p className="mt-5 text-sm text-primary">{message}</p>}<div className="mt-7"><Button type="submit"><Save size={16} /> Save changes</Button></div></form></div></>; }

function Settings() { const { theme, toggleTheme } = useTheme(); return <><Title eyebrow="Preferences" title="Settings" body="Tune Melora to your room, your account, and your habits." /><div className="max-w-3xl space-y-4"><div className="rounded-2xl border border-border bg-card p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold">Appearance</h2><p className="mt-1 text-sm text-muted-foreground">Choose the atmosphere you want while listening.</p></div><button onClick={toggleTheme} className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-xs font-bold" data-testid="button-settings-theme">{theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />} {theme === 'dark' ? 'Dark' : 'Light'}</button></div></div><div className="rounded-2xl border border-border bg-card p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 text-primary" size={20} /><div><h2 className="font-bold">Account & privacy</h2><p className="mt-1 text-sm text-muted-foreground">Your account data is handled by the Melora service. Use your profile to update personal details and your password.</p><Link href="/profile" className="mt-4 inline-flex text-sm font-bold text-primary" data-testid="link-settings-profile">Manage profile <ArrowUpRight className="ml-1" size={15} /></Link></div></div></div></div></>; }

function ArtistDashboard() { const req = useRequest(getDashboard, []); const data = req.data as Dashboard | null; const top = asList<Music>(data?.topSongs); if (req.loading) return <><Title eyebrow="Artist studio" title="Your dashboard" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((x) => <div key={x} className="skeleton h-28 rounded-2xl" />)}</div></>; if (req.error) return <StatePanel kind="error" title="Dashboard unavailable" body="We couldn't load your artist analytics." action={<Button onClick={req.reload}>Try again</Button>} />; return <><Title eyebrow="Artist studio" title="Your dashboard" body="A clear view of what your listeners are spending time with."><Link href="/artist/upload"><Button><Upload size={16} /> Upload music</Button></Link></Title><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Total songs', data?.totalSongs], ['Total albums', data?.totalAlbums], ['Total plays', data?.totalPlays], ['Total likes', data?.totalLikes]].map(([label, value], i) => <div key={String(label)} className={`rounded-2xl border border-border bg-card p-5 ${i === 2 ? 'border-primary/30 bg-primary/7' : ''}`}><p className="text-xs font-bold text-muted-foreground">{label}</p><p className="mono mt-4 text-3xl font-bold">{value ?? '—'}</p></div>)}</div><div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]"><section><SectionHeading title="Top songs" /><div className="rounded-2xl border border-border bg-card p-2">{top.length ? top.map((s, i) => <SongRow key={idOf(s) || i} song={s} list={top} index={i} />) : <StatePanel kind="empty" title="No play data yet" body="Top songs appear after listeners press play." />}</div></section><section className="rounded-2xl bg-[#17302f] p-6 text-[#f7f1e7]"><p className="mono text-[10px] uppercase tracking-[.18em] text-[#e9a482]">Release room</p><h3 className="display-font mt-3 text-2xl font-bold">Keep the shelf growing.</h3><p className="mt-3 text-sm leading-6 text-[#bdd0c4]">Upload a new single or shape a collection into an album.</p><Link href="/artist/upload" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#c4ddc6] px-4 py-2.5 text-sm font-bold text-[#17302f]" data-testid="link-dashboard-upload">Open uploader <ArrowUpRight size={16} /></Link></section></div></>; }

function UploadPage() { const [mode, setMode] = useState<'song' | 'album'>('song'); const [title, setTitle] = useState(''); const [music, setMusic] = useState<File | null>(null); const [cover, setCover] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [status, setStatus] = useState(''); const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true); setStatus(''); const form = new FormData(); form.append('title', title); if (music) form.append(mode === 'song' ? 'music' : 'musics', music); if (cover) form.append('coverImage', cover); try { await api(mode === 'song' ? '/music/upload' : '/music/album', { method: 'POST', body: form }); setStatus('Published successfully.'); setTitle(''); setMusic(null); setCover(null); } catch { setStatus('We could not publish this release.'); } finally { setBusy(false); } }; return <><Title eyebrow="Artist studio" title="Add to the shelf" body="Share a new release with the Melora listening room." /><div className="mb-6 flex max-w-xs rounded-xl bg-secondary p-1">{(['song', 'album'] as const).map((x) => <button key={x} onClick={() => setMode(x)} className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold capitalize ${mode === x ? 'bg-card shadow-sm' : 'text-muted-foreground'}`} data-testid={`button-upload-${x}`}>{x === 'song' ? 'Single' : 'Album'}</button>)}</div><form onSubmit={submit} className="grid max-w-4xl gap-6 lg:grid-cols-[1fr_1.1fr]"><label className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-7 text-center hover:bg-primary/10"><Upload size={30} className="text-primary" /><h2 className="mt-4 display-font text-xl font-bold">Add your audio</h2><p className="mt-2 text-sm text-muted-foreground">Choose a file from your device.</p><input required type="file" accept="audio/*" onChange={(e) => setMusic(e.target.files?.[0] || null)} className="sr-only" data-testid="input-upload-music" /><span className="mt-6 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">{music ? music.name : 'Browse files'}</span></label><div className="rounded-2xl border border-border bg-card p-6 sm:p-8"><label className="block"><span className="mb-2 block text-xs font-bold">Title</span><input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" placeholder={mode === 'song' ? 'Name this song' : 'Name this album'} data-testid="input-upload-title" /></label><label className="mt-5 block"><span className="mb-2 block text-xs font-bold">Cover image <span className="font-normal text-muted-foreground">(optional)</span></span><input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} className="block w-full rounded-xl border border-input bg-background px-3 py-3 text-xs" data-testid="input-upload-cover" /></label>{status && <p className={`mt-5 text-sm ${status.includes('success') ? 'text-primary' : 'text-destructive'}`} data-testid="status-upload">{status}</p>}<div className="mt-8"><Button type="submit" disabled={busy}>{busy ? 'Publishing…' : `Publish ${mode}`} <ArrowUpRight size={16} /></Button></div></div></form></>; }

function Routes({ user, save }: { user: User | null; save: (u: User | null) => void }) { const page = (node: ReactNode) => <Shell user={user}>{node}</Shell>; return <Switch><Route path="/login">{() => <Auth mode="login" onLogin={save} />}</Route><Route path="/register">{() => <Auth mode="register" onLogin={save} />}</Route><Route path="/albums/:albumId">{() => page(<AlbumPage />)}</Route><Route path="/search">{() => page(<SearchPage />)}</Route><Route path="/library">{() => page(<LibraryPage />)}</Route><Route path="/liked">{() => page(<Liked />)}</Route><Route path="/recent">{() => page(<Recent />)}</Route><Route path="/profile">{() => page(<Profile user={user} />)}</Route><Route path="/settings">{() => page(<Settings />)}</Route><Route path="/artist/dashboard">{() => page(<ArtistDashboard />)}</Route><Route path="/artist/upload">{() => page(<UploadPage />)}</Route><Route path="/">{() => page(<Home user={user} />)}</Route><Route component={NotFound} /></Switch>; }
function Root() { const session = useSession(); const [location] = useLocation(); return <PlayerProvider><ErrorBoundary resetKey={location}><Routes user={session.user} save={session.save} /></ErrorBoundary></PlayerProvider>; }
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><Router base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Root /></Router><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;