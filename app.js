const $ = (selector) => document.querySelector(selector);
const audio = $("#audio");
const STORAGE = { liked: "sonora-liked-v3", recent: "sonora-recent-v3", playlists: "sonora-playlists-v1" };

function readStore(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

const state = {
  tracks: [],
  current: null,
  liked: readStore(STORAGE.liked),
  recent: readStore(STORAGE.recent),
  playlists: readStore(STORAGE.playlists),
  shuffle: false,
  repeat: false,
  libraryFilter: "all",
  view: "home",
  searchHistory: [],
  historyIndex: -1,
  requestId: 0,
  searchTimer: null
};

const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

const formatTime = seconds => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};

function saveState() {
  try {
    localStorage.setItem(STORAGE.liked, JSON.stringify(state.liked));
    localStorage.setItem(STORAGE.recent, JSON.stringify(state.recent.slice(0, 50)));
    localStorage.setItem(STORAGE.playlists, JSON.stringify(state.playlists));
  } catch {
    toast("Your browser storage is full. Some changes may not be saved.");
  }
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2300);
}

function setLoading(message = "Finding something good...") {
  $("#track-list").innerHTML = `<div class="loading-state"><span class="loader"></span>${escapeHTML(message)}</div>`;
  $("#result-count").textContent = "SEARCHING";
}

function setEmpty(title, detail = "Try another search or choose a mood above.", error = false) {
  $("#track-list").innerHTML = `<div class="empty-state ${error ? "error" : ""}"><span>${error ? "!" : "♫"}</span><b>${escapeHTML(title)}</b><small>${escapeHTML(detail)}</small></div>`;
  $("#result-count").textContent = error ? "CONNECTION ISSUE" : "0 TRACKS";
}

function setActiveNav(view) {
  document.querySelectorAll(".rail-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });
}

function rememberSearch(term) {
  const last = state.searchHistory[state.searchHistory.length - 1];
  if (last !== term) {
    state.searchHistory = state.searchHistory.slice(0, state.historyIndex + 1);
    state.searchHistory.push(term);
    state.historyIndex = state.searchHistory.length - 1;
  }
}

async function searchMusic(rawTerm, heading = "Search results", options = {}) {
  const term = rawTerm.trim();
  if (!term) {
    toast("Type a song, artist or album to search.");
    $("#search-input").focus();
    return;
  }

  clearTimeout(state.searchTimer);
  const requestId = ++state.requestId;
  state.view = options.view || "search";
  state.libraryFilter = "all";
  setActiveNav(state.view);
  $("#track-heading").textContent = heading;
  $("#search-input").value = term;
  setLoading();

  if (!options.fromHistory) rememberSearch(term);

  try {
    const endpoint = new URL("https://itunes.apple.com/search");
    endpoint.search = new URLSearchParams({
      term,
      media: "music",
      entity: "song",
      limit: "35",
      country: "IN"
    });
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error("Catalogue request failed");
    const payload = await response.json();
    if (requestId !== state.requestId) return;

    state.tracks = (payload.results || [])
      .filter(track => track.trackId && track.trackName && track.previewUrl)
      .map(track => ({
        trackId: track.trackId,
        trackName: track.trackName,
        artistName: track.artistName || "Unknown artist",
        collectionName: track.collectionName || "Single",
        artworkUrl100: track.artworkUrl100 || "",
        previewUrl: track.previewUrl,
        trackViewUrl: track.trackViewUrl || "",
        durationMs: track.trackTimeMillis || 30000
      }));

    renderTracks();
    if (!state.tracks.length) setEmpty("No previews found for that search.", "Try a different artist or track. Preview availability varies.");
  } catch (error) {
    if (requestId !== state.requestId || error.name === "AbortError") return;
    setEmpty("The music catalogue couldn't be reached.", "Check your connection and try again in a moment.", true);
  }
}

function getLibraryTracks() {
  if (state.libraryFilter === "liked") return state.liked;
  if (state.libraryFilter === "recent") return state.recent;
  return [...state.liked, ...state.recent.filter(track => !state.liked.some(item => item.trackId === track.trackId))];
}

function renderLibrary() {
  const target = $("#library-list");
  const tracks = getLibraryTracks();
  const playlists = state.playlists;
  const trackMarkup = tracks.slice(0, 12).map(track => `
    <button class="library-item" data-library-track="${track.trackId}">
      <img src="${track.artworkUrl100}" alt="" loading="lazy">
      <span><b>${escapeHTML(track.trackName)}</b><small>${escapeHTML(track.artistName)}</small></span>
    </button>`).join("");
  const playlistMarkup = playlists.map(list => `
    <button class="library-item" data-playlist-id="${escapeHTML(list.id)}">
      <span class="playlist-cover">♫</span>
      <span><b>${escapeHTML(list.name)}</b><small>${list.trackIds.length} saved tracks</small></span>
    </button>`).join("");
  target.innerHTML = trackMarkup + playlistMarkup || '<div class="empty-note">Like a song or play a track and it will appear here.</div>';
}

function renderQueue() {
  const upcoming = state.tracks.filter(track => !state.current || track.trackId !== state.current.trackId).slice(0, 5);
  $("#queue-count").textContent = `${String(upcoming.length).padStart(2, "0")} TRACKS`;
  $("#queue-list").innerHTML = upcoming.map(track => `
    <button class="queue-item" data-queue-track="${track.trackId}">
      <img src="${track.artworkUrl100}" alt="" loading="lazy">
      <span><b>${escapeHTML(track.trackName)}</b><small>${escapeHTML(track.artistName)}</small></span>
      <span aria-hidden="true">▶</span>
    </button>`).join("") || '<div class="empty-note">Your next tracks will appear here.</div>';
}

function updateCurrentUI() {
  const track = state.current;
  if (!track) return;
  $("#player-title").textContent = track.trackName;
  $("#player-artist").textContent = track.artistName;
  $("#feature-title").textContent = track.trackName;
  $("#feature-artist").textContent = track.artistName;
  const largeArt = track.artworkUrl100.replace("100x100", "600x600");
  $("#feature-cover").innerHTML = `<img src="${largeArt || track.artworkUrl100}" alt="${escapeHTML(track.trackName)} artwork">`;
  $("#player-cover").innerHTML = `<img src="${track.artworkUrl100}" alt="">`;
  const liked = state.liked.some(item => item.trackId === track.trackId);
  ["#feature-like", "#player-like"].forEach(selector => {
    const button = $(selector);
    button.classList.toggle("liked", liked);
    button.textContent = liked ? "♥" : "♡";
    button.setAttribute("aria-pressed", String(liked));
  });
  $("#open-apple").disabled = !track.trackViewUrl;
}

function updatePlayButton() {
  const playing = !audio.paused && !audio.ended;
  $("#play-btn").textContent = playing ? "Ⅱ" : "▶";
  $("#play-btn").setAttribute("aria-label", playing ? "Pause" : "Play");
  $("#play-featured").querySelector("span").textContent = playing ? "Ⅱ" : "▶";
}

function renderTracks() {
  $("#track-list").innerHTML = state.tracks.length ? state.tracks.map((track, index) => {
    const active = state.current?.trackId === track.trackId;
    const liked = state.liked.some(item => item.trackId === track.trackId);
    return `<div class="track-row ${active ? "playing" : ""}" data-track-index="${index}" tabindex="0" role="button" aria-label="Play ${escapeHTML(track.trackName)}">
      <span class="number">${active && !audio.paused ? "♫" : String(index + 1).padStart(2, "0")}</span>
      <div class="track-info"><img src="${track.artworkUrl100}" alt="" loading="lazy"><div><b>${escapeHTML(track.trackName)}</b><small>${escapeHTML(track.artistName)}</small></div></div>
      <span class="track-album">${escapeHTML(track.collectionName)}</span>
      <span class="track-duration">${formatTime(track.durationMs / 1000)}</span>
      <button class="row-like ${liked ? "liked" : ""}" data-like-id="${track.trackId}" aria-label="${liked ? "Remove from liked songs" : "Add to liked songs"}" aria-pressed="${liked}">${liked ? "♥" : "♡"}</button>
    </div>`;
  }).join("") : '<div class="empty-state"><span>♫</span><b>Nothing to show just yet.</b><small>Search for a song or pick a mood to get started.</small></div>';

  $("#result-count").textContent = `${state.tracks.length} TRACKS`;
  renderLibrary();
  renderQueue();
  updateCurrentUI();
}

function selectTrack(track) {
  if (!track?.previewUrl) return toast("This track doesn't have a preview.");
  state.current = track;
  state.recent = [track, ...state.recent.filter(item => item.trackId !== track.trackId)].slice(0, 50);
  saveState();
  audio.pause();
  audio.src = track.previewUrl;
  audio.volume = Number($("#volume").value);
  audio.load();
  updateCurrentUI();
  renderTracks();
  audio.play().then(updatePlayButton).catch(() => {
    updatePlayButton();
    toast("Press play to start this preview.");
  });
}

function playIndex(index) {
  const track = state.tracks[index];
  if (track) selectTrack(track);
}

function nextTrack(direction = 1) {
  if (!state.tracks.length) return toast("Search for music first.");
  let index = state.tracks.findIndex(track => track.trackId === state.current?.trackId);
  if (state.shuffle && state.tracks.length > 1) {
    const choices = state.tracks.map((_, i) => i).filter(i => i !== index);
    index = choices[Math.floor(Math.random() * choices.length)];
  } else {
    index = index < 0 ? 0 : (index + direction + state.tracks.length) % state.tracks.length;
  }
  playIndex(index);
}

function toggleLike(track) {
  if (!track) return toast("Play or find a track first.");
  const exists = state.liked.some(item => item.trackId === track.trackId);
  state.liked = exists
    ? state.liked.filter(item => item.trackId !== track.trackId)
    : [track, ...state.liked];
  saveState();
  renderTracks();
  toast(exists ? "Removed from your liked songs." : "Added to your liked songs.");
}

function showLibrary(filter = "all") {
  state.view = "library";
  state.libraryFilter = filter;
  state.tracks = getLibraryTracks();
  $("#track-heading").textContent = filter === "liked" ? "Your liked songs" : filter === "recent" ? "Recently played" : "Your library";
  $("#search-input").value = "";
  setActiveNav(filter === "liked" ? "liked" : "library");
  document.querySelectorAll(".chip").forEach(chip => chip.classList.toggle("selected", chip.dataset.filter === filter));
  renderTracks();
}

function createPlaylist() {
  const name = window.prompt("Give your playlist a name");
  if (!name?.trim()) return;
  state.playlists.unshift({ id: `pl-${Date.now()}`, name: name.trim().slice(0, 36), trackIds: [] });
  saveState();
  renderLibrary();
  toast("Playlist created. Add tracks from the queue soon.");
}

function openPlaylist(id) {
  const playlist = state.playlists.find(item => item.id === id);
  if (!playlist) return;
  state.tracks = playlist.trackIds.map(trackId => [...state.liked, ...state.recent].find(track => track.trackId === trackId)).filter(Boolean);
  state.view = "playlist";
  $("#track-heading").textContent = playlist.name;
  renderTracks();
}

function goHistory(direction) {
  const next = state.historyIndex + direction;
  if (next < 0 || next >= state.searchHistory.length) return;
  state.historyIndex = next;
  searchMusic(state.searchHistory[next], `Results for “${state.searchHistory[next]}”`, { fromHistory: true });
}

document.addEventListener("click", event => {
  const like = event.target.closest("[data-like-id]");
  if (like) {
    const track = state.tracks.find(item => item.trackId === Number(like.dataset.likeId));
    toggleLike(track);
    return;
  }

  const row = event.target.closest("[data-track-index]");
  if (row) return playIndex(Number(row.dataset.trackIndex));

  const libraryTrack = event.target.closest("[data-library-track]");
  if (libraryTrack) {
    const track = [...state.liked, ...state.recent].find(item => item.trackId === Number(libraryTrack.dataset.libraryTrack));
    if (track) {
      if (!state.tracks.some(item => item.trackId === track.trackId)) state.tracks.unshift(track);
      selectTrack(track);
    }
    return;
  }

  const queueTrack = event.target.closest("[data-queue-track]");
  if (queueTrack) {
    const track = state.tracks.find(item => item.trackId === Number(queueTrack.dataset.queueTrack));
    if (track) selectTrack(track);
    return;
  }

  const playlist = event.target.closest("[data-playlist-id]");
  if (playlist) return openPlaylist(playlist.dataset.playlistId);

  const mood = event.target.closest("[data-mood]");
  if (mood) {
    const terms = { indie: "indie alternative", chill: "chill acoustic", pop: "pop hits", focus: "lofi instrumental" };
    return searchMusic(terms[mood.dataset.mood], `${mood.dataset.mood} mood`);
  }

  const nav = event.target.closest("[data-view]");
  if (nav) {
    const view = nav.dataset.view;
    setActiveNav(view);
    if (view === "search") $("#search-input").focus();
    if (view === "home") searchMusic("indie pop", "In your rotation", { view: "home" });
    if (view === "liked") showLibrary("liked");
    if (view === "library") showLibrary("all");
    return;
  }

  const filter = event.target.closest("[data-filter]");
  if (filter) showLibrary(filter.dataset.filter);
});

document.addEventListener("keydown", event => {
  const row = event.target.closest("[data-track-index]");
  if (row && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    playIndex(Number(row.dataset.trackIndex));
  }
  if (event.target.matches("input, textarea")) return;
  if (event.code === "Space") {
    event.preventDefault();
    $("#play-btn").click();
  }
  if (event.code === "ArrowRight" && event.altKey) nextTrack(1);
  if (event.code === "ArrowLeft" && event.altKey) nextTrack(-1);
});

$("#search-input").addEventListener("keydown", event => {
  if (event.key === "Enter") searchMusic(event.currentTarget.value, `Results for “${event.currentTarget.value.trim()}”`);
});
$("#search-input").addEventListener("input", event => {
  const value = event.currentTarget.value.trim();
  clearTimeout(state.searchTimer);
  if (value.length >= 3) state.searchTimer = setTimeout(() => searchMusic(value, `Results for “${value}”`), 650);
});
$("#play-btn").addEventListener("click", () => {
  if (!audio.src) return state.tracks.length ? playIndex(0) : toast("Search for a track first.");
  if (audio.paused) audio.play().catch(() => toast("Playback couldn't start. Try again."));
  else audio.pause();
});
$("#next-btn").addEventListener("click", () => nextTrack(1));
$("#prev-btn").addEventListener("click", () => {
  if (audio.currentTime > 3) audio.currentTime = 0;
  else nextTrack(-1);
});
$("#shuffle-btn").addEventListener("click", () => {
  state.shuffle = !state.shuffle;
  $("#shuffle-btn").classList.toggle("liked", state.shuffle);
  toast(state.shuffle ? "Shuffle is on." : "Shuffle is off.");
});
$("#repeat-btn").addEventListener("click", () => {
  state.repeat = !state.repeat;
  audio.loop = state.repeat;
  $("#repeat-btn").classList.toggle("liked", state.repeat);
  toast(state.repeat ? "Repeat is on." : "Repeat is off.");
});
$("#volume").addEventListener("input", event => { audio.volume = Number(event.target.value); });
$("#progress").addEventListener("input", event => {
  if (Number.isFinite(audio.duration)) audio.currentTime = Number(event.target.value);
});
audio.addEventListener("loadedmetadata", () => {
  $("#progress").max = audio.duration || 30;
  $("#duration").textContent = formatTime(audio.duration);
});
audio.addEventListener("timeupdate", () => {
  $("#progress").value = audio.currentTime;
  $("#current-time").textContent = formatTime(audio.currentTime);
});
audio.addEventListener("play", updatePlayButton);
audio.addEventListener("pause", updatePlayButton);
audio.addEventListener("ended", () => {
  if (!state.repeat) nextTrack(1);
  updatePlayButton();
});
audio.addEventListener("error", () => toast("That preview is unavailable. Try another track."));
$("#play-featured").addEventListener("click", () => {
  if (state.current && audio.src) $("#play-btn").click();
  else nextTrack(1);
});
$("#shuffle-featured").addEventListener("click", () => {
  state.shuffle = true;
  $("#shuffle-btn").classList.add("liked");
  nextTrack(1);
});
$("#feature-like").addEventListener("click", () => toggleLike(state.current));
$("#player-like").addEventListener("click", () => toggleLike(state.current));
$("#open-apple").addEventListener("click", () => {
  if (state.current?.trackViewUrl) window.open(state.current.trackViewUrl, "_blank", "noopener,noreferrer");
});
$("#refresh-moods").addEventListener("click", () => searchMusic("new indie pop", "More to discover"));
$("#add-playlist").addEventListener("click", createPlaylist);
$("#sort-library").addEventListener("click", () => showLibrary("recent"));
document.querySelectorAll(".chip").forEach(chip => chip.addEventListener("click", () => showLibrary(chip.dataset.filter)));
$(".history-buttons button:first-child").addEventListener("click", () => goHistory(-1));
$(".history-buttons button:last-child").addEventListener("click", () => goHistory(1));
$(".brand-mark").addEventListener("click", event => {
  event.preventDefault();
  searchMusic("indie pop", "In your rotation", { view: "home" });
});

renderLibrary();
renderQueue();
searchMusic("indie pop", "In your rotation", { view: "home" });
